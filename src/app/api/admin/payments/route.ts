import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

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

