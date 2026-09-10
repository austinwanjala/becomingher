'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Do not render floating button on the admin portal to keep admin UI clean
  const isAdmin = pathname.startsWith('/admin');

  // Automatically show a subtle prompt after 5 seconds on initial visit
  useEffect(() => {
    if (isAdmin) return;
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setIsOpen(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isAdmin, hasInteracted]);

  if (isAdmin) return null;

  // WhatsApp number configured for Becoming Her (international format without +)
  const phoneNumber = '254712345678';

  const handleOpenWhatsApp = (customText?: string) => {
    const text = customText || "Hello Becoming Her! 🌸 I'm interested in exploring your coaching programmes.";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      {/* Expanded Chat Popover */}
      {isOpen && (
        <div className="mb-3 w-[340px] sm:w-[360px] rounded-3xl bg-white shadow-2xl border border-stone-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 transition-all">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-rose-950 flex items-center justify-center text-amber-100 font-serif font-bold text-sm border-2 border-white/20 shadow">
                  BH
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm leading-tight flex items-center gap-1.5">
                  Becoming Her Coach
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                </h4>
                <p className="text-[11px] text-emerald-100/90 font-medium">
                  AI Coach & Support • Online 24/7
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                setHasInteracted(true);
              }}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
              aria-label="Close WhatsApp chat preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Body Bubble */}
          <div className="p-4 bg-[#ECE5DD] space-y-3">
            <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs text-xs text-stone-800 leading-relaxed space-y-2 border border-stone-200/50">
              <p className="font-medium">
                Hello there! 🌸 Welcome to <span className="font-semibold text-rose-950">Becoming Her</span>.
              </p>
              <p className="text-stone-600">
                I’m your AI coaching companion. I can help you clarify your goals, explore our digital programmes (from KES 1,000), or connect you with Coach Zipporah Karanja right on WhatsApp!
              </p>
              <span className="text-[10px] text-stone-400 block text-right">Just now</span>
            </div>

            {/* Quick Prompt Starters */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 px-1">
                Suggested Prompts
              </span>
              <button
                onClick={() =>
                  handleOpenWhatsApp('Hi! I want to explore the Becoming Her transformational coaching options.')
                }
                className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-stone-50 text-xs text-stone-800 font-medium border border-stone-200/80 shadow-xs transition flex items-center justify-between group"
              >
                <span>✨ View Coaching Programmes & Pricing</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-600 transition shrink-0" />
              </button>

              <button
                onClick={() =>
                  handleOpenWhatsApp('Hello Coach, I feel overwhelmed and need clarity in my life and career.')
                }
                className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-stone-50 text-xs text-stone-800 font-medium border border-stone-200/80 shadow-xs transition flex items-center justify-between group"
              >
                <span>🌿 I feel overwhelmed & need clarity</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-600 transition shrink-0" />
              </button>

              <button
                onClick={() =>
                  handleOpenWhatsApp('Hi Zipporah, I would like to book a 1-on-1 interpersonal coaching session.')
                }
                className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-stone-50 text-xs text-stone-800 font-medium border border-stone-200/80 shadow-xs transition flex items-center justify-between group"
              >
                <span>☕ Book 1-on-1 Session (KES 2,500)</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-600 transition shrink-0" />
              </button>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-3 bg-white border-t border-stone-100 flex items-center gap-2">
            <button
              onClick={() => handleOpenWhatsApp()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chat Directly on WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasInteracted(true);
        }}
        className="group relative flex items-center gap-2.5 py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/60"
        aria-label="Open WhatsApp AI Coaching Chat"
      >
        {/* Glow effect */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-sm group-hover:bg-emerald-400/50 transition opacity-75 animate-pulse" />

        {/* WhatsApp Icon */}
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-6 h-6 fill-white stroke-none drop-shadow" />
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Label */}
        <span className="relative font-semibold text-xs tracking-wide hidden sm:inline-block drop-shadow-xs">
          {isOpen ? 'Close' : 'Chat with Coach'}
        </span>
      </button>
    </div>
  );
}
