import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 border-b border-stone-200 pb-4">
          Refund & Cancellation Policy
        </h1>
        <div className="prose prose-stone text-xs sm:text-sm leading-relaxed space-y-6 text-stone-700">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Digital Programmes</h3>
          <p>
            Due to the immediate digital delivery and full access to proprietary curriculum materials, guided and customized programmes are generally non-refundable once unlocked. If you experience technical access challenges, our team will resolve your access promptly.
          </p>
          <h3 className="font-serif text-lg font-semibold text-stone-900">1-on-1 Coaching Rescheduling & Cancellations</h3>
          <p>
            Interpersonal coaching sessions may be rescheduled up to 24 hours prior to the booked time slot. Cancellations requested less than 24 hours in advance or no-shows are subject to full forfeiture of the session fee.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
