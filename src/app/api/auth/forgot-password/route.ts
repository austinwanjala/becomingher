import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { sendPasswordResetEmail } from '@/lib/email/delivery';

function getAppBaseUrl(request: Request): string {
  // 1. If explicit environment variable is set and not localhost in production
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.startsWith('http') ? envUrl.replace(/\/$/, '') : `https://${envUrl}`.replace(/\/$/, '');
  }

  // 2. Vercel system production URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }

  // 3. Request headers from incoming HTTP request
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (host && host.includes('localhost') ? 'http' : 'https');

  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  // 4. In local development
  if (host && host.includes('localhost')) {
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  return 'https://becomingher-five.vercel.app';
}

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
    const baseUrl = getAppBaseUrl(request);

    // 1. Generate secure recovery token hash via Supabase Admin
    const admin = await createAdminClient();
    let resetLink: string | null = null;
    let recipientName: string | undefined = undefined;

    try {
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
      });

      if (linkErr) {
        console.warn('generateLink warning:', linkErr.message);
      } else if (linkData?.properties?.hashed_token) {
        // Direct link to our own app auth callback with token_hash.
        // This ensures the link stays on our domain (e.g. becomingher-five.vercel.app)
        // and never redirects through localhost:3000!
        resetLink = `${baseUrl}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`;
        recipientName = linkData.user?.user_metadata?.name;
      } else if (linkData?.properties?.action_link) {
        resetLink = linkData.properties.action_link;
      }
    } catch (adminErr) {
      console.warn('admin generateLink exception:', adminErr);
    }

    // 2. Dispatch branded email via Resend with the verified link
    if (resetLink) {
      await sendPasswordResetEmail({
        email: cleanEmail,
        resetLink,
        recipientName
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

