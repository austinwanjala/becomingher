import { NextResponse } from 'next/server';
import { selarProvider } from '@/lib/payments/selar';
import { store } from '@/lib/store';
import { createAdminClient } from '@/utils/supabase/server';
import { sendServicePdfEmail } from '@/lib/email/delivery';
import { sendWhatsAppPostPaymentConfirmation } from '@/lib/whatsapp/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, transactionReference, manualByAdmin } = body;

    if (!orderId && !transactionReference) {
      return NextResponse.json(
        { error: 'Order ID or transaction reference is required for verification.' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    let query = supabase.from('orders').select('*');
    if (orderId) {
      query = query.eq('id', orderId);
    } else if (transactionReference) {
      query = query.eq('transaction_reference', transactionReference);
    }
    
    const { data: orders, error: fetchError } = await query.limit(1);

    if (fetchError || !orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order record not found.' }, { status: 404 });
    }

    const order = orders[0];

    // IDEMPOTENCY: If already successful, return the current confirmed state immediately
    if (order.payment_status === 'SUCCESSFUL') {
      const { data: existingEntitlements } = await supabase
        .from('entitlements')
        .select('*')
        .eq('order_id', order.id)
        .limit(1);
      
      const entitlement = existingEntitlements?.[0];

      // If order is successful but no entitlement exists, do NOT return early! Let it fall through to create it.
      if (entitlement) {
        let booking = undefined;
        if (order.metadata?.bookingId) {
          const { data: bData } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', order.metadata.bookingId)
            .limit(1);
          booking = bData?.[0] || store.bookings.find((b) => b.id === order.metadata?.bookingId);
        }

        return NextResponse.json({
          verified: true,
          alreadyProcessed: true,
          order,
          entitlement,
          booking,
          message: 'Payment is already confirmed and active.'
        });
      }
    }

    // Verify through Selar Provider
    const verification = await selarProvider.verifyPayment(
      order.transaction_reference || transactionReference || order.id
    );

    if (verification.isVerified && verification.status === 'SUCCESSFUL') {
      order.payment_status = 'SUCCESSFUL';
      order.updated_at = new Date().toISOString();

      await supabase.from('orders').update({
        payment_status: 'SUCCESSFUL',
        updated_at: order.updated_at
      }).eq('id', order.id);

      // Create or activate entitlement in Supabase
      const { data: existingEntitlement } = await supabase
        .from('entitlements')
        .select('*')
        .eq('customer_id', order.customer_id)
        .eq('service_id', order.service_id)
        .limit(1);

      let entitlement;

      if (existingEntitlement && existingEntitlement.length > 0) {
        // Update existing entitlement
        const { data: updatedData } = await supabase
          .from('entitlements')
          .update({
            status: 'ACTIVE',
            order_id: order.id,
            start_date: new Date().toISOString()
          })
          .eq('id', existingEntitlement[0].id)
          .select();
        entitlement = updatedData?.[0];
      } else {
        // Insert new entitlement
        const { data: newData, error: insertError } = await supabase
          .from('entitlements')
          .insert({
            customer_id: order.customer_id,
            service_id: order.service_id,
            service_name: order.service_name || 'Becoming Her Service',
            service_type: order.metadata?.serviceType || 'DIGITAL_PROGRAMME',
            order_id: order.id,
            status: 'ACTIVE',
            progress_percentage: 0
          })
          .select();
        
        if (insertError) {
          console.error("FAILED TO INSERT ENTITLEMENT:", insertError);
        }
        entitlement = newData?.[0];
      }

      // If interpersonal coaching session, confirm booking and generate meeting link
      let confirmedBooking;
      if (order.metadata?.bookingId) {
        confirmedBooking = store.confirmBookingPayment(order.metadata.bookingId, order.id);
        const meetingLink = confirmedBooking?.meeting_link || `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;

        const bookingPayload = {
          id: order.metadata.bookingId,
          customer_id: order.customer_id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          coach_id: store.coach.id,
          coach_name: store.coach.name,
          service_id: order.service_id,
          scheduled_date: confirmedBooking?.scheduled_date || order.metadata?.bookingDetails?.scheduledDate || '2026-09-22',
          start_time: confirmedBooking?.start_time || order.metadata?.bookingDetails?.startTime || '11:00',
          end_time: confirmedBooking?.end_time || order.metadata?.bookingDetails?.endTime || '12:00',
          timezone: confirmedBooking?.timezone || order.metadata?.bookingDetails?.timezone || 'Africa/Nairobi (EAT)',
          order_id: order.id,
          payment_status: 'SUCCESSFUL',
          booking_status: 'CONFIRMED',
          meeting_link: meetingLink,
          notes: confirmedBooking?.notes || order.metadata?.bookingDetails?.notes || null,
          created_at: order.created_at || new Date().toISOString()
        };

        const { data: dbBooking } = await supabase.from('bookings').upsert(bookingPayload).select().single();
        if (dbBooking) {
          confirmedBooking = dbBooking;
        } else if (confirmedBooking) {
          confirmedBooking.meeting_link = meetingLink;
        }
      }

      store.addAuditLog(
        manualByAdmin ? 'PAYMENT_VERIFIED_MANUAL' : 'PAYMENT_VERIFIED_AUTO',
        'PAYMENTS',
        `Payment for Order ${order.order_reference} verified (${order.amount} ${order.currency}). Access unlocked.`
      );

      // Dispatch notifications asynchronously, but we MUST await them so the serverless function doesn't exit prematurely
      const results = await Promise.allSettled([
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
          ...(confirmedBooking ? {
            booking: {
              scheduledDate: confirmedBooking.scheduled_date,
              startTime: confirmedBooking.start_time,
              meetingLink: confirmedBooking.meeting_link || '',
              coachName: confirmedBooking.coach_name
            }
          } : {})
        })
      ]);

      results.forEach((res, index) => {
        if (res.status === 'rejected') {
          console.error(`[VERIFY_ROUTE] Task ${index} failed:`, res.reason);
        } else {
          console.log(`[VERIFY_ROUTE] Task ${index} succeeded:`, res.value);
        }
      });

      return NextResponse.json({
        verified: true,
        order,
        entitlement,
        booking: confirmedBooking,
        message: 'Payment successfully verified! Your coaching access is now unlocked.'
      });
    } else {
      order.payment_status = 'FAILED';
      
      await supabase.from('orders').update({
        payment_status: 'FAILED',
        updated_at: new Date().toISOString()
      }).eq('id', order.id);

      store.addAuditLog(
        'PAYMENT_FAILED',
        'PAYMENTS',
        `Verification failed for Order ${order.order_reference} (${order.transaction_reference}).`
      );

      return NextResponse.json({
        verified: false,
        order,
        message: 'Payment verification could not be confirmed. Please check with Selar support or contact our team.'
      });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error verifying payment.' },
      { status: 500 }
    );
  }
}
