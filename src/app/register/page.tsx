import { signup } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react'

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

            <form action={signup} className="space-y-4">
              <input type="hidden" name="redirect" value={redirectTarget} />
              <input type="hidden" name="source" value={source || ''} />
              <input type="hidden" name="service" value={service || ''} />

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-stone-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Grace Mwangi"
                  className="rounded-xl border-stone-200 focus-visible:ring-rose-900 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-stone-700">
                  Phone Number (WhatsApp)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={phone || ''}
                  placeholder="+254 712 345 678"
                  className="rounded-xl border-stone-200 focus-visible:ring-rose-900 text-sm"
                />
                <span className="text-[10px] text-stone-500 block">
                  Used to receive coaching reminders, meeting links, and WhatsApp AI companion sync.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="grace.mwangi@gmail.com"
                  className="rounded-xl border-stone-200 focus-visible:ring-rose-900 text-sm"
                  required
                />
                <span className="text-[10px] text-stone-500 block">
                  Use your active personal email where you receive purchase confirmations.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                  Create Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  minLength={6}
                  className="rounded-xl border-stone-200 focus-visible:ring-rose-900 text-sm"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-950 hover:bg-stone-900 text-amber-50 text-xs font-semibold transition shadow"
              >
                Create Account & Continue
              </Button>
            </form>

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
