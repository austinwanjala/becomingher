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

    // Fetch in parallel: Auth Users, Profiles, Entitlements, Orders, Bookings
    const [usersRes, profilesRes, entitlementsRes, ordersRes, bookingsRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers(),
      supabaseAdmin.from('profiles').select('*'),
      supabaseAdmin.from('entitlements').select('*'),
      supabaseAdmin.from('orders').select('*'),
      supabaseAdmin.from('bookings').select('*')
    ]);

    if (usersRes.error) throw usersRes.error;

    const authUsers = usersRes.data.users || [];
    const profiles = profilesRes.data || [];
    const entitlements = entitlementsRes.data || [];
    const orders = ordersRes.data || [];
    const bookings = bookingsRes.data || [];

    const profilesMap = new Map(profiles.map((p: any) => [p.id, p]));
    const customersMap = new Map<string, any>();

    for (const user of authUsers) {
      const prof = profilesMap.get(user.id);
      const meta = user.user_metadata || {};

      // Match orders for this user by customer_id or email
      const userOrders = orders.filter(
        (o: any) =>
          o.customer_id === user.id ||
          (o.customer_email && user.email && o.customer_email.toLowerCase() === user.email.toLowerCase())
      );

      // Match bookings for this user by customer_id or email
      const userBookings = bookings.filter(
        (b: any) =>
          b.customer_id === user.id ||
          (b.customer_email && user.email && b.customer_email.toLowerCase() === user.email.toLowerCase())
      );

      // Match entitlements for this user
      const userEntitlements = entitlements.filter((e: any) => e.customer_id === user.id);

      // Resolve human-readable name with smart fallback priority
      const candidateNames = [
        prof?.full_name,
        meta.full_name,
        meta.name,
        userBookings.find((b: any) => b.customer_name && b.customer_name !== 'me')?.customer_name,
        userOrders.find((o: any) => o.customer_name && o.customer_name !== 'me')?.customer_name
      ].filter((n): n is string => Boolean(n && typeof n === 'string' && n.trim() && n.trim() !== 'me' && n.trim() !== 'Unknown'));

      let resolvedName = candidateNames[0];
      if (!resolvedName) {
        if (user.email) {
          const prefix = user.email.split('@')[0].replace(/[._-]/g, ' ');
          resolvedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        } else {
          resolvedName = 'Beloved Member';
        }
      }

      // Resolve phone number
      const resolvedPhone =
        prof?.phone_number ||
        meta.phone ||
        meta.phone_number ||
        user.phone ||
        userOrders.find((o: any) => o.customer_phone)?.customer_phone ||
        'N/A';

      // Resolve 1-on-1 sessions
      // 1) Booked scheduled calls in bookings table
      const bookedSessions = userBookings.filter((b: any) => b.booking_status !== 'CANCELLED').length;
      // 2) Entitled interpersonal coaching services
      const entitledSessions = userEntitlements.filter((e: any) => {
        const st = (e.service_type || '').toUpperCase();
        const sn = (e.service_name || '').toLowerCase();
        const sid = (e.service_id || '').toLowerCase();
        return (
          st.includes('INTERPERSONAL') ||
          sn.includes('1-on-1') ||
          sn.includes('interpersonal') ||
          sid.includes('interpersonal')
        );
      }).length;
      const totalSessions = Math.max(bookedSessions, entitledSessions);

      // Aggregate enrolled programmes (deduplicated)
      const programmesSet = new Set<string>();
      userEntitlements.forEach((e: any) => {
        if (e.service_name) programmesSet.add(e.service_name);
      });
      userOrders.forEach((o: any) => {
        if (o.service_name && (o.payment_status === 'SUCCESSFUL' || !o.payment_status)) {
          programmesSet.add(o.service_name);
        }
      });

      // Questionnaires
      const questionnaires: { service: string; url: string }[] = [];
      userEntitlements.forEach((e: any) => {
        if (e.questionnaire_url) {
          questionnaires.push({ service: e.service_name || 'Custom Coaching', url: e.questionnaire_url });
        }
      });

      // Total Invested (KES)
      const totalSpent = userOrders
        .filter((o: any) => o.payment_status === 'SUCCESSFUL' || !o.payment_status)
        .reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0);

      customersMap.set(user.id, {
        id: user.id,
        name: resolvedName,
        email: user.email,
        phone: resolvedPhone,
        role: prof?.role || 'CUSTOMER',
        programmes: Array.from(programmesSet),
        questionnaires,
        sessions: totalSessions,
        totalSpent,
        joined: new Date(user.created_at).toISOString().split('T')[0]
      });
    }

    const customersList = Array.from(customersMap.values());

    return NextResponse.json({ customers: customersList });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
