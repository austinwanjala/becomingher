import Link from 'next/link';
import { Award, CheckCircle2, ArrowRight, BookOpen, Clock, ShieldCheck, FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';
import { ServiceDisclaimer } from '@/components/DisclaimerModal';
import { getServiceBySlug } from '@/lib/services';
import { getProgrammeByServiceId } from '@/lib/programmes';
import { notFound } from 'next/navigation';

export default async function GuidedCoachingPage() {
  const service = await getServiceBySlug('guided-coaching');
  if (!service) return notFound();
  
  const programme = await getProgrammeByServiceId(service.id);
  if (!programme) return notFound();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] border-b border-stone-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-rose-700" /> Digital Curriculum
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

            <div className="pt-4 max-w-xl mx-auto">
              <ServiceDisclaimer serviceType="guided" />
            </div>
          </div>
        </section>

        {/* Companion Book Showcase Banner */}
        {programme.book && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
            <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-amber-50 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-200/20">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="relative w-28 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-amber-200/30 shrink-0">
                  <img
                    src={programme.book.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
                    alt={programme.book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-rose-900/90 text-amber-100 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    {programme.book.file_type || 'PDF'}
                  </div>
                </div>
                <div className="space-y-1.5 max-w-xl">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-300/20">
                    <BookOpen className="w-3 h-3" /> Included Companion Book
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-amber-50">
                    {programme.book.title}
                  </h3>
                  <p className="text-xs text-stone-300 font-medium">
                    By {programme.book.author || 'Lead Coach Zipporah Karanja'} • {programme.book.page_count} Pages
                  </p>
                  <p className="text-xs text-stone-300/90 leading-relaxed">
                    {programme.book.description}
                  </p>
                  <p className="text-[11px] text-amber-200/90 font-medium pt-1">
                    ✨ Automatically unlocked for online reading and PDF download immediately upon acquiring this programme.
                  </p>
                </div>
              </div>

              <Link
                href={`/checkout/${service.id}`}
                className="px-6 py-3 rounded-full bg-amber-100 text-stone-950 text-xs font-semibold hover:bg-white transition shadow shrink-0"
              >
                Unlock with Programme
              </Link>
            </div>
          </section>
        )}

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

          {/* Included Materials & Resources */}
          {service.resources && service.resources.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-rose-200/60 shadow-sm space-y-4">
              <div className="text-center space-y-2">
                <h3 className="font-serif text-xl font-semibold text-stone-900">
                  Included Materials & Resources
                </h3>
                <p className="text-xs sm:text-sm text-stone-600">
                  These exclusive resources will be available for download in your portal immediately upon enrollment.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {service.resources.map((res) => (
                  <div key={res.id} className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{res.title}</p>
                      <p className="text-xs text-stone-500">{res.file_name} • {res.file_size || 'File'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Access Control Callout */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-stone-900 to-rose-950 text-white text-center space-y-4">
            <h3 className="font-serif text-2xl font-semibold">
              Purchase this programme to unlock your coaching journey.
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto">
              Access is strictly restricted to active purchasers. Complete your secure Selar checkout to immediately access all lessons, reflection prompts, and guided coaching dialogues.
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
