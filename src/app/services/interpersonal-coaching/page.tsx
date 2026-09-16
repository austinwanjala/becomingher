import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  Video,
  CheckCircle2,
  Moon,
  ArrowRight,
  User,
  FileText
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';
import { ServiceDisclaimer } from '@/components/DisclaimerModal';
import { getServiceBySlug } from '@/lib/services';
import { notFound } from 'next/navigation';

export default async function InterpersonalCoachingPage() {
  const service = await getServiceBySlug('interpersonal-coaching');
  if (!service) return notFound();
  const coach = store.coach;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] border-b border-stone-200/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <Video className="w-3.5 h-3.5 text-rose-700" /> Private 1-on-1 Mentorship
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
                className="px-8 py-3.5 rounded-full bg-stone-900 text-amber-50 text-sm font-semibold hover:bg-rose-950 transition shadow-md flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Schedule a Session ({service.currency} {service.price.toLocaleString()})</span>
              </Link>
            </div>

            <div className="pt-4 max-w-xl mx-auto">
              <ServiceDisclaimer serviceType="interpersonal" />
            </div>
          </div>
        </section>

        {/* Coach Bio & Schedule Overview */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-3">
              <img
                src={coach.avatar_url}
                alt={coach.name}
                className="w-44 h-44 rounded-full object-cover shadow-lg border-4 border-stone-100"
              />
              <div>
                <h3 className="font-serif text-xl font-semibold text-stone-900">{coach.name}</h3>
                <p className="text-xs text-rose-800 font-medium">{coach.title}</p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-serif text-lg font-semibold text-stone-900">
                About Your Coach
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {coach.bio}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-xs text-stone-700">
                <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-rose-800" /> Available Days:
                  </span>
                  <p className="text-stone-600">{coach.available_days.join(', ')}</p>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-800" /> Session Duration:
                  </span>
                  <p className="text-stone-600">60 Minutes Video (Google Meet)</p>
                </div>
              </div>
            </div>
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

          {/* Booking Flow Policy Alert */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Session Booking Integrity & Anti-Double-Booking Protection
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                To respect both your time and coach availability, our calendar incorporates server-side reservation locks:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-stone-700">
              <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 border border-stone-100">
                <h5 className="font-semibold text-stone-900">1. Select Your Slot</h5>
                <p className="text-stone-500">Pick your preferred date and time on checkout. A 15-minute hold prevents double-booking while you pay.</p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 border border-stone-100">
                <h5 className="font-semibold text-stone-900">2. Selar Payment</h5>
                <p className="text-stone-500">Pay securely via Selar using M-Pesa or Card. Booking is confirmed only after verified transaction callback.</p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 border border-stone-100">
                <h5 className="font-semibold text-stone-900">3. Google Meet Delivery</h5>
                <p className="text-stone-500">Upon confirmation, your private Google Meet link is automatically created and shown in your dashboard.</p>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <Link
                href={`/checkout/${service.id}`}
                className="px-8 py-3.5 rounded-full bg-stone-900 text-amber-50 text-xs font-semibold hover:bg-rose-950 transition shadow"
              >
                Proceed to Slot Selection & Checkout →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
