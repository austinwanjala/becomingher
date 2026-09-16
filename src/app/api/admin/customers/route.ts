import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase admin credentials' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Fetch users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Fetch entitlements
    const { data: entitlements, error: entError } = await supabaseAdmin
      .from('entitlements')
      .select('*');
    if (entError) throw entError;

    // Fetch orders for total spent
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('customer_id, amount');
    
    // Combine data
    const customersMap = new Map();

    for (const user of usersData.users) {
      customersMap.set(user.id, {
        id: user.id,
        name: user.user_metadata?.full_name || 'Unknown',
        email: user.email,
        phone: user.phone || 'N/A',
        role: 'CUSTOMER',
        programmes: [],
        questionnaires: [],
        sessions: 0,
        totalSpent: 0,
        joined: new Date(user.created_at).toISOString().split('T')[0]
      });
    }

    // Add entitlements
    if (entitlements) {
      for (const ent of entitlements) {
        const cust = customersMap.get(ent.customer_id);
        if (cust) {
          cust.programmes.push(ent.service_name);
          if (ent.questionnaire_url) {
            cust.questionnaires.push({ service: ent.service_name, url: ent.questionnaire_url });
          }
          if (ent.service_type === 'INTERPERSONAL_COACHING' || ent.service_type === 'CUSTOMIZED_COACHING') {
            cust.sessions += 1; // Simplify
          }
        }
      }
    }

    // Add orders
    if (orders) {
      for (const order of orders) {
        const cust = customersMap.get(order.customer_id);
        if (cust && order.amount) {
          cust.totalSpent += Number(order.amount);
        }
      }
    }

    const customersList = Array.from(customersMap.values());
    
    return NextResponse.json({ customers: customersList });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
