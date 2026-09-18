import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { getUserRole, isAdminRole } from '@/lib/auth/roles';
import { store } from '@/lib/store';

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

    const role = await getUserRole(user, supabase);
    if (!isAdminRole(role)) {
      return NextResponse.json({ error: "You don't have access rights." }, { status: 403 });
    }

    const admin = await createAdminClient();
    const { data: bookings, error } = await admin
      .from('bookings')
      .select('*')
      .order('scheduled_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('[ADMIN_BOOKINGS_GET] Error fetching bookings from Supabase:', error);
      return NextResponse.json({ error: error.message, bookings: [] }, { status: 500 });
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (err: any) {
    console.error('[ADMIN_BOOKINGS_GET] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error', bookings: [] }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const role = await getUserRole(user, supabase);
    if (!isAdminRole(role)) {
      return NextResponse.json({ error: "You don't have access rights." }, { status: 403 });
    }

    const body = await request.json();
    const { id, meeting_link, booking_status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const admin = await createAdminClient();
    const updatePayload: Record<string, any> = {};

    if (meeting_link !== undefined) updatePayload.meeting_link = meeting_link;
    if (booking_status !== undefined) updatePayload.booking_status = booking_status;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data: updatedBooking, error } = await admin
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ADMIN_BOOKINGS_PATCH] Error updating booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    store.addAuditLog(
      'BOOKING_UPDATED_BY_ADMIN',
      'BOOKINGS',
      `Booking ${id} updated by ${user.email} (${JSON.stringify(updatePayload)})`
    );

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (err: any) {
    console.error('[ADMIN_BOOKINGS_PATCH] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const role = await getUserRole(user, supabase);
    if (!isAdminRole(role)) {
      return NextResponse.json({ error: "You don't have access rights." }, { status: 403 });
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
    const { error } = await admin
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ADMIN_BOOKINGS_DELETE] Error deleting booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    store.addAuditLog(
      'BOOKING_DELETED_BY_ADMIN',
      'BOOKINGS',
      `Booking ${id} permanently deleted by ${user.email}`
    );

    return NextResponse.json({ success: true, message: `Booking ${id} deleted successfully.` });
  } catch (err: any) {
    console.error('[ADMIN_BOOKINGS_DELETE] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

