import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AlertCircle } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 border-b border-stone-200 pb-4">
          Coaching & AI Safety Disclaimer
        </h1>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p>
            Becoming Her, its programmes, coaches, and AI digital coaching assistant provide personal development and life-clarity coaching only. We do not provide clinical therapy, psychiatric treatment, medical care, legal representation, or financial advice.
          </p>
        </div>
        <div className="prose prose-stone text-xs sm:text-sm leading-relaxed space-y-6 text-stone-700">
          <h3 className="font-serif text-lg font-semibold text-stone-900">1. Coaching vs. Therapy</h3>
          <p>
            Coaching is an inquiry-based, forward-focused partnership designed to clarify goals, overcome limiting mindsets, and cultivate personal sovereignty. It is not psychotherapy, clinical counseling, or a substitute for mental health crisis intervention.
          </p>
          <h3 className="font-serif text-lg font-semibold text-stone-900">2. Emergency & Crisis Resources</h3>
          <p>
            If you or someone you know is in acute distress, experiencing thoughts of self-harm, or facing an immediate emergency, please contact local professional emergency services right away:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Kenya Emergency Line</strong>: 999 / 112</li>
            <li><strong>Kenya Red Cross Crisis Helpline</strong>: 1199 (Toll-free 24/7)</li>
            <li><strong>Befrienders Kenya</strong>: +254 722 178 177</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
