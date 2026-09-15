'use client';

import { useState } from 'react';
import {
  Globe,
  Save,
  Check,
  Plus,
  Trash2,
  Gem,
  HelpCircle,
  Star,
  ExternalLink
} from 'lucide-react';
import { store } from '@/lib/store';
import { Testimonial, FAQItem } from '@/types';

export default function AdminCMSPage() {
  const [cms, setCms] = useState(store.cms);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(store.testimonials);
  const [faqs, setFaqs] = useState<FAQItem[]>(store.faqs);

  const [activeTab, setActiveTab] = useState<'hero' | 'about' | 'contact' | 'testimonials' | 'faq'>('hero');
  const [savedMessage, setSavedMessage] = useState('');

  // Save changes handler
  const handleSaveCMS = (e: React.FormEvent) => {
    e.preventDefault();
    store.cms = cms;
    store.addAuditLog('CMS_UPDATED', 'WEBSITE_CONTENT', `CMS sections updated (${activeTab})`);
    setSavedMessage('✓ Website content updated and live!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  // Add testimonial
  const handleAddTestimonial = () => {
    const newTest: Testimonial = {
      id: `test-${Date.now()}`,
      name: 'New Client Testimonial',
      role: 'Professional / Entrepreneur',
      quote: 'Becoming Her transformed my perspective and allowed me to step into true emotional clarity.',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      programme_name: 'Guided Digital Coaching Programme',
      rating: 5,
      is_published: true
    };
    const updated = [newTest, ...testimonials];
    setTestimonials(updated);
    store.testimonials = updated;
  };

  // Add FAQ
  const handleAddFAQ = () => {
    const newFaq: FAQItem = {
      id: `faq-${Date.now()}`,
      question: 'New Frequently Asked Question',
      answer: 'Clear, compassionate explanation for clients.',
      category: 'General',
      order: faqs.length + 1,
      is_published: true
    };
    const updated = [...faqs, newFaq];
    setFaqs(updated);
    store.faqs = updated;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Frontend Website CMS Editor
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Update public landing pages, hero copy, mission statements, testimonials, and FAQs live without altering code.
          </p>
        </div>

        {savedMessage && (
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            {savedMessage}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-2 text-xs font-medium">
        {[
          { id: 'hero', label: 'Homepage Hero & Banner' },
          { id: 'about', label: 'About Story & Mission' },
          { id: 'contact', label: 'Contact & Store Links' },
          { id: 'testimonials', label: 'Client Testimonials' },
          { id: 'faq', label: 'Frequently Asked Questions' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Tab */}
      {activeTab === 'hero' && (
        <form onSubmit={handleSaveCMS} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Top Header Badge</label>
            <input
              type="text"
              value={cms.hero.badge}
              onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, badge: e.target.value } })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Hero Main Heading</label>
            <input
              type="text"
              value={cms.hero.heading}
              onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, heading: e.target.value } })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-serif text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Hero Subheading & Description</label>
            <textarea
              rows={3}
              value={cms.hero.subheading}
              onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, subheading: e.target.value } })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Primary CTA Text</label>
              <input
                type="text"
                value={cms.hero.cta_primary_text}
                onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, cta_primary_text: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Primary CTA Destination Link</label>
              <input
                type="text"
                value={cms.hero.cta_primary_link}
                onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, cta_primary_link: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Hero Feature Image URL</label>
            <input
              type="url"
              value={cms.hero.image_url}
              onChange={(e) => setCms({ ...cms, hero: { ...cms.hero, image_url: e.target.value } })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px]"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Publish Hero Updates</span>
          </button>
        </form>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <form onSubmit={handleSaveCMS} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">About Page Headline</label>
            <input
              type="text"
              value={cms.about.heading}
              onChange={(e) => setCms({ ...cms, about: { ...cms.about, heading: e.target.value } })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-serif"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Our Story</label>
            <textarea
              rows={3}
              value={cms.about.story}
              onChange={(e) => setCms({ ...cms, about: { ...cms.about, story: e.target.value } })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Core Mission</label>
            <textarea
              rows={2}
              value={cms.about.mission}
              onChange={(e) => setCms({ ...cms, about: { ...cms.about, mission: e.target.value } })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-stone-700">Vision</label>
            <textarea
              rows={2}
              value={cms.about.vision}
              onChange={(e) => setCms({ ...cms, about: { ...cms.about, vision: e.target.value } })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Publish About Updates</span>
          </button>
        </form>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <form onSubmit={handleSaveCMS} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Contact Email</label>
              <input
                type="email"
                value={cms.contact.email}
                onChange={(e) => setCms({ ...cms, contact: { ...cms.contact, email: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Phone / WhatsApp</label>
              <input
                type="text"
                value={cms.contact.phone}
                onChange={(e) => setCms({ ...cms, contact: { ...cms.contact, phone: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Headquarters Address</label>
              <input
                type="text"
                value={cms.contact.address}
                onChange={(e) => setCms({ ...cms, contact: { ...cms.contact, address: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Selar Official Store URL</label>
              <input
                type="url"
                value={cms.contact.selar_store_url}
                onChange={(e) => setCms({ ...cms, contact: { ...cms.contact, selar_store_url: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Publish Contact Details</span>
          </button>
        </form>
      )}

      {/* Testimonials Tab */}
      {activeTab === 'testimonials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-lg font-semibold text-stone-900">Client Voices & Testimonials</h3>
            <button
              onClick={handleAddTestimonial}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Testimonial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((test) => (
              <div key={test.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-stone-900">{test.name}</h4>
                    <p className="text-stone-500 text-[11px]">{test.role}</p>
                  </div>
                  <span className="text-[10px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded font-medium">
                    {test.programme_name}
                  </span>
                </div>
                <p className="text-stone-600 italic leading-relaxed">"{test.quote}"</p>
                <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-[11px]">
                  <span className="text-amber-500 font-bold">★★★★★</span>
                  <button
                    onClick={() => {
                      const updated = testimonials.filter((t) => t.id !== test.id);
                      setTestimonials(updated);
                      store.testimonials = updated;
                    }}
                    className="text-stone-400 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-lg font-semibold text-stone-900">FAQ Directory</h3>
            <button
              onClick={handleAddFAQ}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add FAQ
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-serif text-sm font-semibold text-stone-900">{faq.question}</h4>
                  <button
                    onClick={() => {
                      const updated = faqs.filter((f) => f.id !== faq.id);
                      setFaqs(updated);
                      store.faqs = updated;
                    }}
                    className="text-stone-400 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-stone-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
