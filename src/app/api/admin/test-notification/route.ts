import { NextResponse } from 'next/server';
import { sendAdminOrderNotificationEmail } from '@/lib/email/delivery';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify admin access
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase());

    const isSystemAdmin =
      user &&
      (user.user_metadata?.role === 'ADMIN' ||
        (user.email && adminEmails.includes(user.email.toLowerCase())));

    if (!user || !isSystemAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin credentials required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetEmail = body.email;

    const result = await sendAdminOrderNotificationEmail({
      orderReference: `TEST-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: 'Austine Wanjala (Test Customer)',
      customerEmail: 'customer.test@example.com',
      customerPhone: '+254 700 000 000',
      serviceTitle: 'Guided Digital Coaching Programme',
      serviceId: 'srv-guided-01',
      amount: 1000,
      currency: 'KES',
      paymentProvider: 'SELAR',
      paymentStatus: 'SUCCESSFUL',
      isTest: true,
      booking: {
        scheduledDate: '2026-09-25',
        startTime: '10:00 AM (EAT)',
        meetingLink: 'https://meet.google.com/test-session-link',
        coachName: 'Lead Coach Zipporah Karanja'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test notification dispatched successfully! Please check your inbox.',
      deliveryResult: result
    });
  } catch (err: any) {
    console.error('Test notification API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch test notification.' },
      { status: 500 }
    );
  }
}
