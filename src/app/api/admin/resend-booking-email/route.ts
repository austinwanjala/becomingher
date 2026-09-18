import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { sendServicePdfEmail } from '@/lib/email/delivery';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { bookingId, isUpdatedLink, meetingLink } = data;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();
    const { data: dbBookings } = await adminSupabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .limit(1);

    const booking = dbBookings?.[0] || store.bookings.find(b => b.id === bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Attempt to find the associated order to get customer email/name
    let order: any = null;
    if (booking.order_id) {
      const { data: dbOrders } = await adminSupabase
        .from('orders')
        .select('*')
        .eq('id', booking.order_id)
        .limit(1);
      order = dbOrders?.[0];
    }
    if (!order) {
      order = store.orders.find(o => o.metadata?.bookingId === bookingId || o.id === booking.order_id);
    }
    if (!order) {
      // Fallback: construct order info from booking customer details
      order = {
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        service_id: booking.service_id,
        service_name: '1-on-1 Interpersonal Session',
        order_reference: booking.id
      };
    }
    const emailResult = await sendServicePdfEmail({
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      serviceId: order.service_id,
      serviceTitle: order.service_name,
      orderReference: order.order_reference,
      booking: {
        scheduledDate: booking.scheduled_date,
        startTime: booking.start_time,
        meetingLink: meetingLink || booking.meeting_link || '',
        coachName: booking.coach_name,
        isResend: true,
        isUpdatedLink: Boolean(isUpdatedLink ?? true)
      }
    });

    store.addAuditLog(
      'BOOKING_EMAIL_RESENT',
      'EMAILS',
      `Booking confirmation email resent for ${booking.id} (${order.customer_email}).`
    );

    return NextResponse.json({
      success: true,
      message: 'Booking email successfully resent.',
      delivery: emailResult
    });
  } catch (error: any) {
    console.error('Error resending booking email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error resending email.' },
      { status: 500 }
    );
  }
}
