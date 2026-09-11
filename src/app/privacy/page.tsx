import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 border-b border-stone-200 pb-4">
          Privacy & Data Protection Policy
        </h1>
        <div className="prose prose-stone text-xs sm:text-sm leading-relaxed space-y-6 text-stone-700">
          <p>
            At Becoming Her, we honor the sacred nature of your personal reflections, onboarding questionnaire responses, and transaction history.
          </p>
          <h3 className="font-serif text-lg font-semibold text-stone-900">1. Information Collection</h3>
          <p>
            We collect personal details (name, email, phone) necessary for account access, payment verification, and session scheduling. Payment processing credentials (card details, M-Pesa PINs) are processed directly by Selar and are never stored on our servers.
          </p>
          <h3 className="font-serif text-lg font-semibold text-stone-900">2. Journaling & Sanctuary Confidentiality</h3>
          <p>
            All reflection responses and coaching dialogues are securely stored and mapped exclusively to your authenticated user identifier. We never sell or share client development data with third-party advertisers.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
