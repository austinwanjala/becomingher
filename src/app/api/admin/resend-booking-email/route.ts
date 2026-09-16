import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { sendServicePdfEmail } from '@/lib/email/delivery';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { bookingId } = data;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const booking = store.bookings.find(b => b.id === bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Attempt to find the associated order to get customer email/name
    const order = store.orders.find(o => o.metadata?.bookingId === bookingId || o.id === booking.order_id);
    if (!order) {
      return NextResponse.json({ error: 'Order for booking not found' }, { status: 404 });
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
        meetingLink: booking.meeting_link || '',
        coachName: booking.coach_name
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
