'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, AlertCircle, ArrowRight, ShieldCheck, Feather, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('order_id') || '';
  const serviceId = searchParams.get('service_id') || '';
  const transactionRef = searchParams.get('custom_ref') || searchParams.get('reference') || '';

  const [status, setStatus] = useState<'verifying' | 'confirmed' | 'pending' | 'failed'>('verifying');
  const [message, setMessage] = useState("We're confirming your payment with Selar...");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    let intervalId: any;
    let attempts = 0;
    const maxAttempts = 6;

    const checkVerification = async () => {
      attempts++;
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            transactionReference: transactionRef
          })
        });

        const data = await res.json();

        if (res.ok && data.verified) {
          setStatus('confirmed');
          setMessage('Payment successful. Your coaching experience is now unlocked.');
          setDetails(data);
          clearInterval(intervalId);
        } else if (attempts >= maxAttempts) {
          setStatus('pending');
          setMessage('Your payment is being confirmed. Your access will be activated once confirmation is received.');
          clearInterval(intervalId);
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          setStatus('failed');
          setMessage('We could not confirm your payment automatically. Please reach out to our team with your transaction details.');
          clearInterval(intervalId);
        }
      }
    };

    // Initial check after short delay
    const initialTimer = setTimeout(() => {
      checkVerification();
      // Poll every 3 seconds for up to ~18s
      intervalId = setInterval(checkVerification, 3000);
    }, 1500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [orderId, transactionRef]);

  return (
    <div className="min-h-screen bg-stone-50/70 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200/80 p-8 text-center space-y-6">
        {/* Brand indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-medium tracking-wide">
          <Feather className="w-3.5 h-3.5 text-rose-600" /> Becoming Her Sanctuary
        </div>

        {/* Status Graphic */}
        <div className="flex justify-center">
          {status === 'verifying' && (
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center animate-pulse">
                <Loader2 className="w-10 h-10 text-rose-700 animate-spin" />
              </div>
            </div>
          )}

          {status === 'confirmed' && (
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-200">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          )}

          {status === 'pending' && (
            <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner border border-amber-200">
              <ShieldCheck className="w-10 h-10" />
            </div>
          )}

          {status === 'failed' && (
            <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Status Titles */}
        <div className="space-y-2">
          <h1 className="text-2xl font-serif text-stone-900 font-semibold tracking-tight">
            {status === 'verifying' && "We're confirming your payment…"}
            {status === 'confirmed' && "Payment Confirmed!"}
            {status === 'pending' && "Verification in Progress"}
            {status === 'failed' && "Verification Notice"}
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Confirmed details card */}
        {status === 'confirmed' && details && (
          <div className="bg-stone-50 rounded-xl p-4 text-left text-xs text-stone-700 space-y-2 border border-stone-200/60">
            <div className="flex justify-between">
              <span className="text-stone-500">Service:</span>
              <span className="font-medium text-stone-900">{details.order?.service_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Amount Paid:</span>
              <span className="font-semibold text-rose-900">{details.order?.currency} {details.order?.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Reference:</span>
              <span className="font-mono text-stone-600">{details.order?.order_reference}</span>
            </div>
            {details.booking && (
              <div className="pt-2 border-t border-stone-200 flex items-center gap-2 text-emerald-800 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Session Scheduled: {details.booking.scheduled_date} at {details.booking.start_time}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          {status === 'confirmed' && (
            <Link
              href={
                details?.order?.service_id === 'srv-custom-02'
                  ? '/dashboard/coaching?onboarding=start'
                  : '/dashboard/programmes'
              }
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition shadow-md"
            >
              <span>Begin Your Journey</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {status === 'pending' && (
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {status === 'failed' && (
            <div className="flex flex-col gap-2">
              <Link
                href="/contact"
                className="w-full py-2.5 rounded-xl bg-rose-800 text-white font-medium hover:bg-rose-900 transition text-sm"
              >
                Contact Support
              </Link>
              <Link
                href="/"
                className="w-full py-2 rounded-xl text-stone-600 font-medium hover:text-stone-900 transition text-sm"
              >
                Return to Homepage
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading confirmation...</div>}>
      <PaymentReturnContent />
    </Suspense>
  );
}
