import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { selarProvider } from '@/lib/payments/selar';
import { sendServicePdfEmail, sendAdminOrderNotificationEmail } from '@/lib/email/delivery';
import { sendWhatsAppPostPaymentConfirmation } from '@/lib/whatsapp/notifications';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Fetch orders, profiles, and entitlements in parallel
    const [ordersRes, profilesRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, phone_number, role')
    ]);

    if (ordersRes.error) {
      console.error('Error fetching admin orders:', ordersRes.error);
      return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
    }

    const rawOrders = ordersRes.data || [];
    const profiles = profilesRes.data || [];
    const profilesMap = new Map(profiles.map((p) => [p.id, p]));

    // Enrich and sanitize each order
    const orders = rawOrders.map((order: any) => {
      const prof = order.customer_id ? profilesMap.get(order.customer_id) : null;

      // Smart name resolution
      let displayName = order.customer_name;
      if (!displayName || displayName.trim().toLowerCase() === 'me' || displayName.trim().toLowerCase() === 'unknown') {
        if (prof?.full_name && prof.full_name !== 'me') {
          displayName = prof.full_name;
        } else if (order.customer_email) {
          const prefix = order.customer_email.split('@')[0].replace(/[._-]/g, ' ');
          displayName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        } else {
          displayName = 'Valued Member';
        }
      }

      return {
        ...order,
        customer_name: displayName,
        amount: Number(order.amount || 0)
      };
    });

    // Compute metrics
    const successfulOrders = orders.filter((o: any) => o.payment_status === 'SUCCESSFUL');
    const totalRevenue = successfulOrders.reduce((sum: number, o: any) => sum + o.amount, 0);
    const successfulCount = successfulOrders.length;
    const pendingCount = orders.filter((o: any) => o.payment_status === 'PENDING').length;
    const refundedCount = orders.filter((o: any) => o.payment_status === 'REFUNDED').length;
    const failedCount = orders.filter((o: any) => o.payment_status === 'FAILED').length;

    return NextResponse.json({
      orders,
      metrics: {
        totalRevenue,
        successfulCount,
        pendingCount,
        refundedCount,
        failedCount,
        totalCount: orders.length
      }
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/admin/payments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, orderId } = body;

    const supabase = await createAdminClient();

    let pendingQuery = supabase
      .from('orders')
      .select('*')
      .eq('payment_status', 'PENDING');

    if (orderId) {
      pendingQuery = pendingQuery.eq('id', orderId);
    }

    const { data: pendingOrders, error: fetchErr } = await pendingQuery;

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const reconciled: any[] = [];

    if (pendingOrders && pendingOrders.length > 0) {
      for (const order of pendingOrders) {
        try {
          const verification = await selarProvider.verifyPayment(
            order.transaction_reference || order.id
          );

          if (verification.isVerified && verification.status === 'SUCCESSFUL') {
            const updatedRef = verification.transactionReference || order.transaction_reference;
            
            // 1. Mark order SUCCESSFUL
            await supabase
              .from('orders')
              .update({
                payment_status: 'SUCCESSFUL',
                transaction_reference: updatedRef,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);

            // 2. Upsert entitlement in Supabase
            if (order.customer_id) {
              const { data: existingEnt } = await supabase
                .from('entitlements')
                .select('id')
                .eq('customer_id', order.customer_id)
                .eq('service_id', order.service_id)
                .limit(1);

              if (existingEnt && existingEnt.length > 0) {
                await supabase
                  .from('entitlements')
                  .update({
                    status: 'ACTIVE',
                    order_id: order.id,
                    start_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingEnt[0].id);
              } else {
                await supabase.from('entitlements').insert({
                  customer_id: order.customer_id,
                  service_id: order.service_id,
                  service_name: order.service_name || 'Becoming Her Service',
                  service_type: order.metadata?.serviceType || 'DIGITAL_PROGRAMME',
                  order_id: order.id,
                  status: 'ACTIVE',
                  progress_percentage: 0,
                  start_date: new Date().toISOString()
                });
              }
            }

            // 3. Confirm booking if interpersonal
            let confirmedBooking: any = null;
            if (order.metadata?.bookingId) {
              const meetingLink = `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
              const { data: bData } = await supabase
                .from('bookings')
                .update({
                  booking_status: 'CONFIRMED',
                  payment_status: 'SUCCESSFUL',
                  order_id: order.id,
                  meeting_link: meetingLink
                })
                .eq('id', order.metadata.bookingId)
                .select()
                .single();
              confirmedBooking = bData;
            }

            // 4. Dispatch fulfillment emails if not yet sent
            if (!order.metadata?.email_dispatched) {
              await Promise.allSettled([
                sendWhatsAppPostPaymentConfirmation({
                  customerEmail: order.customer_email,
                  customerName: order.customer_name,
                  orderReference: order.order_reference,
                  serviceTitle: order.service_name,
                  amount: order.amount,
                  currency: order.currency,
                  serviceId: order.service_id
                }),
                sendServicePdfEmail({
                  customerEmail: order.customer_email,
                  customerName: order.customer_name,
                  serviceId: order.service_id,
                  serviceTitle: order.service_name,
                  orderReference: order.order_reference,
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
                  orderReference: order.order_reference,
                  customerName: order.customer_name,
                  customerEmail: order.customer_email,
                  serviceTitle: order.service_name,
                  serviceId: order.service_id,
                  amount: Number(order.amount || 0),
                  currency: order.currency || 'KES',
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

              await supabase.from('orders').update({
                metadata: {
                  ...(order.metadata || {}),
                  email_dispatched: true,
                  email_dispatched_at: new Date().toISOString(),
                  auto_approved_via: 'ADMIN_RECONCILIATION'
                }
              }).eq('id', order.id);
            }

            store.addAuditLog(
              'PAYMENT_AUTO_RECONCILED',
              'ADMIN',
              `Order ${order.order_reference} auto-verified and approved via Selar reconciliation.`
            );

            reconciled.push({
              id: order.id,
              order_reference: order.order_reference,
              customer_name: order.customer_name,
              customer_email: order.customer_email,
              service_name: order.service_name,
              amount: order.amount
            });
          }
        } catch (itemErr) {
          console.warn(`Error auto-reconciling order ${order.id}:`, itemErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      reconciledCount: reconciled.length,
      reconciledOrders: reconciled,
      message:
        reconciled.length > 0
          ? `Successfully auto-verified and approved ${reconciled.length} order(s). Access and materials unlocked.`
          : 'All pending orders checked with Selar. No newly verified payments found.'
    });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/admin/payments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentStatus, notes } = body;

    if (!orderId || !paymentStatus) {
      return NextResponse.json({ error: 'Order ID and payment status are required.' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch existing order
    const { data: existing, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const updatedMetadata = {
      ...(existing.metadata || {}),
      admin_notes: notes || existing.metadata?.admin_notes,
      admin_status_updated_at: new Date().toISOString()
    };

    // Update order status
    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // If order was refunded, revoke entitlement
    if (paymentStatus === 'REFUNDED') {
      await supabase
        .from('entitlements')
        .update({
          status: 'REVOKED',
          updated_at: new Date().toISOString()
        })
        .or(`order_id.eq.${orderId},and(customer_id.eq.${existing.customer_id},service_id.eq.${existing.service_id})`);
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (err: any) {
    console.error('Unexpected error in PATCH /api/admin/payments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let orderId = searchParams.get('orderId') || searchParams.get('id');

    if (!orderId) {
      try {
        const body = await request.json();
        orderId = body.orderId || body.id;
      } catch (_) {}
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Delete associated entitlements and bookings if any
    await supabase.from('entitlements').delete().eq('order_id', orderId);
    await supabase.from('bookings').delete().eq('order_id', orderId);

    // Delete order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Order ${orderId} deleted successfully.` });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/admin/payments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

