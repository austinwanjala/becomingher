'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signup } from '@/app/register/actions';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';

interface RegisterFormProps {
  redirectTarget: string;
  source?: string;
  service?: string;
  phone?: string;
}

export function RegisterForm({
  redirectTarget,
  source,
  service,
  phone
}: RegisterFormProps) {
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        if (!isDisclaimerAccepted) return;
        setIsSubmitting(true);
        await signup(formData);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="redirect" value={redirectTarget} />
      <input type="hidden" name="source" value={source || ''} />
      <input type="hidden" name="service" value={service || ''} />
      <input
        type="hidden"
        name="disclaimer_accepted"
        value={isDisclaimerAccepted ? 'true' : 'false'}
      />

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
          Used to receive coaching reminders, meeting links, and WhatsApp coaching companion updates.
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

      {/* Official Required Disclaimer Section */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
            <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Before you continue</span>
          </div>
          <DisclaimerModal triggerText="Read full disclaimer" />
        </div>

        <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed">
          Becoming Her provides personal development and coaching. It is not therapy, counselling, medical treatment, or psychological treatment.
        </p>

        <label
          htmlFor="reg-disclaimer-checkbox"
          className="flex items-start gap-2.5 pt-1 cursor-pointer select-none group"
        >
          <input
            id="reg-disclaimer-checkbox"
            type="checkbox"
            name="disclaimer_checkbox_ui"
            checked={isDisclaimerAccepted}
            onChange={(e) => setIsDisclaimerAccepted(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 accent-stone-900 focus:ring-rose-900 cursor-pointer shrink-0"
          />
          <span className="text-[11px] sm:text-xs text-stone-800 group-hover:text-stone-950 font-medium leading-snug">
            I understand and agree that Becoming Her provides coaching and personal development, not therapy or counselling.
          </span>
        </label>
      </div>

      <Button
        type="submit"
        disabled={!isDisclaimerAccepted || isSubmitting}
        className="w-full py-3.5 rounded-xl bg-rose-950 hover:bg-stone-900 text-amber-50 text-xs font-semibold transition shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating Secure Profile...</span>
          </>
        ) : (
          <span>Create Account & Continue</span>
        )}
      </Button>

      {!isDisclaimerAccepted && (
        <p className="text-[10px] text-center text-stone-500 italic">
          Please check the disclaimer box above to enable account creation.
        </p>
      )}
    </form>
  );
}
