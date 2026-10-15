import type { Metadata } from 'next';
import { LoginForm } from '@/components/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { CleanBrowserUrl } from '@/components/CleanBrowserUrl';

export const metadata: Metadata = {
  title: 'Sign In | Becoming Her',
  description: 'Sign in to access your Becoming Her personal development and coaching sanctuary.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const rawMessage = params.message;
  // Don't show redundant generic banner
  const message = rawMessage && !rawMessage.toLowerCase().includes('customer portal') ? rawMessage : undefined;
  // Strictly isolate customer portal: /login must never redirect into /admin
  const rawRedirect = params.redirect || '/dashboard';
  const redirectTarget = rawRedirect.startsWith('/admin') ? '/dashboard' : rawRedirect;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] p-4 text-stone-900 relative">
      <CleanBrowserUrl />
      {/* Background ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-100/40 via-amber-50/30 to-transparent pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <BrandLogo href="/" size="md" variant="light" />
          <p className="text-xs text-stone-600 font-medium">
            Welcome back to your sovereign coaching sanctuary
          </p>
        </div>

        <Card className="border-stone-200/90 shadow-md bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pb-4 border-b border-stone-100">
            <CardTitle className="font-serif text-2xl font-semibold text-stone-900">
              Sign In to Your Account
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              {redirectTarget.includes('checkout')
                ? 'Sign in to link this purchase to your profile and continue checkout.'
                : 'Enter your email and password to access your dashboard.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {/* Feedback message banner */}
            {message && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-950 flex items-start gap-2.5 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5">Notice</span>
                  <span>{message}</span>
                </div>
              </div>
            )}

            <LoginForm redirectTarget={redirectTarget} />

            <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
              Don&apos;t have an account yet?{' '}
              <Link
                href={`/register?redirect=${encodeURIComponent(redirectTarget)}`}
                className="font-semibold text-rose-900 hover:text-stone-950 transition underline"
              >
                Create an Account
              </Link>
            </div>


          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
