'use client';

import { useState } from 'react';
import { Settings, Save, ShieldCheck, CreditCard, Brain, Calendar } from 'lucide-react';
import { store } from '@/lib/store';

export default function AdminSettingsPage() {
  const [businessName, setBusinessName] = useState('Becoming Her');
  const [currency, setCurrency] = useState('KES');
  const [supportEmail, setSupportEmail] = useState('hello@becomingher.co.ke');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [selarStoreUrl, setSelarStoreUrl] = useState('https://selar.com/m/zipporah-karanja1-Selar');
  const [defaultSelarProduct, setDefaultSelarProduct] = useState('v09683c927');
  const [holdMinutes, setHoldMinutes] = useState(15);
  const [aiTone, setAiTone] = useState('Empowering, warm, sovereign, question-driven');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    store.addAuditLog('SETTINGS_UPDATED', 'SETTINGS', 'Platform settings updated by Super Admin');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          Global Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Configure business metadata, Selar e-commerce parameters, and AI model guidelines.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs text-stone-700">
        {/* Business & Brand */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-semibold text-stone-900 border-b border-stone-100 pb-3">
            Sanctuary Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium">Operating Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium">Official Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>
        </div>

        {/* Selar Payment Gateway Parameters */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-800" />
              <span>Selar Integration Parameters</span>
            </h3>
            <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
              Active Provider
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-medium">Selar Storefront URL</label>
              <input
                type="url"
                value={selarStoreUrl}
                onChange={(e) => setSelarStoreUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium">Default Selar Product Code</label>
              <input
                type="text"
                value={defaultSelarProduct}
                onChange={(e) => setDefaultSelarProduct(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium">Booking Temporary Hold Window (Minutes)</label>
              <input
                type="number"
                value={holdMinutes}
                onChange={(e) => setHoldMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>
        </div>

        {/* AI Coaching Configuration */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Brain className="w-4 h-4 text-rose-800" />
            <span>AI Digital Coach Principles</span>
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-medium">Tone & Voice Guidelines</label>
              <input
                type="text"
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-emerald-600 font-medium">
            {saved && '✓ Settings successfully updated!'}
          </span>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
