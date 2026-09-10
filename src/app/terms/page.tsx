import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 border-b border-stone-200 pb-4">
          Terms & Conditions of Service
        </h1>
        <div className="prose prose-stone text-xs sm:text-sm leading-relaxed space-y-6 text-stone-700">
          <p>
            Welcome to Becoming Her. By accessing our platform, purchasing any digital coaching service, or booking an interpersonal coaching session, you agree to comply with and be bound by the following terms and conditions.
          </p>
          <h3 className="font-serif text-lg font-semibold text-stone-900">1. Service Nature & E-Commerce Model</h3>
          <p>
            Becoming Her operates as a service-based e-commerce platform. All purchases are facilitated securely via Selar. Entitlements to digital programmes and confirmed bookings are granted only upon verified server-side transaction confirmation.
          </p>
          <h3 className="font-serif text-lg font-semibold text-stone-900">2. Intellectual Property</h3>
          <p>
            All programme content, audio lessons, exercises, reflection prompts, and proprietary frameworks belong exclusively to Becoming Her and Founder Zipporah Karanja. Content may not be redistributed, copied, or resold without explicit written authorization.
          </p>
          <h3 className="font-serif text-lg font-semibold text-stone-900">3. Interpersonal Coaching & Meeting Links</h3>
          <p>
            Private 1-on-1 coaching sessions are conducted over video conferencing (Google Meet). Links are only accessible to confirmed, paid bookings. Clients are responsible for ensuring punctuality.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
