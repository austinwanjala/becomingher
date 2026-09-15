import Link from 'next/link';
import { Gem, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';

export default function PricingPage() {
  const services = store.getServices();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        <section className="py-16 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] text-center border-b border-stone-200/60">
          <div className="max-w-4xl mx-auto px-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <Tag className="w-3.5 h-3.5 text-rose-700" /> Sacred Investment
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-stone-900">
              Honest, Transparent Pricing
            </h1>
            <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Invest in your lasting sovereignty and expansion. No hidden renewals, no recurring surprise fees.
            </p>
          </div>
        </section>

        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div
                key={service.id}
                className={`bg-white rounded-3xl border ${
                  idx === 1 ? 'border-rose-900 shadow-xl ring-2 ring-rose-900/20' : 'border-stone-200 shadow-sm'
                } p-8 flex flex-col justify-between space-y-8 relative`}
              >
                {idx === 1 && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-rose-900 text-amber-100 text-[10px] font-bold uppercase tracking-wider shadow">
                    Most Popular Pathway
                  </div>
                )}

                <div className="space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                    {service.duration}
                  </span>
                  <h3 className="font-serif text-2xl font-semibold text-stone-900">
                    {service.name}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {service.short_description}
                  </p>

                  <div className="pt-2">
                    <span className="font-serif text-3xl font-bold text-rose-950">
                      {service.currency} {service.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-stone-500 block mt-0.5">One-time payment via Selar</span>
                  </div>

                  <div className="pt-4 border-t border-stone-100 space-y-2.5">
                    <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider block">
                      Everything Included:
                    </span>
                    <ul className="space-y-2 text-xs text-stone-700">
                      {service.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-rose-800 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <Link
                    href={`/checkout/${service.id}`}
                    className={`w-full py-3.5 rounded-xl text-center text-xs font-semibold block transition shadow ${
                      idx === 1
                        ? 'bg-rose-950 text-amber-50 hover:bg-stone-900'
                        : 'bg-stone-900 text-white hover:bg-rose-950'
                    }`}
                  >
                    Select & Enroll via Selar
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Banner */}
          <div className="mt-12 p-6 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <h4 className="font-serif font-semibold text-stone-900 text-base flex items-center justify-center sm:justify-start gap-2">
                <Tag className="w-4 h-4 text-rose-800" /> Have a Launch Discount Code?
              </h4>
              <p className="text-xs text-stone-600">
                Enter code <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-rose-900">BECOMINGHER10</code> on checkout for an immediate 10% courtesy discount.
              </p>
            </div>
            <Link
              href="/services"
              className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition"
            >
              Browse Catalog →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
