import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Sparkles, AlertCircle, ArrowLeft } from 'lucide-react'
import { RegisterForm } from '@/components/RegisterForm'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    redirect?: string;
    source?: string;
    service?: string;
    phone?: string;
  }>
}) {
  const params = await searchParams;
  const message = params.message;
  const source = params.source;
  const service = params.service;
  const phone = params.phone;

  // Determine redirect target: prioritize service checkout if provided
  let redirectTarget = params.redirect || '/dashboard';
  if (redirectTarget.startsWith('/admin')) {
    redirectTarget = '/dashboard';
  }
  if (service) {
    redirectTarget = `/checkout/${service}`;
  }

  const isWhatsApp = source === 'whatsapp';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] p-4 text-stone-900 relative">
      {/* Background ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-100/40 via-amber-50/30 to-transparent pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-rose-950 flex items-center justify-center text-amber-100 shadow">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-rose-950 group-hover:text-stone-900 transition">
              Becoming Her
            </span>
          </Link>
          <p className="text-xs text-stone-600 font-medium">
            Begin your personal transformation & sovereign journey
          </p>
        </div>

        {/* WhatsApp Banner */}
        {isWhatsApp && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3 text-xs leading-relaxed shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
              WA
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Connected from WhatsApp</p>
              <p className="text-[11px] text-emerald-700">
                Complete your quick registration to link your WhatsApp coaching thread with your member portal!
              </p>
            </div>
          </div>
        )}

        <Card className="border-stone-200/90 shadow-md bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pb-4 border-b border-stone-100">
            <CardTitle className="font-serif text-2xl font-semibold text-stone-900">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              {redirectTarget.includes('checkout')
                ? 'An account is required to access your purchased coaching portal & materials.'
                : 'Enter your details to create your secure member profile.'}
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

            <RegisterForm
              redirectTarget={redirectTarget}
              source={source}
              service={service}
              phone={phone}
            />

            <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
              Already have an account?{' '}
              <Link
                href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
                className="font-semibold text-rose-900 hover:text-stone-950 transition underline"
              >
                Sign In
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
