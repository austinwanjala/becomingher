import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Compass,
  HeartHandshake,
  Star,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';

export default function HomePage() {
  const cms = store.cms;
  const services = store.getServices();
  const testimonials = store.testimonials.filter((t) => t.is_published);
  const faqs = store.faqs.filter((f) => f.is_published);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-rose-100 selection:text-rose-950">
      <Navbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-[#F7F3EE] via-[#FAF8F5] to-[#FAF8F5]">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column Text */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/70 border border-rose-200/80 text-rose-950 text-xs font-semibold tracking-wide shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                  <span>{cms.hero.badge}</span>
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-stone-900 font-semibold tracking-tight leading-[1.15]">
                  Become the woman <br className="hidden sm:inline" />
                  <span className="italic font-serif font-normal text-rose-950 underline decoration-amber-300/70 decoration-wavy decoration-2">
                    you are becoming.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans font-normal">
                  {cms.hero.subheading}
                </p>

                {/* CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    href={cms.hero.cta_primary_link}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-stone-900 text-amber-50 font-medium hover:bg-rose-950 hover:shadow-lg transition flex items-center justify-center gap-2 group"
                  >
                    <span>{cms.hero.cta_primary_text}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </Link>

                  <Link
                    href={cms.hero.cta_secondary_link}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-stone-300 bg-white/80 text-stone-800 font-medium hover:bg-white hover:border-stone-400 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Calendar className="w-4 h-4 text-rose-800" />
                    <span>{cms.hero.cta_secondary_text}</span>
                  </Link>
                </div>

                {/* Trust Signals */}
                <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Selar Verified Payment</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-700" />
                    <span>Instant Entitlement Unlock</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Guided Reflection Sanctuary</span>
                  </div>
                </div>
              </div>

              {/* Right Column Visual / Imagery */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src={cms.hero.image_url}
                    alt="Becoming Her Coaching"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                  
                  {/* Floating badge */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/40 shadow-lg text-stone-900">
                    <p className="text-xs font-serif italic text-rose-950 font-medium">
                      "She remembered who she was, and the game changed."
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-stone-600">
                      <span className="font-semibold text-stone-900">Lead Coach: Zipporah Karanja</span>
                      <span className="text-rose-800 font-medium">Nairobi, Kenya</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SERVICES SHOWCASE */}
        <section id="services" className="py-20 bg-white border-y border-stone-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs uppercase tracking-widest text-rose-800 font-semibold">
                Sacred Offerings
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-semibold tracking-tight">
                Curated Pathways to Your Highest Self
              </h2>
              <p className="text-stone-600 text-base">
                Whether you thrive in structured digital curricula, crave personalized daily accountability, or require 1-on-1 executive mentorship, our containers are crafted for profound transformation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col bg-[#FAF8F5] rounded-2xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl transition duration-300 group"
                >
                  {/* Service Image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/95 text-stone-900 text-xs font-semibold shadow">
                      {service.currency} {service.price.toLocaleString()}
                    </div>
                    {service.is_featured && (
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-rose-900 text-amber-200 text-[10px] font-semibold uppercase tracking-wider">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-rose-800 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{service.duration}</span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-stone-900">
                        {service.name}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                        {service.short_description}
                      </p>

                      {/* Features list preview */}
                      <ul className="pt-2 space-y-2 text-xs text-stone-700">
                        {service.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-800 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-stone-200/80 flex flex-col gap-2">
                      <Link
                        href={`/checkout/${service.id}`}
                        className="w-full py-3 rounded-xl bg-stone-900 text-amber-50 text-xs font-semibold text-center hover:bg-rose-950 transition shadow"
                      >
                        {service.type === 'INTERPERSONAL_SESSION' ? 'Schedule & Reserve Slot' : 'Enroll via Selar Checkout'}
                      </Link>
                      <Link
                        href={`/services/${service.slug}`}
                        className="w-full py-2 text-center text-xs font-medium text-stone-600 hover:text-stone-950 transition"
                      >
                        View Full Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="py-20 bg-[#F7F3EE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs uppercase tracking-widest text-rose-800 font-semibold">
                Seamless Experience
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-semibold tracking-tight">
                How Your Journey Unfolds
              </h2>
              <p className="text-stone-600 text-sm">
                From exploration to certified transformation in four deliberate, secure steps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  title: 'Choose Your Experience',
                  desc: 'Select from our Guided Digital Programme, Personalized Coaching Journey, or 1-on-1 Live Mentorship with Zipporah.'
                },
                {
                  step: '02',
                  title: 'Secure Selar Payment',
                  desc: 'Checkout smoothly through Selar using M-Pesa, Visa, Mastercard, or Apple Pay with instant encrypted verification.'
                },
                {
                  step: '03',
                  title: 'Instant Entitlement Unlock',
                  desc: 'Our server confirms your payment in real-time, unlocking all modules, interactive reflection tools, or Google Meet links.'
                },
                {
                  step: '04',
                  title: 'Reflect, Grow & Become',
                  desc: 'Track your personal goals, complete guided reflection prompts, and deepen your journey with your private growth companion.'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative space-y-3"
                >
                  <span className="font-serif text-3xl text-rose-900/30 font-bold">
                    {item.step}
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. WHY BECOMING HER */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs uppercase tracking-widest text-rose-800 font-semibold">
                  Why Becoming Her
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-semibold tracking-tight leading-snug">
                  Coaching Built for the Depth, Ambition, and Complexity of Women
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Most online courses give you passive videos you forget within days. Becoming Her is an active, living ecosystem combining emotional introspection, structured frameworks, and continuous accountability.
                </p>

                <div className="space-y-4 pt-2">
                  {[
                    {
                      title: 'Rooted in Approved Frameworks',
                      desc: 'Our proprietary 4-Stage Transformation Cycle bridges the gap between inner unlearning and outer embodiment.'
                    },
                    {
                      title: 'Continuous Guided Growth Companion',
                      desc: 'An intuitive digital companion that remembers your goals, checks in on your reflections, and supports your sovereign expansion.'
                    },
                    {
                      title: 'High-Touch Intimate Support',
                      desc: 'Direct access to certified mentorship and calendar scheduling that prevents double-booking.'
                    }
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-serif font-semibold text-stone-900 text-base">{feat.title}</h4>
                        <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 bg-stone-100 rounded-3xl p-8 border border-stone-200 relative">
                <div className="space-y-6">
                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-200/80 space-y-2">
                    <p className="text-xs text-rose-800 font-semibold uppercase tracking-wider">
                      Module 1 Reflection Question
                    </p>
                    <p className="font-serif text-base text-stone-900 italic">
                      "What belief about yourself have you outgrown, yet still find yourself subconsciously carrying?"
                    </p>
                    <p className="text-xs text-stone-500 pt-2 border-t border-stone-100">
                      Answered by Grace M. • Saved to Personal Transformation Portfolio
                    </p>
                  </div>

                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-rose-950 text-amber-200 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-stone-900">Sanctuary Reflection Companion</span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      "I noticed in your goal review that you are holding back on leading the team presentation out of fear of being perceived as 'too loud.' Remember: sovereignty does not shrink so others feel comfortable. How can we reframe your voice as an act of service rather than imposition?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. TESTIMONIALS */}
        <section className="py-20 bg-[#FAF8F5] border-t border-stone-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs uppercase tracking-widest text-rose-800 font-semibold">
                Voices of Sisterhood
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-semibold tracking-tight">
                Transformations from Women Becoming
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-7 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex text-amber-500">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed font-serif">
                      "{item.quote}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                    <img
                      src={item.avatar_url}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-stone-900">{item.name}</h4>
                      <p className="text-[11px] text-stone-500">{item.role}</p>
                      <p className="text-[10px] text-rose-800 font-medium">{item.programme_name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. FAQ SECTION */}
        <section className="py-20 bg-white border-t border-stone-200/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-14">
              <span className="text-xs uppercase tracking-widest text-rose-800 font-semibold">
                Clarity & Assurance
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-semibold tracking-tight">
                Frequently Asked Inquiries
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2"
                >
                  <h3 className="font-serif text-base font-semibold text-stone-900 flex items-center justify-between">
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans pt-1">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="py-20 bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white relative overflow-hidden text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-900/60 border border-rose-700/60 text-amber-200 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Your Sovereign Next Step
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
              Ready to meet the woman <br className="hidden sm:inline" />
              you are becoming?
            </h2>

            <p className="text-sm sm:text-base text-stone-300 max-w-xl mx-auto leading-relaxed">
              Step into our digital sanctuary today. Choose your coaching pathway, complete secure checkout via Selar, and unlock immediate access to your transformation.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/services"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-stone-950 font-medium hover:bg-amber-50 transition shadow-lg text-sm"
              >
                Enroll in a Programme
              </Link>
              <Link
                href="/services/interpersonal-coaching"
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-stone-600 bg-stone-900/60 text-white font-medium hover:bg-stone-800 transition text-sm"
              >
                Book 1-on-1 Session
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
