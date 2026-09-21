import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { getServiceById } from '@/lib/services';
import { store } from '@/lib/store';
import { sendServicePdfEmail, sendAdminOrderNotificationEmail } from '@/lib/email/delivery';
import { isAdminRole, getUserRole } from '@/lib/auth/roles';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    // Verify admin access
    const role = await getUserRole(user, supabase);
    if (!isAdminRole(role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative privileges required to run payment simulations.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      serviceId,
      customerName = 'Test Admin Client',
      customerEmail = user?.email || 'admin@becomingher.co.ke',
      customerPhone = '+254 700 000 000',
      bookingDate,
      bookingTime,
      bookingNotes
    } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'Please select a service to simulate payment.' }, { status: 400 });
    }

    const service = await getServiceById(serviceId);
    if (!service) {
      return NextResponse.json({ error: 'Selected service could not be found.' }, { status: 404 });
    }

    const admin = await createAdminClient();

    // 1. Resolve or find matching customer profile
    let targetCustomerId = user?.id;
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', customerEmail.trim().toLowerCase())
      .maybeSingle();

    if (existingProfile?.id) {
      targetCustomerId = existingProfile.id;
    }

    const orderId = `ord-${Date.now()}`;
    const orderRef = `BH-TEST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionRef = `SIM_TEST_${Date.now()}`;
    const timestamp = new Date().toISOString();

    let bookingId: string | undefined = undefined;
    let meetingLink: string | undefined = undefined;

    // 2. Handle Interpersonal Session booking setup if relevant
    if (service.type === 'INTERPERSONAL_SESSION') {
      bookingId = `book-${Date.now()}`;
      meetingLink = `https://meet.google.com/bch-test-${Math.random().toString(36).substring(2, 6)}`;

      const bookingPayload = {
        id: bookingId,
        customer_id: targetCustomerId,
        customer_name: customerName,
        customer_email: customerEmail,
        coach_id: store.coach.id,
        coach_name: store.coach.name,
        service_id: service.id,
        scheduled_date: bookingDate || '2026-09-25',
        start_time: bookingTime || '10:00 AM (EAT)',
        end_time: '11:00 AM (EAT)',
        timezone: 'Africa/Nairobi (EAT)',
        order_id: orderId,
        payment_status: 'SUCCESSFUL',
        booking_status: 'CONFIRMED',
        meeting_link: meetingLink,
        notes: bookingNotes || 'Simulated Test Booking by Admin',
        created_at: timestamp
      };

      await admin.from('bookings').upsert(bookingPayload);
    }

    // 3. Create the verified Order record
    const orderPayload = {
      id: orderId,
      order_reference: orderRef,
      customer_id: targetCustomerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      service_id: service.id,
      service_name: service.name,
      amount: service.price,
      currency: service.currency,
      payment_status: 'SUCCESSFUL',
      payment_provider: 'SELAR_SIMULATED',
      transaction_reference: transactionRef,
      metadata: {
        is_test: true,
        is_simulated_test: true,
        serviceType: service.type,
        bookingId,
        bookingDetails: service.type === 'INTERPERSONAL_SESSION' ? {
          scheduledDate: bookingDate || '2026-09-25',
          startTime: bookingTime || '10:00 AM (EAT)',
          meetingLink
        } : undefined
      },
      created_at: timestamp,
      updated_at: timestamp
    };

    const { data: insertedOrder, error: orderErr } = await admin
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr) {
      console.error('Simulate payment order creation error:', orderErr);
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    // 4. Create or activate customer entitlement
    await admin
      .from('entitlements')
      .upsert({
        customer_id: targetCustomerId,
        service_id: service.id,
        service_name: service.name,
        service_type: service.type,
        order_id: orderId,
        status: 'ACTIVE',
        progress_percentage: 0,
        start_date: timestamp
      });

    // 5. Send PDF materials / onboarding email to customer via Resend (verified domain)
    let emailResult = null;
    try {
      emailResult = await sendServicePdfEmail({
        customerEmail,
        customerName,
        serviceId: service.id,
        serviceTitle: service.name,
        orderReference: orderRef,
        pdfUrl: service.pdf_url || (service.resources?.[0] as any)?.file_url,
        pdfName: service.pdf_name || (service.resources?.[0] as any)?.file_name,
        pdfTitle: service.pdf_title || (service.resources?.[0] as any)?.title,
        booking: bookingId ? {
          scheduledDate: bookingDate || '2026-09-25',
          startTime: bookingTime || '10:00 AM (EAT)',
          meetingLink: meetingLink || 'https://meet.google.com/bch-consultation',
          coachName: store.coach.name
        } : undefined
      });
    } catch (e: any) {
      console.warn('Simulated order email dispatch warning:', e?.message);
    }

    // 6. Send Admin Notification Email
    try {
      await sendAdminOrderNotificationEmail({
        orderReference: orderRef,
        customerName,
        customerEmail,
        customerPhone,
        serviceTitle: service.name,
        serviceId: service.id,
        amount: service.price,
        currency: service.currency,
        paymentProvider: 'SELAR_SIMULATED',
        paymentStatus: 'SUCCESSFUL',
        isTest: true,
        booking: bookingId ? {
          scheduledDate: bookingDate || '2026-09-25',
          startTime: bookingTime || '10:00 AM (EAT)',
          meetingLink,
          coachName: store.coach.name
        } : undefined
      });
    } catch (e: any) {
      console.warn('Simulated order admin notification warning:', e?.message);
    }

    // 7. Audit Log
    store.addAuditLog(
      'SIMULATE_PAYMENT',
      `Order ${orderRef}`,
      `Simulated verified payment for ${service.name} (KES ${service.price.toLocaleString()}) to ${customerEmail}`,
      user?.email || 'admin@becomingher.co.ke'
    );

    return NextResponse.json({
      success: true,
      message: `Test payment successfully simulated for ${service.name}! Order ${orderRef} is active.`,
      order: insertedOrder,
      emailResult
    });
  } catch (err: any) {
    console.error('Error in simulate payment route:', err);
    return NextResponse.json({ error: err.message || 'Simulation failed.' }, { status: 500 });
  }
}
