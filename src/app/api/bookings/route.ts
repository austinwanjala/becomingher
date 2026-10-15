import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { store } from '@/lib/store';

/**
 * GET /api/bookings
 * Returns all bookings for the authenticated customer.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const admin = await createAdminClient();
    const { data: dbBookings, error: dbError } = await admin
      .from('bookings')
      .select('*')
      .or(`customer_id.eq.${user.id},customer_email.eq.${user.email}`)
      .order('scheduled_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (!dbError && dbBookings && dbBookings.length > 0) {
      return NextResponse.json({ bookings: dbBookings });
    }

    // Fallback to store
    const storeBookings = store.bookings.filter(
      (b) => b.customer_id === user.id || (user.email && b.customer_email?.toLowerCase() === user.email.toLowerCase())
    );

    return NextResponse.json({ bookings: storeBookings });
  } catch (err: any) {
    console.error('[BOOKINGS_GET] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error', bookings: [] }, { status: 500 });
  }
}

/**
 * DELETE /api/bookings
 * Allows a customer to delete a scheduled meeting whose payment is not verified.
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (_) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    const admin = await createAdminClient();

    // 1. Fetch booking from Supabase
    let booking: any = null;
    const { data: dbBooking } = await admin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (dbBooking) {
      booking = dbBooking;
    } else {
      // Check in store
      booking = store.bookings.find((b) => b.id === id);
    }

    if (!booking) {
      return NextResponse.json({ error: 'Scheduled meeting not found.' }, { status: 404 });
    }

    // 2. Validate ownership: user must own this booking
    const isOwner =
      booking.customer_id === user.id ||
      (user.email && booking.customer_email && booking.customer_email.toLowerCase() === user.email.toLowerCase());

    if (!isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this meeting.' },
        { status: 403 }
      );
    }

    // 3. Validate payment status: Only allow deletion if payment is NOT verified
    const isVerifiedPayment =
      booking.payment_status === 'SUCCESSFUL' && booking.booking_status === 'CONFIRMED';

    if (isVerifiedPayment) {
      return NextResponse.json(
        {
          error:
            'This scheduled meeting has already been verified and confirmed. Paid coaching sessions cannot be deleted directly. Please contact support to reschedule.'
        },
        { status: 400 }
      );
    }

    // 4. Delete the booking from Supabase
    const { error: deleteError } = await admin
      .from('bookings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[BOOKING_DELETE] Supabase delete error:', deleteError);
      return NextResponse.json(
        { error: `Database error deleting booking: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // 5. Remove from in-memory store
    store.deleteBooking(id);

    // 6. If there is a pending order referencing this booking, update or cancel it
    try {
      await admin
        .from('orders')
        .update({ payment_status: 'CANCELLED' })
        .eq('metadata->>bookingId', id)
        .eq('payment_status', 'PENDING');
    } catch (orderErr) {
      console.warn('[BOOKING_DELETE] Order update non-blocking error:', orderErr);
    }

    // 7. Audit log
    store.addAuditLog(
      'BOOKING_DELETED_BY_CUSTOMER',
      'BOOKINGS',
      `Unverified meeting reservation ${id} (${booking.scheduled_date} at ${booking.start_time}) deleted by customer ${user.email}`
    );

    return NextResponse.json({
      success: true,
      message: 'Scheduled meeting reservation deleted successfully. The time slot has been released.'
    });
  } catch (err: any) {
    console.error('[BOOKINGS_DELETE] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
