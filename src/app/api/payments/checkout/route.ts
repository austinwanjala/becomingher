import { NextResponse } from 'next/server';
import { selarProvider } from '@/lib/payments/selar';
import { store } from '@/lib/store';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { getServiceById } from '@/lib/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      couponCode,
      disclaimerAccepted,
      bookingDetails // optional: { scheduledDate, startTime, endTime, timezone, notes }
    } = body;

    // Enforce disclaimer acceptance before proceeding to payment
    if (!disclaimerAccepted) {
      return NextResponse.json(
        { error: 'You must acknowledge and accept the coaching disclaimer before proceeding to payment.' },
        { status: 400 }
      );
    }

    // Verify authenticated user session
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    // Enforce account creation before payment
    if (!user && !body.customerId) {
      return NextResponse.json(
        { error: 'An authenticated account is required before payment. Please sign in or create an account to proceed.' },
        { status: 401 }
      );
    }

    const effectiveCustomerId = user ? user.id : (body.customerId as string);
    // Prefer form input over account defaults so users can specify where materials are sent
    const effectiveCustomerEmail = customerEmail || user?.email;
    const effectiveCustomerName = customerName || user?.user_metadata?.name;

    if (!serviceId || !effectiveCustomerEmail || !effectiveCustomerName) {
      return NextResponse.json(
        { error: 'Service ID, customer name, and customer email are required.' },
        { status: 400 }
      );
    }

    const service = await getServiceById(serviceId);
    if (!service) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }

    let finalPrice = service.price;
    let discountAmount = 0;

    // Apply coupon if valid
    if (couponCode) {
      const coupon = store.coupons.find(
        (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.is_active
      );
      if (coupon) {
        if (!coupon.min_spend || service.price >= coupon.min_spend) {
          if (coupon.discount_type === 'PERCENTAGE') {
            discountAmount = (service.price * coupon.discount_value) / 100;
          } else {
            discountAmount = coupon.discount_value;
          }
          finalPrice = Math.max(0, service.price - discountAmount);
          coupon.times_used += 1;
        }
      }
    }

    const orderId = `ord-${Date.now()}`;
    const orderRef = `BH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    let pendingBookingId: string | undefined;

    // If it's interpersonal coaching, create a temporary 15-minute slot reservation
    if (service.type === 'INTERPERSONAL_SESSION' && bookingDetails) {
      try {
        const tempBooking = store.createTemporaryBooking({
          customerId: effectiveCustomerId,
          customerName: effectiveCustomerName,
          customerEmail: effectiveCustomerEmail,
          coachId: store.coach.id,
          scheduledDate: bookingDetails.scheduledDate,
          startTime: bookingDetails.startTime,
          endTime: bookingDetails.endTime,
          timezone: bookingDetails.timezone || 'Africa/Nairobi (EAT)',
          serviceId: service.id,
          notes: bookingDetails.notes
        });
        pendingBookingId = tempBooking.id;
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
    }

    // Create pending internal order attached to authenticated customer ID
    const pendingOrder = {
      id: orderId,
      order_reference: orderRef,
      customer_id: effectiveCustomerId,
      customer_name: effectiveCustomerName,
      customer_email: effectiveCustomerEmail,
      service_id: service.id,
      service_name: service.name,
      selar_product_id: service.selar_product_id || 'v09683c927',
      payment_provider: 'SELAR' as const,
      payment_status: 'PENDING' as const,
      transaction_reference: '',
      amount: finalPrice,
      currency: service.currency,
      discount_amount: discountAmount,
      coupon_code: couponCode,
      metadata: {
        bookingId: pendingBookingId,
        serviceType: service.type,
        disclaimer_accepted: true,
        disclaimer_version: '1.0',
        disclaimer_accepted_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    // Calculate absolute base URL
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const returnUrl = `${origin}/payment/return?order_id=${orderId}&service_id=${service.id}`;

    // Generate checkout via Selar
    const checkout = await selarProvider.createCheckout({
      orderId,
      serviceId: service.id,
      serviceName: service.name,
      amount: finalPrice,
      currency: service.currency,
      customerName: effectiveCustomerName,
      customerEmail: effectiveCustomerEmail,
      customerPhone,
      returnUrl,
      metadata: {
        bookingId: pendingBookingId
      }
    });

    pendingOrder.transaction_reference = checkout.transactionReference;

    const adminSupabase = await createAdminClient();

    // Ensure customer profile exists in public.profiles to satisfy orders_customer_id_fkey foreign key
    if (effectiveCustomerId) {
      try {
        await adminSupabase.from('profiles').upsert(
          {
            id: effectiveCustomerId,
            full_name: effectiveCustomerName || 'Member',
            phone_number: customerPhone || null,
            role: 'CUSTOMER',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      } catch (profErr) {
        console.warn('Non-blocking profile check error:', profErr);
      }
    }

    const { error: insertError } = await adminSupabase
      .from('orders')
      .insert(pendingOrder);

    if (insertError) {
      console.error('Error inserting order to Supabase:', insertError);
      return NextResponse.json(
        { error: `Database error while creating order: ${insertError.message || insertError.details || 'Foreign key or RLS violation.'}` },
        { status: 500 }
      );
    }

    // Record compliance acceptance for this order
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const clientUa = request.headers.get('user-agent') || 'unknown';
    store.recordDisclaimerAcceptance({
      userId: effectiveCustomerId,
      userEmail: effectiveCustomerEmail,
      orderId: orderId,
      disclaimerVersion: '1.0',
      context: 'CHECKOUT',
      ipAddress: clientIp,
      userAgent: clientUa
    });

    store.addAuditLog(
      'CHECKOUT_INITIATED',
      'ORDERS',
      `Order ${orderRef} initiated for ${effectiveCustomerEmail} via Selar (${service.name})`
    );

    return NextResponse.json({
      orderId,
      orderReference: orderRef,
      checkoutUrl: checkout.checkoutUrl,
      transactionReference: checkout.transactionReference,
      bookingId: pendingBookingId,
      amount: finalPrice,
      currency: service.currency
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize checkout.' },
      { status: 500 }
    );
  }
}
