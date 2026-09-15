import { Heart, HelpCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';

export default function FAQPage() {
  const faqs = store.faqs;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        <section className="py-16 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] text-center border-b border-stone-200/60">
          <div className="max-w-4xl mx-auto px-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-rose-700" /> Information & Clarity
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-stone-900">
              Frequently Asked Questions
            </h1>
            <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Clear answers regarding payments on Selar, programme access, digital coaching companions, and 1-on-1 mentorship.
            </p>
          </div>
        </section>

        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  {faq.question}
                </h3>
                <span className="text-[10px] font-medium text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  {faq.category}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans pt-1">
                {faq.answer}
              </p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
