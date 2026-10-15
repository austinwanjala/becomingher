import { NextResponse } from 'next/server';
import { selarProvider } from '@/lib/payments/selar';
import { store } from '@/lib/store';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { getServiceById, getServiceBySelarProductId } from '@/lib/services';
import {
  sendServicePdfEmail,
  sendAdminOrderNotificationEmail,
  resolveServicePdf
} from '@/lib/email/delivery';
import { sendWhatsAppPostPaymentConfirmation } from '@/lib/whatsapp/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      transactionReference,
      reference,
      custom_ref,
      trxref,
      transaction_id,
      productId,
      product_id,
      serviceId,
      service_id,
      email,
      customer_email,
      name,
      customer_name,
      manualByAdmin
    } = body;

    const effectiveRef =
      transactionReference ||
      reference ||
      custom_ref ||
      trxref ||
      transaction_id ||
      '';

    const effectiveOrderId = orderId || '';
    const effectiveProductId = productId || product_id || '';
    const effectiveServiceId = serviceId || service_id || '';
    const effectiveEmail = (email || customer_email || '').toLowerCase().trim();
    const effectiveName = name || customer_name || 'Sanctuary Member';

    if (!effectiveOrderId && !effectiveRef && !effectiveProductId && !effectiveServiceId) {
      return NextResponse.json(
        { error: 'Order ID, transaction reference, or product ID is required for verification.' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // 1. Try to find an existing order in Supabase
    let order: any = null;

    if (effectiveOrderId) {
      const { data: byId } = await supabase
        .from('orders')
        .select('*')
        .eq('id', effectiveOrderId)
        .limit(1);
      if (byId && byId.length > 0) order = byId[0];
    }

    if (!order && effectiveRef) {
      const { data: byRef } = await supabase
        .from('orders')
        .select('*')
        .or(`transaction_reference.eq.${effectiveRef},order_reference.eq.${effectiveRef},id.eq.${effectiveRef}`)
        .limit(1);
      if (byRef && byRef.length > 0) order = byRef[0];
    }

    // Helper to assemble full materials bundle for frontend & email
    const resolveMaterialsBundle = async (targetService: any, currentBooking?: any) => {
      const resolvedPdf = await resolveServicePdf(targetService.id);
      
      const isCustomizedService =
        targetService.id === 'srv-custom-02' ||
        targetService.slug === 'custom-coaching' ||
        targetService.type === 'CUSTOM_COACHING' ||
        targetService.name?.toLowerCase().includes('custom');

      const questionnaireUrl =
        targetService.questionnaire_template_url ||
        targetService.questionnaire_url ||
        (isCustomizedService
          ? 'https://ssspngdzadgjehinospw.supabase.co/storage/v1/object/public/materials/questionnaires/1789587626505-1b5ozx.docx'
          : null);

      let dashboardUrl = '/dashboard/programmes';
      if (targetService.type === 'INTERPERSONAL_SESSION' || targetService.id === 'srv-interpersonal-03') {
        dashboardUrl = '/dashboard/sessions';
      } else if (targetService.id === 'srv-custom-02' || isCustomizedService) {
        dashboardUrl = '/dashboard/programmes/srv-custom-02';
      } else if (targetService.id === 'srv-guided-01') {
        dashboardUrl = '/dashboard/programmes/srv-guided-01';
      }

      return {
        pdfUrl: resolvedPdf?.url || targetService.pdf_url || null,
        pdfName: resolvedPdf?.name || targetService.pdf_name || `${targetService.name}.pdf`,
        pdfTitle: resolvedPdf?.title || targetService.pdf_title || targetService.name,
        questionnaireUrl,
        resources: targetService.resources || [],
        booking: currentBooking || null,
        dashboardUrl
      };
    };

    // -------------------------------------------------------------
    // CASE A: EXISTING ORDER FOUND (Initiated via Becoming Her Checkout)
    // -------------------------------------------------------------
    if (order) {
      const service = (await getServiceById(order.service_id)) || store.getServiceById(order.service_id);

      // IDEMPOTENCY: If order is already SUCCESSFUL
      if (order.payment_status === 'SUCCESSFUL') {
        // Ensure entitlement exists in Supabase
        const { data: existingEntitlements } = await supabase
          .from('entitlements')
          .select('*')
          .eq('order_id', order.id)
          .limit(1);

        let entitlement = existingEntitlements?.[0];

        if (!entitlement) {
          const { data: newEnt } = await supabase
            .from('entitlements')
            .insert({
              customer_id: order.customer_id,
              service_id: order.service_id,
              service_name: order.service_name || service?.name || 'Becoming Her Service',
              service_type: order.metadata?.serviceType || service?.type || 'DIGITAL_PROGRAMME',
              order_id: order.id,
              status: 'ACTIVE',
              progress_percentage: 0
            })
            .select()
            .single();
          entitlement = newEnt;
        }

        let booking = undefined;
        if (order.metadata?.bookingId) {
          const { data: bData } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', order.metadata.bookingId)
            .limit(1);
          booking = bData?.[0] || store.bookings.find((b) => b.id === order.metadata?.bookingId);
        }

        const materials = await resolveMaterialsBundle(service || { id: order.service_id, name: order.service_name }, booking);

        // Ensure fulfillment email and admin alert are dispatched if previously missed or failed
        const alreadyDispatched = order.metadata?.email_dispatched === true;
        const forceResend = body.resendEmail === true || body.forceEmail === true;

        if (!alreadyDispatched || forceResend) {
          console.log(`[VERIFY_ROUTE] Dispatched emails missing for order ${order.order_reference}. Triggering fulfillment email & admin notification...`);
          
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
              ...(booking
                ? {
                    booking: {
                      scheduledDate: booking.scheduled_date,
                      startTime: booking.start_time,
                      meetingLink: booking.meeting_link || '',
                      coachName: booking.coach_name
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
              paymentProvider: order.payment_provider || 'SELAR',
              paymentStatus: order.payment_status || 'SUCCESSFUL',
              ...(booking
                ? {
                    booking: {
                      scheduledDate: booking.scheduled_date,
                      startTime: booking.start_time,
                      meetingLink: booking.meeting_link || '',
                      coachName: booking.coach_name
                    }
                  }
                : {})
            })
          ]);

          order.metadata = {
            ...(order.metadata || {}),
            email_dispatched: true,
            email_dispatched_at: new Date().toISOString()
          };
          await supabase.from('orders').update({
            metadata: order.metadata
          }).eq('id', order.id);
        }

        return NextResponse.json({
          verified: true,
          alreadyProcessed: true,
          order,
          entitlement,
          booking,
          service,
          materials,
          message: 'Payment is already confirmed and active. Emails dispatched.'
        });
      }

      // Verify through Selar Provider
      const verification = await selarProvider.verifyPayment(
        order.transaction_reference || effectiveRef || order.id
      );

      if (verification.isVerified && verification.status === 'SUCCESSFUL') {
        order.payment_status = 'SUCCESSFUL';
        order.updated_at = new Date().toISOString();

        await supabase
          .from('orders')
          .update({
            payment_status: 'SUCCESSFUL',
            updated_at: order.updated_at
          })
          .eq('id', order.id);

        // Create or activate entitlement in Supabase
        const { data: existingEntitlement } = await supabase
          .from('entitlements')
          .select('*')
          .eq('customer_id', order.customer_id)
          .eq('service_id', order.service_id)
          .limit(1);

        let entitlement;

        if (existingEntitlement && existingEntitlement.length > 0) {
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
          const { data: newData, error: insertError } = await supabase
            .from('entitlements')
            .insert({
              customer_id: order.customer_id,
              service_id: order.service_id,
              service_name: order.service_name || service?.name || 'Becoming Her Service',
              service_type: order.metadata?.serviceType || service?.type || 'DIGITAL_PROGRAMME',
              order_id: order.id,
              status: 'ACTIVE',
              progress_percentage: 0
            })
            .select();

          if (insertError) {
            console.error('FAILED TO INSERT ENTITLEMENT:', insertError);
          }
          entitlement = newData?.[0];
        }

        // If interpersonal coaching session, confirm booking and generate meeting link
        let confirmedBooking;
        if (order.metadata?.bookingId) {
          confirmedBooking = store.confirmBookingPayment(order.metadata.bookingId, order.id);
          const meetingLink =
            confirmedBooking?.meeting_link ||
            `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;

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

        // Dispatch notifications and fulfillment
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
            paymentProvider: order.payment_provider || 'SELAR',
            paymentStatus: order.payment_status || 'SUCCESSFUL',
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

        order.metadata = {
          ...(order.metadata || {}),
          email_dispatched: true,
          email_dispatched_at: new Date().toISOString()
        };
        await supabase
          .from('orders')
          .update({
            metadata: order.metadata
          })
          .eq('id', order.id);

        const materials = await resolveMaterialsBundle(service || { id: order.service_id, name: order.service_name }, confirmedBooking);

        return NextResponse.json({
          verified: true,
          order,
          entitlement,
          booking: confirmedBooking,
          service,
          materials,
          message: 'Payment successfully verified! Your coaching access is now unlocked.'
        });
      } else {
        order.payment_status = 'FAILED';

        await supabase
          .from('orders')
          .update({
            payment_status: 'FAILED',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

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
    }

    // -------------------------------------------------------------
    // CASE B: DIRECT SELAR PURCHASE (No pre-existing order in database)
    // Customer purchased directly via a Selar link (e.g. https://selar.com/19145490qv)
    // -------------------------------------------------------------
    // 1. Resolve matching service from productId or serviceId
    let matchedService: any = null;
    if (effectiveProductId) {
      matchedService = await getServiceBySelarProductId(effectiveProductId);
    }
    if (!matchedService && effectiveServiceId) {
      matchedService = await getServiceById(effectiveServiceId);
    }
    if (!matchedService) {
      // Fallback matching
      matchedService = store.services[0];
    }

    // 2. Verify with Selar
    const verification = await selarProvider.verifyPayment(effectiveRef || `SELAR_DIRECT_${Date.now()}`);

    if (!verification.isVerified || verification.status !== 'SUCCESSFUL') {
      return NextResponse.json({
        verified: false,
        message: 'Could not verify transaction with Selar.'
      }, { status: 400 });
    }

    // 3. Resolve customer identity (logged-in user or customer profile in auth.users)
    let customerId: string | null = null;
    try {
      const userClient = await createClient();
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        customerId = user.id;
      }
    } catch (_) {}

    const finalCustomerEmail = effectiveEmail || verification.customerEmail || 'client@becomingher.co.ke';
    const finalCustomerName = effectiveName || 'Sanctuary Member';

    if (!customerId) {
      try {
        // Find existing user in Supabase auth by email
        const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existingAuthUser = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === finalCustomerEmail.toLowerCase()
        );

        if (existingAuthUser) {
          customerId = existingAuthUser.id;
        } else {
          // Auto-provision a verified member account for this buyer
          const { data: createdAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
            email: finalCustomerEmail,
            email_confirm: true,
            user_metadata: { name: finalCustomerName }
          });

          if (createdAuthUser?.user) {
            customerId = createdAuthUser.user.id;
          } else if (createAuthError) {
            console.warn('Auth admin create user error:', createAuthError);
          }
        }
      } catch (authErr) {
        console.warn('Auth admin lookup error:', authErr);
      }
    }

    // Ensure customer profile exists in public.profiles table if customerId is present
    if (customerId) {
      try {
        await supabase.from('profiles').upsert(
          {
            id: customerId,
            full_name: finalCustomerName,
            role: 'CUSTOMER',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      } catch (profErr) {
        console.warn('Profile upsert warning:', profErr);
      }
    }

    // 4. Create new order in Supabase
    const newOrderId = `ord-selar-${Date.now()}`;
    const newOrderRef = `BH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const finalAmount = Number(verification.amount || matchedService.price || 1000);
    const finalCurrency = verification.currency || matchedService.currency || 'KES';

    const newOrderData = {
      id: newOrderId,
      order_reference: newOrderRef,
      customer_id: customerId,
      customer_name: finalCustomerName,
      customer_email: finalCustomerEmail,
      service_id: matchedService.id,
      service_name: matchedService.name,
      selar_product_id: effectiveProductId || matchedService.selar_product_id,
      payment_provider: 'SELAR',
      payment_status: 'SUCCESSFUL',
      transaction_reference: effectiveRef || verification.transactionReference,
      amount: finalAmount,
      currency: finalCurrency,
      metadata: {
        directSelarPurchase: true,
        serviceType: matchedService.type
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertedOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert(newOrderData)
      .select()
      .single();

    if (orderInsertError) {
      console.error('Error inserting direct Selar order:', orderInsertError);
    }

    const currentOrder = insertedOrder || newOrderData;

    // 5. Create or activate entitlement
    let entitlement: any = null;
    const { data: newEnt, error: entInsertError } = await supabase
      .from('entitlements')
      .insert({
        customer_id: customerId,
        service_id: matchedService.id,
        service_name: matchedService.name,
        service_type: matchedService.type || 'DIGITAL_PROGRAMME',
        order_id: currentOrder.id,
        status: 'ACTIVE',
        progress_percentage: 0
      })
      .select()
      .single();

    if (entInsertError) {
      console.error('Error creating entitlement for direct Selar order:', entInsertError);
    }
    entitlement = newEnt;

    // 6. Handle 1-on-1 interpersonal booking if applicable
    let confirmedBooking: any = null;
    if (matchedService.type === 'INTERPERSONAL_SESSION' || matchedService.id === 'srv-interpersonal-03') {
      const meetingLink = `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
      const bookingPayload = {
        id: `book-${Date.now()}`,
        customer_id: customerId,
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail,
        coach_id: store.coach.id,
        coach_name: store.coach.name,
        service_id: matchedService.id,
        scheduled_date: '2026-09-22',
        start_time: '11:00',
        end_time: '12:00',
        timezone: 'Africa/Nairobi (EAT)',
        order_id: currentOrder.id,
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
      'PAYMENT_VERIFIED_DIRECT_SELAR',
      'PAYMENTS',
      `Direct Selar purchase verified for ${finalCustomerEmail} (${matchedService.name}) - Order ${newOrderRef}. Access unlocked.`
    );

    // 7. Dispatch fulfillment email, admin notification, and WhatsApp
    await Promise.allSettled([
      sendWhatsAppPostPaymentConfirmation({
        customerEmail: finalCustomerEmail,
        customerName: finalCustomerName,
        orderReference: newOrderRef,
        serviceTitle: matchedService.name,
        amount: finalAmount,
        currency: finalCurrency,
        serviceId: matchedService.id
      }),
      sendServicePdfEmail({
        customerEmail: finalCustomerEmail,
        customerName: finalCustomerName,
        serviceId: matchedService.id,
        serviceTitle: matchedService.name,
        orderReference: newOrderRef,
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
        orderReference: newOrderRef,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
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
        ...(currentOrder.metadata || {}),
        email_dispatched: true,
        email_dispatched_at: new Date().toISOString()
      }
    }).eq('id', currentOrder.id);

    const materials = await resolveMaterialsBundle(matchedService, confirmedBooking);

    return NextResponse.json({
      verified: true,
      isNewDirectOrder: true,
      order: currentOrder,
      entitlement,
      booking: confirmedBooking,
      service: matchedService,
      materials,
      message: 'Direct Selar purchase verified! Your coaching access and materials are now unlocked.'
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error verifying payment.' },
      { status: 500 }
    );
  }
}
