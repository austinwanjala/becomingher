'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, ExternalLink, Send, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';

export default function ContactPage() {
  const cms = store.cms;
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-grow">
        <section className="py-16 bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] text-center border-b border-stone-200/60">
          <div className="max-w-4xl mx-auto px-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-950 text-xs font-semibold">
              <Mail className="w-3.5 h-3.5 text-rose-700" /> Sacred Connections
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-stone-900">
              Get in Touch with Becoming Her
            </h1>
            <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Have questions about which coaching container fits your current season? We are here to guide you with warmth and clarity.
            </p>
          </div>
        </section>

        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <h3 className="font-serif text-2xl font-semibold text-stone-900">
                  Our Sanctuary Headquarters
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Based in Nairobi, Kenya and serving women globally across East Africa, the UK, Europe, and North America.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-stone-700">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-900 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Direct Email</span>
                    <a href={`mailto:${cms.contact.email}`} className="font-medium hover:text-rose-900">
                      {cms.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-900 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Telephone & WhatsApp</span>
                    <a href={`tel:${cms.contact.phone}`} className="font-medium hover:text-rose-900">
                      {cms.contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-900 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Location</span>
                    <span className="font-medium">{cms.contact.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-900 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Official Storefront</span>
                    <a
                      href={cms.contact.selar_store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-rose-800 hover:underline"
                    >
                      Selar.com/m/zipporah-karanja1-Selar
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-sm">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-stone-900">Message Received</h3>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                    Thank you for reaching out, beloved. Coach Zipporah or our sanctuary care team will reply within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2 rounded-xl bg-stone-100 text-stone-800 text-xs font-medium hover:bg-stone-200 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-semibold text-stone-900">Send an Inquiry</h3>
                    <p className="text-xs text-stone-500">We respond with deep attention and care.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">Message or Inquiry</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share what you are navigating or asking about..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center justify-center gap-2 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Deliver Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
