import Link from 'next/link';
import { Sparkles, Heart, Compass, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';

export default function AboutPage() {
  const cms = store.cms;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        <section className="py-16 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] text-center border-b border-stone-200/60">
          <div className="max-w-4xl mx-auto px-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-rose-700" /> Sacred Story & Mission
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-stone-900">
              {cms.about.heading}
            </h1>
            <p className="text-stone-600 text-base max-w-2xl mx-auto leading-relaxed">
              {cms.about.story}
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">Our Mission</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {cms.about.mission}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">Our Vision</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {cms.about.vision}
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mt-16 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-3xl font-semibold text-stone-900">Core Pillars of Becoming Her</h2>
              <p className="text-xs sm:text-sm text-stone-600">The foundational values governing every programme and interaction.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cms.about.values.map((val, idx) => (
                <div key={idx} className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-sm space-y-2">
                  <h4 className="font-serif font-semibold text-lg text-rose-950">{val.title}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
