import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { selarProvider } from '@/lib/payments/selar';
import { sendServicePdfEmail, sendAdminOrderNotificationEmail } from '@/lib/email/delivery';
import { sendWhatsAppPostPaymentConfirmation } from '@/lib/whatsapp/notifications';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ entitlements: [], orders: [] }, { status: 200 });
    }

    const admin = await createAdminClient();
    const userEmail = user.email?.toLowerCase().trim();

    // 0. AUTO-RECONCILIATION: Check for any PENDING Selar orders for this user
    // If Selar confirms payment, autoverify and approve immediately without waiting for admin
    let pendingQuery = admin
      .from('orders')
      .select('*')
      .eq('payment_status', 'PENDING');

    if (userEmail) {
      pendingQuery = pendingQuery.or(`customer_id.eq.${user.id},customer_email.ilike.${userEmail}`);
    } else {
      pendingQuery = pendingQuery.eq('customer_id', user.id);
    }

    const { data: pendingOrders } = await pendingQuery;

    if (pendingOrders && pendingOrders.length > 0) {
      for (const pendingOrder of pendingOrders) {
        try {
          const verification = await selarProvider.verifyPayment(
            pendingOrder.transaction_reference || pendingOrder.id
          );

          if (verification.isVerified && verification.status === 'SUCCESSFUL') {
            console.log(`[SYNC_ENTITLEMENTS] Auto-approving pending order ${pendingOrder.order_reference} for ${userEmail}`);
            
            // Auto-approve order
            await admin
              .from('orders')
              .update({
                payment_status: 'SUCCESSFUL',
                customer_id: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', pendingOrder.id);

            pendingOrder.payment_status = 'SUCCESSFUL';

            // Confirm 1-on-1 booking if present
            let confirmedBooking: any = null;
            if (pendingOrder.metadata?.bookingId) {
              const meetingLink = `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
              const { data: updatedB } = await admin
                .from('bookings')
                .update({
                  customer_id: user.id,
                  booking_status: 'CONFIRMED',
                  payment_status: 'SUCCESSFUL',
                  order_id: pendingOrder.id,
                  meeting_link: meetingLink
                })
                .eq('id', pendingOrder.metadata.bookingId)
                .select()
                .single();
              confirmedBooking = updatedB;
            }

            // Dispatch fulfillment email if not yet sent
            if (!pendingOrder.metadata?.email_dispatched) {
              await Promise.allSettled([
                sendWhatsAppPostPaymentConfirmation({
                  customerEmail: pendingOrder.customer_email || userEmail || '',
                  customerName: pendingOrder.customer_name || user.user_metadata?.name || 'Sanctuary Member',
                  orderReference: pendingOrder.order_reference,
                  serviceTitle: pendingOrder.service_name,
                  amount: pendingOrder.amount,
                  currency: pendingOrder.currency,
                  serviceId: pendingOrder.service_id
                }),
                sendServicePdfEmail({
                  customerEmail: pendingOrder.customer_email || userEmail || '',
                  customerName: pendingOrder.customer_name || user.user_metadata?.name || 'Sanctuary Member',
                  serviceId: pendingOrder.service_id,
                  serviceTitle: pendingOrder.service_name,
                  orderReference: pendingOrder.order_reference,
                  ...(confirmedBooking
                    ? {
                        booking: {
                          scheduledDate: confirmedBooking.scheduled_date,
                          startTime: confirmedBooking.start_time,
                          meetingLink: confirmedBooking.meeting_link || '',
                          coachName: confirmedBooking.coach_name
                        }
                      }
                    : {})
                }),
                sendAdminOrderNotificationEmail({
                  orderReference: pendingOrder.order_reference,
                  customerName: pendingOrder.customer_name || user.user_metadata?.name || 'Sanctuary Member',
                  customerEmail: pendingOrder.customer_email || userEmail || '',
                  serviceTitle: pendingOrder.service_name,
                  serviceId: pendingOrder.service_id,
                  amount: Number(pendingOrder.amount || 0),
                  currency: pendingOrder.currency || 'KES',
                  paymentProvider: 'SELAR',
                  paymentStatus: 'SUCCESSFUL',
                  ...(confirmedBooking
                    ? {
                        booking: {
                          scheduledDate: confirmedBooking.scheduled_date,
                          startTime: confirmedBooking.start_time,
                          meetingLink: confirmedBooking.meeting_link || '',
                          coachName: confirmedBooking.coach_name
                        }
                      }
                    : {})
                })
              ]);

              await admin.from('orders').update({
                metadata: {
                  ...(pendingOrder.metadata || {}),
                  email_dispatched: true,
                  email_dispatched_at: new Date().toISOString(),
                  auto_approved_via: 'SYNC_ENTITLEMENTS'
                }
              }).eq('id', pendingOrder.id);
            }

            store.addAuditLog(
              'PAYMENT_AUTO_VERIFIED',
              'SYNC',
              `Order ${pendingOrder.order_reference} auto-verified and approved on dashboard sync.`
            );
          }
        } catch (verifyErr) {
          console.warn('Sync auto-verification attempt failed for order:', pendingOrder.id, verifyErr);
        }
      }
    }

    // 1. Fetch all successful orders matching either customer_id or customer_email
    let query = admin
      .from('orders')
      .select('*')
      .eq('payment_status', 'SUCCESSFUL');

    if (userEmail) {
      query = query.or(`customer_id.eq.${user.id},customer_email.ilike.${userEmail}`);
    } else {
      query = query.eq('customer_id', user.id);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders for sync:', ordersError);
    }

    // 2. Fetch existing entitlements for user
    const { data: existingEntitlements, error: entError } = await admin
      .from('entitlements')
      .select('*')
      .eq('customer_id', user.id);

    const existingServiceIds = new Set(
      (existingEntitlements || []).map((e: any) => e.service_id)
    );

    // 3. For any successful order whose service_id is not in entitlements for this user, create it
    if (orders && orders.length > 0) {
      for (const order of orders) {
        // Also ensure orders.customer_id is synced to user.id if it wasn't
        if (order.customer_id !== user.id) {
          await admin
            .from('orders')
            .update({ customer_id: user.id })
            .eq('id', order.id);
        }

        if (!existingServiceIds.has(order.service_id)) {
          const serviceType =
            order.service_id === 'srv-book-04'
              ? 'DIGITAL_PRODUCT'
              : order.service_id === 'srv-interpersonal-03'
              ? 'INTERPERSONAL_SESSION'
              : order.service_id === 'srv-custom-02'
              ? 'CUSTOM_COACHING'
              : 'DIGITAL_PROGRAMME';

          const { data: newEnt } = await admin
            .from('entitlements')
            .insert({
              customer_id: user.id,
              service_id: order.service_id,
              service_name: order.service_name || 'Becoming Her Service',
              service_type: serviceType,
              order_id: order.id,
              status: 'ACTIVE',
              progress_percentage: 0
            })
            .select();

          if (newEnt && newEnt.length > 0) {
            existingServiceIds.add(order.service_id);
          }
        }
      }
    }

    // 4. Also link any bookings by email to this user.id
    if (userEmail) {
      await admin
        .from('bookings')
        .update({ customer_id: user.id })
        .ilike('customer_email', userEmail)
        .neq('customer_id', user.id);
    }

    // 5. Fetch fresh final entitlements
    const { data: finalEntitlements } = await admin
      .from('entitlements')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'ACTIVE');

    return NextResponse.json({
      success: true,
      entitlements: finalEntitlements || []
    });
  } catch (error: any) {
    console.error('Error in sync-entitlements API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
