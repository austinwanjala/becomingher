'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, X, ExternalLink, ShieldCheck, HeartHandshake } from 'lucide-react';
import { OFFICIAL_DISCLAIMER_PARAGRAPHS } from '@/lib/disclaimer';

interface DisclaimerModalProps {
  triggerText?: string;
  className?: string;
}

export function DisclaimerModal({
  triggerText = 'Read full disclaimer',
  className = 'text-xs text-rose-900 underline hover:text-stone-950 font-medium inline-flex items-center gap-1 cursor-pointer transition'
}: DisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <span>{triggerText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#FAF8F5] border border-stone-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disclaimer-title"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-200/80 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="disclaimer-title" className="font-serif text-lg font-semibold text-stone-900">
                    Official Becoming Her Disclaimer
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Coaching & Personal Development Guardrails
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition"
                aria-label="Close disclaimer modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-medium text-xs flex items-start gap-2.5 mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <span>
                  Becoming Her is a personal development and coaching programme. It is <strong>NOT therapy or counselling</strong>.
                </span>
              </div>

              {OFFICIAL_DISCLAIMER_PARAGRAPHS.map((paragraph, idx) => (
                <p key={idx} className="text-stone-700">
                  {paragraph}
                </p>
              ))}

              <div className="pt-4 border-t border-stone-200/70 space-y-2 text-xs">
                <h4 className="font-semibold text-stone-900">Crisis & Emergency Helplines (Immediate Support):</h4>
                <p className="text-stone-600">
                  If you are in acute distress or crisis, please seek immediate assistance from local services:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-xl border border-stone-200">
                  <div><strong>Kenya Emergency Helpline:</strong> 999 / 112</div>
                  <div><strong>Kenya Red Cross Toll-free:</strong> 1199 (24/7)</div>
                  <div><strong>Befrienders Kenya:</strong> +254 722 178 177</div>
                  <div><strong>International:</strong> Contact your local emergency room</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/disclaimer"
                target="_blank"
                className="text-xs text-rose-900 hover:text-stone-900 underline flex items-center gap-1"
              >
                <span>Open dedicated disclaimer page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto px-6 py-2 rounded-xl bg-stone-900 text-amber-50 text-xs font-semibold hover:bg-rose-950 transition shadow"
              >
                I Understand & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ServiceDisclaimerProps {
  serviceType: 'guided' | 'custom' | 'interpersonal';
  className?: string;
}

export function ServiceDisclaimer({ serviceType, className = '' }: ServiceDisclaimerProps) {
  const notices = {
    guided: "Coaching & personal development only — not therapy or counselling.",
    custom: "Personalized coaching and personal development — not therapy, counselling, or psychological treatment.",
    interpersonal: "This is a coaching and personal-development session, not therapy or counselling."
  };

  const text = notices[serviceType];

  return (
    <div className={`p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs ${className}`}>
      <div className="flex items-center gap-2">
        <HeartHandshake className="w-3.5 h-3.5 text-amber-800 shrink-0" />
        <span className="font-medium text-stone-800">{text}</span>
      </div>
      <DisclaimerModal triggerText="Read full disclaimer" />
    </div>
  );
}
