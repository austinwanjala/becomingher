import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { sendPasswordResetEmail } from '@/lib/email/delivery';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Resolve base URL for password recovery redirection
    const requestOrigin = request.headers.get('origin') || request.headers.get('host') || '';
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'https://becomingher-five.vercel.app';

    if (requestOrigin.startsWith('http')) {
      baseUrl = requestOrigin;
    } else if (requestOrigin && !baseUrl.includes('localhost')) {
      baseUrl = `https://${requestOrigin}`;
    }

    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    const redirectTo = `${baseUrl}/auth/callback?next=/reset-password`;

    // 1. Generate secure recovery action link via Supabase Admin
    const admin = await createAdminClient();
    let actionLink: string | null = null;

    try {
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: {
          redirectTo
        }
      });

      if (!linkErr && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      }
    } catch (adminErr) {
      console.warn('generateLink warning:', adminErr);
    }

    // 2. Also trigger standard Supabase password recovery
    try {
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo
      });
    } catch (standardErr) {
      console.warn('resetPasswordForEmail warning:', standardErr);
    }

    // 3. If action link is available, dispatch branded email via Resend
    if (actionLink) {
      await sendPasswordResetEmail({
        email: cleanEmail,
        resetLink: actionLink
      });
    }

    // Always respond with success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched to your inbox.'
    });
  } catch (err: any) {
    console.error('Forgot password API error:', err);
    return NextResponse.json(
      { error: err.message || 'Unable to process password reset request.' },
      { status: 500 }
    );
  }
}
