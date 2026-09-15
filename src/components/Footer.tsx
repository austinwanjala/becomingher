'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Feather, Heart, ExternalLink, ShieldCheck } from 'lucide-react';
import { store } from '@/lib/store';
import { BrandLogo } from '@/components/BrandLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [cms, setCms] = useState(store.cms);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d?.cms) setCms(d.cms);
      })
      .catch(console.error);
  }, []);

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo href="/" size="md" variant="dark" />
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              A private digital personal development sanctuary for women dedicated to alignment, emotional sovereignty, and stepping into their highest potential.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-amber-300/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secure Payments & Checkout Powered by Selar</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-white font-medium text-base">Coaching Services</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/services/guided-coaching" className="hover:text-amber-200 transition">
                  Guided Digital Programme
                </Link>
              </li>
              <li>
                <Link href="/services/custom-coaching" className="hover:text-amber-200 transition">
                  Customized Coaching
                </Link>
              </li>
              <li>
                <Link href="/services/interpersonal-coaching" className="hover:text-amber-200 transition">
                  1-on-1 Daytime Sessions
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-amber-200 transition">
                  Investment & Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="font-serif text-white font-medium text-base">Portal Access</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/dashboard" className="hover:text-amber-200 transition">
                  Customer Portal
                </Link>
              </li>
              <li>
                <Link href="/dashboard/coaching" className="hover:text-amber-200 transition">
                  Sanctuary Companion
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-200 transition">
                  Member Sign In
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-200 transition">
                  Admin Management
                </Link>
              </li>
              <li>
                <a
                  href={cms.contact.selar_store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-rose-300 hover:text-white transition"
                >
                  <span>Selar Official Store</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-white font-medium text-base">Sanctuary Policies</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/terms" className="hover:text-amber-200 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-200 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-amber-200 transition">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-amber-200 transition">
                  Coaching Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {currentYear} Becoming Her. All rights reserved. Founded by Zipporah Karanja.</p>
          <p className="flex items-center gap-1">
            Crafted with intention & <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for women becoming.
          </p>
        </div>
      </div>
    </footer>
  );
}
