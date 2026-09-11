import Link from 'next/link';
import { Sparkles, CheckCircle2, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';

export default function ServicesPage() {
  const services = store.getServices();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="pt-16 pb-14 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] text-center">
          <div className="max-w-4xl mx-auto px-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-rose-700" /> Coaching Catalogue
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-stone-900">
              Coaching Containers Designed for Lasting Alignment
            </h1>
            <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Explore our structured digital programmes, bespoke personal development roadmaps, and 1-on-1 private video mentorship sessions.
            </p>
          </div>
        </section>

        {/* Services List */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {services.map((service, idx) => (
            <div
              key={service.id}
              className={`bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 ${
                idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Media */}
              <div className="lg:col-span-5 relative h-72 lg:h-96 rounded-2xl overflow-hidden shadow-md">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-stone-900/90 text-amber-100 text-xs font-medium">
                  {service.duration}
                </div>
              </div>

              {/* Text info */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-rose-800 font-semibold">
                    Pathway {idx + 1}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
                    {service.name}
                  </h2>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                    Key Transformation Elements:
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                    {service.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-800 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-stone-500 block">Investment</span>
                    <span className="font-serif text-2xl font-bold text-rose-950">
                      {service.currency} {service.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/services/${service.slug}`}
                      className="px-5 py-3 rounded-xl border border-stone-300 text-stone-800 text-xs font-medium hover:bg-stone-50 transition"
                    >
                      Learn More
                    </Link>
                    <Link
                      href={`/checkout/${service.id}`}
                      className="px-6 py-3 rounded-xl bg-stone-900 text-amber-50 text-xs font-semibold hover:bg-rose-950 transition shadow"
                    >
                      Enroll via Selar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
