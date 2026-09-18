'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check for query parameters or hash in browser
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const token_hash = url.searchParams.get('token_hash');
      const type = (url.searchParams.get('type') as any) || 'recovery';
      const code = url.searchParams.get('code');
      const errorParam = url.searchParams.get('error') || url.searchParams.get('error_description');

      if (errorParam) {
        setErrorMessage('Your password reset link is invalid or has expired. Please request a new one.');
      }

      if (token_hash) {
        supabase.auth.verifyOtp({ token_hash, type }).then(({ data, error }) => {
          if (!error && data.session) {
            setSessionReady(true);
            setErrorMessage(null);
          } else if (error) {
            console.error('verifyOtp error on reset page:', error);
            setErrorMessage('Your reset link has expired or is invalid. Please request a new one.');
          }
        });
      } else if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (!error && data.session) {
            setSessionReady(true);
            setErrorMessage(null);
          } else if (error) {
            console.error('exchangeCode error on reset page:', error);
            setErrorMessage('Your reset link has expired or is invalid. Please request a new one.');
          }
        });
      }
    }

    // Check if session exists or listen for password recovery event
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      // Automatically navigate to dashboard after 2.5 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
    } catch (err: any) {
      console.error('Update password error:', err);
      setErrorMessage(
        err.message || 'Unable to update password. Your reset link may have expired. Please request a new one.'
      );
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
          Welcome back to your sovereign coaching sanctuary
        </p>
      </div>

      <Card className="border-stone-200/90 shadow-md bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1 text-center pb-4 border-b border-stone-100">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-900 mx-auto mb-2">
            <KeyRound className="w-5 h-5 text-rose-900" />
          </div>
          <CardTitle className="font-serif text-2xl font-semibold text-stone-900">
            Set New Password
          </CardTitle>
          <CardDescription className="text-xs text-stone-500 max-w-xs mx-auto">
            Choose a strong new password to securely access your personal development dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs leading-relaxed space-y-2">
                <div className="flex items-center justify-center gap-2 font-semibold text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Password Reset Successfully!</span>
                </div>
                <p className="text-emerald-800">
                  Your new password has been applied and your account is secured. Redirecting you to your sanctuary...
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-rose-950 text-white text-xs font-semibold shadow transition"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium transition"
                >
                  <span>Sign In Page</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 text-xs leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <span>{errorMessage}</span>
                    {errorMessage.includes('expired') && (
                      <div className="pt-1">
                        <Link
                          href="/forgot-password"
                          className="underline font-semibold text-rose-950"
                        >
                          Request a new reset link &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10 rounded-xl border-stone-200 text-sm focus-visible:ring-rose-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400">At least 6 characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-stone-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 rounded-xl border-stone-200 text-sm focus-visible:ring-rose-900"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full rounded-xl bg-stone-900 hover:bg-rose-950 text-white font-semibold text-xs py-5 shadow transition"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating Password...
                  </span>
                ) : (
                  'Update Password & Sign In'
                )}
              </Button>

              <div className="pt-2 text-center text-xs text-stone-500 border-t border-stone-100">
                <Link
                  href="/login"
                  className="text-stone-600 hover:text-rose-900 transition font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
