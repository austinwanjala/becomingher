'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Feather } from 'lucide-react';

function PaymentReturnRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const params = searchParams.toString();
    const destination = params ? `/thank-you?${params}` : '/thank-you';
    router.replace(destination);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200/80 p-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-medium tracking-wide">
          <Feather className="w-3.5 h-3.5 text-rose-600" /> Becoming Her Sanctuary
        </div>
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-rose-700 animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-serif text-stone-900 font-semibold tracking-tight">
            Directing to Your Thank You Sanctuary...
          </h1>
          <p className="text-xs text-stone-500">
            Finalizing your enrollment and preparing your materials.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">Loading...</div>}>
      <PaymentReturnRedirect />
    </Suspense>
  );
}
