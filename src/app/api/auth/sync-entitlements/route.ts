import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ entitlements: [], orders: [] }, { status: 200 });
    }

    const admin = await createAdminClient();

    // 1. Fetch all successful orders matching either customer_id or customer_email
    const userEmail = user.email?.toLowerCase().trim();
    let query = admin
      .from('orders')
      .select('*')
      .eq('payment_status', 'SUCCESSFUL');

    if (userEmail) {
      query = query.or(`customer_id.eq.${user.id},customer_email.ilike.${userEmail}`);
    } else {
      query = query.eq('customer_id', user.id);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders for sync:', ordersError);
    }

    // 2. Fetch existing entitlements for user
    const { data: existingEntitlements, error: entError } = await admin
      .from('entitlements')
      .select('*')
      .eq('customer_id', user.id);

    const existingServiceIds = new Set(
      (existingEntitlements || []).map((e: any) => e.service_id)
    );

    // 3. For any successful order whose service_id is not in entitlements for this user, create it
    if (orders && orders.length > 0) {
      for (const order of orders) {
        // Also ensure orders.customer_id is synced to user.id if it wasn't
        if (order.customer_id !== user.id) {
          await admin
            .from('orders')
            .update({ customer_id: user.id })
            .eq('id', order.id);
        }

        if (!existingServiceIds.has(order.service_id)) {
          const serviceType =
            order.service_id === 'srv-book-04'
              ? 'DIGITAL_PRODUCT'
              : order.service_id === 'srv-interpersonal-03'
              ? 'INTERPERSONAL_SESSION'
              : order.service_id === 'srv-custom-02'
              ? 'CUSTOM_COACHING'
              : 'DIGITAL_PROGRAMME';

          const { data: newEnt } = await admin
            .from('entitlements')
            .insert({
              customer_id: user.id,
              service_id: order.service_id,
              service_name: order.service_name || 'Becoming Her Service',
              service_type: serviceType,
              order_id: order.id,
              status: 'ACTIVE',
              progress_percentage: 0
            })
            .select();

          if (newEnt && newEnt.length > 0) {
            existingServiceIds.add(order.service_id);
          }
        }
      }
    }

    // 4. Also link any bookings by email to this user.id
    if (userEmail) {
      await admin
        .from('bookings')
        .update({ customer_id: user.id })
        .ilike('customer_email', userEmail)
        .neq('customer_id', user.id);
    }

    // 5. Fetch fresh final entitlements
    const { data: finalEntitlements } = await admin
      .from('entitlements')
      .select('*')
      .eq('customer_id', user.id)
      .eq('status', 'ACTIVE');

    return NextResponse.json({
      success: true,
      entitlements: finalEntitlements || []
    });
  } catch (error: any) {
    console.error('Error in sync-entitlements API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
