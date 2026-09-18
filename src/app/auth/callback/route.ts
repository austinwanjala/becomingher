import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') || '/reset-password';

  // Determine the canonical base URL for redirection
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectBase = host ? `${proto}://${host}` : origin;

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
    console.error('Error verifying OTP token_hash in auth callback:', error);
    return NextResponse.redirect(`${redirectBase}/forgot-password?error=expired`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
    console.error('Error exchanging code for session in auth callback:', error);
    return NextResponse.redirect(`${redirectBase}/forgot-password?error=expired`);
  }

  return NextResponse.redirect(`${redirectBase}${next}`);
}
