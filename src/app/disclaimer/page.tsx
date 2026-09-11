import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AlertCircle, ShieldCheck, HeartHandshake } from 'lucide-react';
import { OFFICIAL_DISCLAIMER_PARAGRAPHS } from '@/lib/disclaimer';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="space-y-2 border-b border-stone-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
            <HeartHandshake className="w-3.5 h-3.5 text-rose-800" />
            <span>Official Becoming Her Disclaimer</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
            Coaching & Personal Development Disclaimer
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Becoming Her is a personal development and coaching programme based on experience and practical insights, and is NOT therapy or counselling.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-stone-900">
              Please Note:
            </p>
            <p className="text-stone-700 leading-relaxed">
              Becoming Her is a personal development and coaching programme based on experience, practical insights, reflection, and personal growth. It is not therapy, counselling, medical treatment, or psychological treatment, and it does not replace care or advice from a qualified professional.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-6 text-stone-700 text-sm sm:text-base leading-relaxed font-sans">
          {OFFICIAL_DISCLAIMER_PARAGRAPHS.map((paragraph, idx) => (
            <p key={idx} className="text-stone-800">
              {paragraph}
            </p>
          ))}

          <div className="pt-8 border-t border-stone-100 space-y-4">
            <h2 className="font-serif text-xl font-semibold text-stone-900">
              Emergency & Crisis Resources
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              If you or someone you know is in acute emotional distress, experiencing thoughts of self-harm, or facing an emergency, please connect with a qualified health professional or an emergency service immediately:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="font-semibold text-stone-900 block">Kenya Emergency Services</span>
                <span className="text-stone-600">Dial 999 or 112 (Toll-free 24/7)</span>
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="font-semibold text-stone-900 block">Kenya Red Cross Helpline</span>
                <span className="text-stone-600">Dial 1199 (Toll-free 24/7 Crisis Support)</span>
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="font-semibold text-stone-900 block">Befrienders Kenya</span>
                <span className="text-stone-600">+254 722 178 177 / support line</span>
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="font-semibold text-stone-900 block">International Support</span>
                <span className="text-stone-600">Contact local health providers or nearest emergency room</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
