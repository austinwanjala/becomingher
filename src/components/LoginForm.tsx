'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login } from '@/app/login/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SESSION_ACTIVE_KEY } from '@/lib/auth/session';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginForm({ redirectTarget }: { redirectTarget: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        try {
          sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        } catch (_) {}
        setSubmitting(true);
        await login(formData);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="redirect" value={redirectTarget} />

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
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-stone-500 hover:text-rose-900 transition"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="rounded-xl border-stone-200 focus-visible:ring-rose-900 text-sm pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-stone-900 hover:bg-rose-950 text-amber-50 text-xs font-semibold transition shadow flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing In...</span>
          </>
        ) : (
          <span>Sign In & Continue</span>
        )}
      </Button>
    </form>
  );
}
