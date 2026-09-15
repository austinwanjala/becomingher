'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Save,
  ShieldCheck,
  CreditCard,
  Brain,
  Calendar,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Feather,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react';
import { store } from '@/lib/store';
import { BrandLogo } from '@/components/BrandLogo';
import { createClient } from '@/utils/supabase/client';

export default function AdminSettingsPage() {
  const [businessName, setBusinessName] = useState(store.brand.name || 'Becoming Her');
  const [tagline, setTagline] = useState(store.brand.tagline || 'Digital Sanctuary');
  const [currency, setCurrency] = useState('KES');
  const [supportEmail, setSupportEmail] = useState('hello@becomingher.co.ke');
  const [phone, setPhone] = useState('+254 720 120 227');
  const [selarStoreUrl, setSelarStoreUrl] = useState('https://selar.com/m/zipporah-karanja1-Selar');
  const [defaultSelarProduct, setDefaultSelarProduct] = useState('v09683c927');
  const [holdMinutes, setHoldMinutes] = useState(15);
  const [aiTone, setAiTone] = useState('Empowering, warm, sovereign, question-driven');
  const [saved, setSaved] = useState(false);

  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string>(store.brand.logo_url || '');
  const [darkLogoUrl, setDarkLogoUrl] = useState<string>(store.brand.logo_dark_url || '');
  const [logoHeight, setLogoHeight] = useState<number>(store.brand.logo_height_px || 40);
  const [logoNotification, setLogoNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const darkFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // 1. Local fallback
    const cachedLogo = localStorage.getItem('becoming_her_brand_logo');
    const cachedDarkLogo = localStorage.getItem('becoming_her_brand_dark_logo');
    const cachedName = localStorage.getItem('becoming_her_brand_name');
    if (cachedLogo) setLogoUrl(cachedLogo);
    if (cachedDarkLogo) setDarkLogoUrl(cachedDarkLogo);
    if (cachedName) setBusinessName(cachedName);

    // 2. Fetch from DB
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data?.brand) {
            if (data.brand.logo_url) setLogoUrl(data.brand.logo_url);
            if (data.brand.logo_dark_url) setDarkLogoUrl(data.brand.logo_dark_url);
            if (data.brand.name) setBusinessName(data.brand.name);
            if (data.brand.tagline) setTagline(data.brand.tagline);
            if (data.brand.logo_height_px) setLogoHeight(data.brand.logo_height_px);
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoFile = async (file: File, isDark = false) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, SVG, JPG, WebP).');
      return;
    }

    setIsUploading(true);
    setLogoNotification('Uploading logo to secure storage...');
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `brand/${fileName}`;

      const { error } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      const dataUrl = publicUrlData.publicUrl;

      if (isDark) {
        setDarkLogoUrl(dataUrl);
        localStorage.setItem('becoming_her_brand_dark_logo', dataUrl);
        setLogoNotification('Dark-mode variant logo uploaded! Click Save below.');
      } else {
        setLogoUrl(dataUrl);
        localStorage.setItem('becoming_her_brand_logo', dataUrl);
        setLogoNotification('Primary brand logo uploaded! Click Save below.');
      }
    } catch (err: any) {
      console.error('Logo upload failed:', err);
      setLogoNotification('Error uploading logo: ' + err.message);
    } finally {
      setIsUploading(false);
      setTimeout(() => setLogoNotification(null), 4000);
    }
  };

  const handleRemoveLogo = (isDark = false) => {
    if (isDark) {
      setDarkLogoUrl('');
      localStorage.removeItem('becoming_her_brand_dark_logo');
      setLogoNotification('Dark logo removed. Fallback logo will be used.');
    } else {
      setLogoUrl('');
      localStorage.removeItem('becoming_her_brand_logo');
      setLogoNotification('Brand logo reset to the default Becoming Her sacred monogram.');
    }

    window.dispatchEvent(
      new CustomEvent('becoming_her_brand_updated', {
        detail: {
          logo_url: isDark ? logoUrl : '',
          logo_dark_url: isDark ? '' : darkLogoUrl,
          name: businessName
        }
      })
    );
    setTimeout(() => setLogoNotification(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogoNotification('Saving settings to database...');

    const brandData = {
      name: businessName,
      tagline,
      logo_url: logoUrl,
      logo_dark_url: darkLogoUrl,
      logo_height_px: logoHeight
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: brandData })
      });
      if (!res.ok) throw new Error('Failed to save settings');
    } catch (err) {
      console.error('Failed to save settings to DB:', err);
    }

    localStorage.setItem('becoming_her_brand_logo', logoUrl);
    localStorage.setItem('becoming_her_brand_dark_logo', darkLogoUrl);
    localStorage.setItem('becoming_her_brand_name', businessName);

    // Dispatch global event for instant reactive update in Navbar/Footer/Admin
    window.dispatchEvent(
      new CustomEvent('becoming_her_brand_updated', {
        detail: brandData
      })
    );

    setSaved(true);
    setLogoNotification('✓ All platform settings and brand logo saved & applied live across the entire website!');
    setTimeout(() => {
      setSaved(false);
      setLogoNotification(null);
    }, 4000);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-900 bg-rose-100/70 px-2.5 py-0.5 rounded-full">
          Platform Configuration
        </span>
        <h1 className="font-serif text-3xl font-semibold text-stone-900 mt-1">
          Global Platform & Brand Settings
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Upload your brand logo, customize business metadata, and configure Selar checkout parameters.
        </p>
      </div>

      {logoNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{logoNotification}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 text-xs text-stone-700">
        {/* ========================================================================= */}
        {/* BRAND LOGO & VISUAL IDENTITY SECTION                                      */}
        {/* ========================================================================= */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="space-y-0.5">
              <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-800" />
                <span>Website Brand Logo</span>
              </h3>
              <p className="text-xs text-stone-500">
                Upload your official brand logo. It will be displayed in the Navbar header, footer, authentication screens, and administrative sidebar.
              </p>
            </div>
            {logoUrl ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                <CheckCircle2 className="w-3 h-3" /> Custom Logo Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 self-start sm:self-auto">
                <Feather className="w-3 h-3 text-rose-800" /> Default Sacred Monogram Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Upload Area */}
            <div className="space-y-3">
              <label className="font-semibold text-stone-900 block">
                Upload Primary Logo (Light Backgrounds)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files?.[0]) {
                    handleLogoFile(e.dataTransfer.files[0], false);
                  }
                }}
                className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-stone-50/60 p-6 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group hover:bg-rose-50/40"
              >
                <div className="w-11 h-11 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-900 group-hover:scale-105 transition shadow-sm">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-900">
                    Click to browse or drop logo file here
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    PNG, SVG, WebP, or JPG (Transparent background recommended)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.svg,.png,.webp,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleLogoFile(e.target.files[0], false);
                    }
                  }}
                />
              </div>

              {/* Direct URL Input */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-medium text-stone-600">
                  Or paste external logo image URL:
                </label>
                <input
                  type="url"
                  placeholder="https://.../logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-900/20"
                />
              </div>
            </div>

            {/* Live Dual Preview */}
            <div className="space-y-3">
              <label className="font-semibold text-stone-900 flex items-center justify-between">
                <span>Live Logo Preview</span>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLogo(false)}
                    className="text-[11px] font-medium text-rose-700 hover:text-rose-900 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Reset to Monogram
                  </button>
                )}
              </label>

              {/* Light Mode Preview Box */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 shadow-xs space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
                  On Light Background (Navbar & Checkout)
                </span>
                <div className="h-16 flex items-center justify-center p-2 bg-white/80 rounded-xl border border-stone-100">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Brand Logo Preview"
                      style={{ maxHeight: `${logoHeight}px` }}
                      className="w-auto object-contain max-w-[220px]"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-950 via-rose-800 to-amber-700 flex items-center justify-center text-white shadow-sm">
                        <Feather className="w-4 h-4 text-amber-200" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-serif text-lg font-semibold text-stone-900 leading-none">
                          {businessName}
                        </span>
                        <span className="text-[9px] tracking-widest uppercase text-stone-500 font-sans">
                          {tagline}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dark Mode Preview Box */}
              <div className="p-4 rounded-2xl bg-stone-900 text-white border border-stone-800 shadow-xs space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">
                  On Dark Background (Footer & Admin Sidebar)
                </span>
                <div className="h-16 flex items-center justify-center p-2 bg-stone-950/60 rounded-xl border border-stone-800">
                  {darkLogoUrl || logoUrl ? (
                    <img
                      src={darkLogoUrl || logoUrl}
                      alt="Dark Logo Preview"
                      style={{ maxHeight: `${logoHeight}px` }}
                      className="w-auto object-contain max-w-[220px]"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-rose-950 flex items-center justify-center text-white border border-rose-800/50">
                        <Feather className="w-4 h-4 text-amber-200" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-serif text-lg font-semibold text-white leading-none">
                          {businessName}
                        </span>
                        <span className="text-[9px] tracking-widest uppercase text-stone-400 font-sans">
                          {tagline}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SANCTUARY IDENTITY & BUSINESS DETAILS                                     */}
        {/* ========================================================================= */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-semibold text-stone-900 border-b border-stone-100 pb-3">
            Sanctuary Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium">Business / Brand Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium">Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Digital Sanctuary"
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
            <div className="space-y-1.5 sm:col-span-2">
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

        {/* ========================================================================= */}
        {/* SELAR PAYMENT GATEWAY PARAMETERS                                          */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* AI COACHING CONFIGURATION                                                 */}
        {/* ========================================================================= */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Brain className="w-4 h-4 text-rose-800" />
            <span>Sanctuary Companion Principles</span>
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

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-emerald-600 font-medium">
            {saved && '✓ All settings & brand logo successfully updated!'}
          </span>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings & Apply Logo</span>
          </button>
        </div>
      </form>
    </div>
  );
}
