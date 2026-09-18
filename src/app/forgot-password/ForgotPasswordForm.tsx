'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, Loader2, KeyRound } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useState(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const error = url.searchParams.get('error');
      if (error === 'expired') {
        setErrorMessage('Your password reset link has expired or has already been used. Please enter your email below to request a new one.');
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link.');
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 relative z-10">
      {/* Brand header */}
      <div className="text-center space-y-2 flex flex-col items-center">
        <BrandLogo href="/" size="md" variant="light" />
        <p className="text-xs text-stone-600 font-medium">
          Sovereign transformation & personal development
        </p>
      </div>

      <Card className="border-stone-200/90 shadow-md bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1 text-center pb-4 border-b border-stone-100">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-900 mx-auto mb-2">
            <KeyRound className="w-5 h-5 text-rose-900" />
          </div>
          <CardTitle className="font-serif text-2xl font-semibold text-stone-900">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-xs text-stone-500 max-w-xs mx-auto">
            Enter your email address and we will send you a secure link to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {isSuccess ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Password Reset Link Dispatched</span>
                </div>
                <p className="text-emerald-800">
                  We have sent a secure recovery link to <strong>{email}</strong>.
                  Please check your inbox (and spam/junk folder) and click the link to choose a new password.
                </p>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-900 hover:text-rose-950 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                  Account Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="grace.mwangi@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 rounded-xl border-stone-200 text-sm focus-visible:ring-rose-900"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full rounded-xl bg-stone-900 hover:bg-rose-950 text-white font-semibold text-xs py-5 shadow transition"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending Reset Link...
                  </span>
                ) : (
                  'Send Password Reset Link'
                )}
              </Button>

              <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-stone-600 hover:text-rose-900 transition font-medium"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </Link>
                <Link
                  href="/contact"
                  className="text-stone-400 hover:text-stone-700 transition"
                >
                  Need assistance?
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
