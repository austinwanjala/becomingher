import Link from 'next/link';
import { Gem, CheckCircle2, ArrowRight, Brain, ClipboardList, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';
import { ServiceDisclaimer } from '@/components/DisclaimerModal';

export default function CustomCoachingPage() {
  const service = store.getServiceBySlug('custom-coaching') || store.services[1];

  const onboardingQuestions = [
    'What specific area of your life would you like support with right now?',
    'What primary challenge or emotional block are you currently experiencing?',
    'What would you love to achieve over the next 90 days?',
    'What has been quietly preventing you from achieving it in the past?',
    'What are your top three current goals?',
    'What kind of coaching support do you prefer (e.g. gentle inquiry, direct strategy, structured journaling)?',
    'Anything else you would like Coach Zipporah and your reflection companion to know?'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] border-b border-stone-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <Gem className="w-3.5 h-3.5 text-rose-700" /> Bespoke & Intentionally Architected
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-stone-900">
              {service.name}
            </h1>
            <p className="text-stone-600 text-base max-w-2xl mx-auto leading-relaxed">
              {service.description}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/checkout/${service.id}`}
                className="px-8 py-3.5 rounded-full bg-stone-900 text-amber-50 text-sm font-semibold hover:bg-rose-950 transition shadow-md"
              >
                Start Customized Coaching ({service.currency} {service.price.toLocaleString()})
              </Link>
            </div>

            <div className="pt-4 max-w-xl mx-auto">
              <ServiceDisclaimer serviceType="custom" />
            </div>
          </div>
        </section>

        {/* The 3-Step Process */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              How Customized Coaching Works
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              A private container calibrated to your unique life circumstances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-serif font-semibold text-stone-900 text-lg">
                Secure Selar Checkout
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Complete your investment via M-Pesa or card. Your active entitlement is instantaneously created upon payment verification.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-serif font-semibold text-stone-900 text-lg">
                Deep Life Questionnaire
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Answer our 7 foundational assessment questions detailing your career, personal blocks, relationships, and desired milestone outcomes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-serif font-semibold text-stone-900 text-lg">
                Continuous Personalized Guidance
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Your dedicated coaching companion initiates a bespoke dialogue, offering tailored questions, customized journaling prompts, and persistent goal tracking.
              </p>
            </div>
          </div>

          {/* Questionnaire Preview */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <ClipboardList className="w-4 h-4" /> Confidential Onboarding Assessment
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Sample Onboarding Questions You Will Complete
              </h3>
              <p className="text-xs text-stone-500">
                These questions form the contextual memory for your coaching journey.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onboardingQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-700 flex gap-2.5">
                  <span className="font-semibold text-rose-900 shrink-0">{idx + 1}.</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-stone-500">All responses encrypted and protected.</span>
              <Link
                href={`/checkout/${service.id}`}
                className="px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition"
              >
                Enroll & Begin Assessment →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
