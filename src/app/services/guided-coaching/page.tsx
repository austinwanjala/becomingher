import Link from 'next/link';
import { Sparkles, CheckCircle2, ArrowRight, BookOpen, Clock, ShieldCheck, FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';

export default function GuidedCoachingPage() {
  const service = store.getServiceBySlug('guided-coaching') || store.services[0];
  const programme = store.programme;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] border-b border-stone-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-rose-700" /> Digital Curriculum
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
                Enroll for {service.currency} {service.price.toLocaleString()}
              </Link>
            </div>
          </div>
        </section>

        {/* Curriculum Modules */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              Programme Curriculum & Architecture
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Four progressive modules designed for deep unlearning, self-trust, and sovereign embodiment.
            </p>
          </div>

          <div className="space-y-6">
            {programme.modules.map((module) => (
              <div
                key={module.id}
                className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-stone-900">
                    {module.title}
                  </h3>
                  <span className="text-xs text-rose-800 font-medium bg-rose-50 px-2.5 py-1 rounded-full">
                    {module.lessons.length} Guided Lessons • {module.reflection_questions.length} Reflections
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {module.description}
                </p>

                {/* Lessons in module */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-stone-900 block uppercase tracking-wider">
                    Included Lessons:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-2.5 text-xs"
                      >
                        <FileText className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-stone-900">{lesson.title}</p>
                          <p className="text-stone-500 text-[11px]">{lesson.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Access Control Callout */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-stone-900 to-rose-950 text-white text-center space-y-4">
            <h3 className="font-serif text-2xl font-semibold">
              Purchase this programme to unlock your coaching journey.
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto">
              Access is strictly restricted to active purchasers. Complete your secure Selar checkout to immediately access all lessons, reflection prompts, and AI assistant dialogues.
            </p>
            <Link
              href={`/checkout/${service.id}`}
              className="inline-block px-8 py-3.5 rounded-full bg-white text-stone-950 text-xs font-semibold hover:bg-amber-100 transition shadow"
            >
              Unlock Guided Programme ({service.currency} {service.price.toLocaleString()})
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
