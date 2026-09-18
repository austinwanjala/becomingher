import { NextResponse } from 'next/server';
import { sendAdminOrderNotificationEmail } from '@/lib/email/delivery';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetEmail = body.email;

    const result = await sendAdminOrderNotificationEmail({
      orderReference: `TEST-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: 'Valued Client (Simulated Order)',
      customerEmail: 'customer.sample@becomingher.co.ke',
      customerPhone: '+254 720 120 227',
      serviceTitle: 'Guided Digital Coaching Programme',
      serviceId: 'srv-guided-01',
      amount: 1000,
      currency: 'KES',
      paymentProvider: 'SELAR',
      paymentStatus: 'SUCCESSFUL',
      isTest: true,
      adminEmailOverride: targetEmail || undefined,
      booking: {
        scheduledDate: 'Friday, 25 Sep 2026',
        startTime: '10:00 AM (EAT)',
        meetingLink: 'https://meet.google.com/bh-test-session',
        coachName: 'Lead Coach Zipporah Karanja'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Test notification dispatched successfully! Delivery: ${result.provider} (${result.message})`,
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
