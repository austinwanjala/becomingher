import { NextResponse } from 'next/server';
import { selarProvider } from '@/lib/payments/selar';
import { store } from '@/lib/store';
import { createAdminClient } from '@/utils/supabase/server';
import { sendServicePdfEmail, sendAdminOrderNotificationEmail } from '@/lib/email/delivery';
import { sendWhatsAppPostPaymentConfirmation } from '@/lib/whatsapp/notifications';
import { getServiceById, getServiceBySelarProductId } from '@/lib/services';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const signature = request.headers.get('x-selar-signature') || undefined;

    // Process through Selar Provider
    const result = await selarProvider.handleWebhook(payload, signature);

    if (!result) {
      return NextResponse.json({ error: 'Unsupported webhook payload' }, { status: 400 });
    }

    const data = payload.data || payload;
    const customRef = data.custom_ref || payload.custom_ref || '';
    const selarRef = data.reference || data.transaction_id || payload.reference || '';
    const orderIdParam = data.order_id || payload.order_id || '';
    const customerEmail = (result.customerEmail || data.customer?.email || data.email || '').toLowerCase().trim();
    const customerName = data.customer?.name || data.customer?.fullname || data.name || 'Sanctuary Member';

    const supabase = await createAdminClient();

    // IDEMPOTENCY CHECK & MULTI-LAYER ORDER LOOKUP
    let existingOrder: any = null;

    // 1. By order ID
    if (orderIdParam) {
      const { data: byId } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderIdParam)
        .limit(1);
      if (byId && byId.length > 0) existingOrder = byId[0];
    }

    // 2. By custom_ref (e.g. BH_SELAR_...)
    if (!existingOrder && customRef) {
      const { data: byCustomRef } = await supabase
        .from('orders')
        .select('*')
        .or(`transaction_reference.eq.${customRef},order_reference.eq.${customRef},id.eq.${customRef}`)
        .limit(1);
      if (byCustomRef && byCustomRef.length > 0) existingOrder = byCustomRef[0];
    }

    // 3. By Selar transaction reference / result.transactionReference
    if (!existingOrder && (selarRef || result.transactionReference)) {
      const refToSearch = selarRef || result.transactionReference;
      const { data: bySelarRef } = await supabase
        .from('orders')
        .select('*')
        .or(`transaction_reference.eq.${refToSearch},order_reference.eq.${refToSearch}`)
        .limit(1);
      if (bySelarRef && bySelarRef.length > 0) existingOrder = bySelarRef[0];
    }

    // 4. Fallback: Pending order matching customer email
    if (!existingOrder && customerEmail) {
      let pendingQuery = supabase
        .from('orders')
        .select('*')
        .ilike('customer_email', customerEmail)
        .eq('payment_status', 'PENDING')
        .order('created_at', { ascending: false });

      if (result.selarProductId) {
        pendingQuery = pendingQuery.or(`selar_product_id.eq.${result.selarProductId},service_id.eq.${result.selarProductId}`);
      }

      const { data: byEmailPending } = await pendingQuery.limit(1);
      if (byEmailPending && byEmailPending.length > 0) existingOrder = byEmailPending[0];
    }

    // -------------------------------------------------------------
    // CASE A: EXISTING ORDER FOUND (Auto-verify & approve)
    // -------------------------------------------------------------
    if (existingOrder) {
      if (result.status === 'SUCCESSFUL') {
        const updatedRef = selarRef || existingOrder.transaction_reference || result.transactionReference;

        // 1. Update order in Supabase to SUCCESSFUL immediately (no admin approval needed)
        await supabase
          .from('orders')
          .update({
            payment_status: 'SUCCESSFUL',
            transaction_reference: updatedRef,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingOrder.id);

        existingOrder.payment_status = 'SUCCESSFUL';
        existingOrder.transaction_reference = updatedRef;

        // 2. Auto-unlock and create/activate persistent entitlement in Supabase
        const { data: existingEnt } = await supabase
          .from('entitlements')
          .select('id')
          .eq('customer_id', existingOrder.customer_id)
          .eq('service_id', existingOrder.service_id)
          .limit(1);

        if (existingEnt && existingEnt.length > 0) {
          await supabase
            .from('entitlements')
            .update({
              status: 'ACTIVE',
              order_id: existingOrder.id,
              start_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEnt[0].id);
        } else {
          await supabase.from('entitlements').insert({
            customer_id: existingOrder.customer_id,
            service_id: existingOrder.service_id,
            service_name: existingOrder.service_name || 'Becoming Her Sanctuary',
            service_type: existingOrder.metadata?.serviceType || 'DIGITAL_PROGRAMME',
            order_id: existingOrder.id,
            status: 'ACTIVE',
            progress_percentage: 0,
            start_date: new Date().toISOString()
          });
        }

        // Also update memory store
        store.unlockEntitlement(existingOrder.customer_id, existingOrder.service_id, existingOrder.id);

        // 3. Confirm 1-on-1 booking if present
        let confirmedBooking: any = null;
        if (existingOrder.metadata?.bookingId) {
          const { data: bData } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', existingOrder.metadata.bookingId)
            .limit(1);

          const meetingLink =
            bData?.[0]?.meeting_link ||
            `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;

          const { data: updatedB } = await supabase
            .from('bookings')
            .update({
              booking_status: 'CONFIRMED',
              payment_status: 'SUCCESSFUL',
              order_id: existingOrder.id,
              meeting_link: meetingLink
            })
            .eq('id', existingOrder.metadata.bookingId)
            .select()
            .single();

          confirmedBooking = updatedB || bData?.[0];
          store.confirmBookingPayment(existingOrder.metadata.bookingId, existingOrder.id);
        }

        // 4. Dispatch fulfillment materials if not already dispatched
        const alreadyDispatched = existingOrder.metadata?.email_dispatched === true;
        if (!alreadyDispatched) {
          console.log(`[SELAR_WEBHOOK] Auto-approved order ${existingOrder.order_reference}. Dispatching fulfillment emails...`);
          await Promise.allSettled([
            sendWhatsAppPostPaymentConfirmation({
              customerEmail: existingOrder.customer_email,
              customerName: existingOrder.customer_name,
              orderReference: existingOrder.order_reference,
              serviceTitle: existingOrder.service_name,
              amount: existingOrder.amount,
              currency: existingOrder.currency,
              serviceId: existingOrder.service_id
            }),
            sendServicePdfEmail({
              customerEmail: existingOrder.customer_email,
              customerName: existingOrder.customer_name,
              serviceId: existingOrder.service_id,
              serviceTitle: existingOrder.service_name,
              orderReference: existingOrder.order_reference,
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
              orderReference: existingOrder.order_reference,
              customerName: existingOrder.customer_name,
              customerEmail: existingOrder.customer_email,
              serviceTitle: existingOrder.service_name,
              serviceId: existingOrder.service_id,
              amount: Number(existingOrder.amount || 0),
              currency: existingOrder.currency || 'KES',
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
              ...(existingOrder.metadata || {}),
              email_dispatched: true,
              email_dispatched_at: new Date().toISOString(),
              auto_verified_by: 'SELAR_WEBHOOK'
            }
          }).eq('id', existingOrder.id);
        }

        store.addAuditLog(
          'WEBHOOK_ORDER_COMPLETED',
          'WEBHOOK',
          `Order ${existingOrder.order_reference} auto-verified and approved via Selar webhook without admin intervention.`
        );

        return NextResponse.json({
          status: 'ok',
          orderReference: existingOrder.order_reference,
          message: 'Order auto-verified and access unlocked successfully'
        });
      }

      return NextResponse.json({ status: 'ignored', reason: 'Non-successful payment state' });
    }

    // -----------------------------------------------------------------
    // CASE B: Direct Selar checkout (no pre-existing internal order in DB)
    // -----------------------------------------------------------------
    if (result.status === 'SUCCESSFUL') {
      const matchedService =
        (await getServiceBySelarProductId(result.selarProductId || '')) ||
        (await getServiceById(result.selarProductId || '')) ||
        store.services.find((s) => s.selar_product_id === result.selarProductId) ||
        store.services[0];

      // Resolve authentic customer auth.users UUID to satisfy foreign key constraints
      let customerId: string | null = null;
      if (customerEmail) {
        try {
          const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const existingUser = usersData?.users?.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          );

          if (existingUser) {
            customerId = existingUser.id;
          } else {
            const { data: createdUser } = await supabase.auth.admin.createUser({
              email: customerEmail,
              email_confirm: true,
              user_metadata: { name: customerName }
            });
            if (createdUser?.user) {
              customerId = createdUser.user.id;
            }
          }
        } catch (authErr) {
          console.warn('Webhook auth resolve error:', authErr);
        }
      }

      if (customerId) {
        try {
          await supabase.from('profiles').upsert(
            {
              id: customerId,
              full_name: customerName,
              role: 'CUSTOMER',
              updated_at: new Date().toISOString()
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
        } catch (_) {}
      }

      const orderRef = `BH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrderId = orderIdParam || `ord-webhook-${Date.now()}`;
      const finalAmount = Number(result.amount || matchedService.price || 1000);
      const finalCurrency = result.currency || matchedService.currency || 'KES';

      const newOrder = {
        id: newOrderId,
        order_reference: orderRef,
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        service_id: matchedService.id,
        service_name: matchedService.name,
        selar_product_id: result.selarProductId || matchedService.selar_product_id,
        payment_provider: 'SELAR' as const,
        payment_status: 'SUCCESSFUL' as const,
        transaction_reference: selarRef || customRef || result.transactionReference,
        amount: finalAmount,
        currency: finalCurrency,
        metadata: {
          directSelarPurchase: true,
          serviceType: matchedService.type,
          auto_verified_by: 'SELAR_WEBHOOK'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedOrder } = await supabase.from('orders').insert(newOrder).select().single();
      const activeOrder = insertedOrder || newOrder;

      // Create entitlement in Supabase
      if (customerId) {
        await supabase.from('entitlements').insert({
          customer_id: customerId,
          service_id: matchedService.id,
          service_name: matchedService.name,
          service_type: matchedService.type || 'DIGITAL_PROGRAMME',
          order_id: activeOrder.id,
          status: 'ACTIVE',
          progress_percentage: 0,
          start_date: new Date().toISOString()
        });
      }

      // If interpersonal coaching, create booking
      let confirmedBooking: any = null;
      if (matchedService.type === 'INTERPERSONAL_SESSION' || matchedService.id === 'srv-interpersonal-03') {
        const meetingLink = `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
        const bookingPayload = {
          id: `book-${Date.now()}`,
          customer_id: customerId,
          customer_name: customerName,
          customer_email: customerEmail,
          coach_id: store.coach.id,
          coach_name: store.coach.name,
          service_id: matchedService.id,
          scheduled_date: '2026-09-22',
          start_time: '11:00',
          end_time: '12:00',
          timezone: 'Africa/Nairobi (EAT)',
          order_id: activeOrder.id,
          payment_status: 'SUCCESSFUL',
          booking_status: 'CONFIRMED',
          meeting_link: meetingLink,
          notes: 'Purchased directly on Selar',
          created_at: new Date().toISOString()
        };

        const { data: dbBooking } = await supabase.from('bookings').insert(bookingPayload).select().single();
        confirmedBooking = dbBooking || bookingPayload;
      }

      store.addAuditLog(
        'WEBHOOK_NEW_ORDER_CREATED',
        'WEBHOOK',
        `New order ${orderRef} auto-created and approved for ${customerEmail} via Selar webhook.`
      );

      // Dispatch fulfillment emails
      await Promise.allSettled([
        sendWhatsAppPostPaymentConfirmation({
          customerEmail,
          customerName,
          orderReference: orderRef,
          serviceTitle: matchedService.name,
          amount: finalAmount,
          currency: finalCurrency,
          serviceId: matchedService.id
        }),
        sendServicePdfEmail({
          customerEmail,
          customerName,
          serviceId: matchedService.id,
          serviceTitle: matchedService.name,
          orderReference: orderRef,
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
          orderReference: orderRef,
          customerName,
          customerEmail,
          serviceTitle: matchedService.name,
          serviceId: matchedService.id,
          amount: finalAmount,
          currency: finalCurrency,
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
          ...(activeOrder.metadata || {}),
          email_dispatched: true,
          email_dispatched_at: new Date().toISOString()
        }
      }).eq('id', activeOrder.id);

      return NextResponse.json({
        status: 'ok',
        orderReference: orderRef,
        message: 'Order created, auto-verified, and access unlocked successfully'
      });
    }

    return NextResponse.json({ status: 'ignored', reason: 'Non-successful payment state' });
  } catch (err: any) {
    console.error('Selar webhook processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
