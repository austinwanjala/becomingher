'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { adminLogin } from './actions';
import { BrandLogo } from '@/components/BrandLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}) {
  const params = use(searchParams);
  const message = params.message;
  const redirectTarget = params.redirect || '/admin';

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950 p-4 text-stone-100 relative overflow-hidden selection:bg-rose-900 selection:text-amber-100">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-rose-950/40 via-amber-950/20 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2.5">
          <BrandLogo href="/" variant="dark" size="lg" />
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest text-rose-300 font-semibold">
              Administrative Console
            </span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-stone-800/90 shadow-2xl bg-stone-900/90 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1.5 text-center pb-4 border-b border-stone-800/80">
            <div className="mx-auto w-8 h-8 rounded-full bg-stone-800/80 text-rose-300 flex items-center justify-center mb-1">
              <Shield className="w-4 h-4" />
            </div>
            <CardTitle className="font-serif text-xl font-bold text-stone-100">
              Authorized Sign In
            </CardTitle>
            <CardDescription className="text-xs text-stone-400">
              Access restricted to Coach Zipporah Karanja and authorized staff.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {/* Feedback / Error banner */}
            {message && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5">Authentication Alert</span>
                  <span>{message}</span>
                </div>
              </div>
            )}

            <form action={adminLogin} onSubmit={() => setSubmitting(true)} className="space-y-4">
              <input type="hidden" name="redirect" value={redirectTarget} />

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-stone-300">
                  Administrator Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="zipporah@becomingher.co.ke"
                    className="rounded-xl border-stone-700 bg-stone-950/60 text-white placeholder:text-stone-500 text-sm focus-visible:ring-rose-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-stone-300">
                    Security Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="rounded-xl border-stone-700 bg-stone-950/60 text-white placeholder:text-stone-500 text-sm pr-10 focus-visible:ring-rose-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-950 via-rose-900 to-amber-900 hover:from-stone-900 hover:to-rose-950 text-amber-100 text-xs font-semibold transition shadow-lg border border-rose-800/40 mt-2"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <KeyRound className="w-3.5 h-3.5" />
                    Access Admin Console
                  </span>
                )}
              </Button>
            </form>


          </CardContent>
        </Card>

        {/* Back to Public Site */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Becoming Her Website
          </Link>
        </div>
      </div>
    </div>
  );
}
