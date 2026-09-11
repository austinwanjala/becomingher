'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ChatMessage {
  id: string;
  senderType: 'user' | 'bot';
  body: string;
  metadata?: {
    buttons?: { id: string; title: string }[];
  };
  createdAt: string;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome-0',
  senderType: 'bot',
  body:
    "Hello! 🌸 Welcome to *Becoming Her* — a digital sanctuary dedicated to helping women step into their highest clarity, confidence, and purpose.\n\n" +
    "I am your AI coaching companion. How are you feeling today, and what brings you to Becoming Her?",
  metadata: {
    buttons: [
      { id: 'btn_explore_services', title: 'View Programmes' },
      { id: 'btn_share_struggles', title: 'Share My Goals' },
      { id: 'btn_talk_human', title: 'Talk to Coach' }
    ]
  },
  createdAt: new Date().toISOString()
};

const OFFICIAL_WHATSAPP_PHONE = '254712345678';

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [visitorName, setVisitorName] = useState('Sister');
  const [visitorPhone, setVisitorPhone] = useState('+254700000000');
  const [conversationState, setConversationState] = useState('DISCOVERY');
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(false);

  // Do not render on admin console to keep admin layout clean
  const isAdmin = pathname.startsWith('/admin');

  // Load visitor details and persistent conversation history once on mount
  useEffect(() => {
    if (isAdmin || isMountedRef.current) return;
    isMountedRef.current = true;

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Member';
          setVisitorName(name);
          if (user.user_metadata?.phone) {
            setVisitorPhone(user.user_metadata.phone);
          } else {
            const digits = user.id.replace(/\D/g, '').slice(0, 8);
            setVisitorPhone(`+2547${digits.padEnd(8, '0')}`);
          }
        } else {
          // Guest: generate or retrieve guest phone number
          let storedGuestPhone = typeof window !== 'undefined' ? localStorage.getItem('bh_wa_guest_phone') : null;
          if (!storedGuestPhone) {
            storedGuestPhone = `+2547${Math.floor(10000000 + Math.random() * 90000000)}`;
            if (typeof window !== 'undefined') {
              localStorage.setItem('bh_wa_guest_phone', storedGuestPhone);
            }
          }
          setVisitorPhone(storedGuestPhone);
        }
      }).catch(console.error);

      // Check localStorage for previous chat session
      if (typeof window !== 'undefined') {
        const savedMessages = localStorage.getItem('bh_wa_messages');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Failed to initialize chat:', e);
    }
  }, [isAdmin]);

  // Scroll to bottom when new messages arrive and window is open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  if (isAdmin) return null;

  const handleOpenInRealWhatsApp = () => {
    const latestUserMsg = [...messages].reverse().find(m => m.senderType === 'user')?.body;
    const text = latestUserMsg
      ? `Hello Becoming Her! 🌸 Continuing from the website: "${latestUserMsg}"`
      : "Hello Becoming Her! 🌸 I am reaching out from your website to explore coaching programmes.";
    const url = `https://wa.me/${OFFICIAL_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResetConversation = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bh_wa_messages');
    }
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setConversationState('DISCOVERY');
  };

  const handleSendMessage = async (textToSend?: string, buttonId?: string) => {
    const body = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!body && !buttonId) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      senderType: 'user',
      body: body || (buttonId ? 'Selected option' : ''),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      if (typeof window !== 'undefined') {
        localStorage.setItem('bh_wa_messages', JSON.stringify(updated));
      }
      return updated;
    });

    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: visitorPhone,
          name: visitorName,
          text: body,
          buttonId
        })
      });

      const data = await response.json();

      if (data.result) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          senderType: 'bot',
          body: data.result.replyText,
          metadata: {
            buttons: data.result.buttons
          },
          createdAt: new Date().toISOString()
        };

        setMessages(prev => {
          const updated = [...prev, botMessage];
          if (typeof window !== 'undefined') {
            localStorage.setItem('bh_wa_messages', JSON.stringify(updated));
          }
          return updated;
        });

        if (data.result.state) {
          setConversationState(data.result.state);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        senderType: 'bot',
        body: "I am having a moment connecting to the coaching sanctuary. Please feel free to open this conversation directly in WhatsApp or try again shortly. 🌸",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format text with bold, line breaks, and clickable links
  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const parts = content.split('\n');

    return parts.map((line, lineIdx) => {
      const isInternalLink = line.includes('/register') || line.includes('/checkout') || line.includes('/dashboard');

      return (
        <span key={lineIdx} className="block min-h-[1.25em]">
          {isInternalLink ? (
            <span className="my-1.5 block">
              {line.split(' ').map((word, wordIdx) => {
                if (word.startsWith('http') || word.startsWith('/register') || word.startsWith('/checkout') || word.startsWith('/dashboard')) {
                  const cleanUrl = word.trim().replace(/[.,!?:;]$/, '');
                  return (
                    <Link
                      key={wordIdx}
                      href={cleanUrl}
                      className="inline-flex items-center gap-1 my-1 px-3 py-1.5 rounded-xl bg-rose-950 text-amber-200 font-semibold text-[11px] hover:bg-stone-900 transition shadow-xs"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>Proceed to Member Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  );
                }
                return word + ' ';
              })}
            </span>
          ) : (
            line.split(/(\*[^*]+\*)/g).map((chunk, chunkIdx) => {
              if (chunk.startsWith('*') && chunk.endsWith('*')) {
                return <strong key={chunkIdx} className="font-bold text-stone-950">{chunk.slice(1, -1)}</strong>;
              }
              return chunk.split(/(_[^_]+_)/g).map((sub, subIdx) => {
                if (sub.startsWith('_') && sub.endsWith('_')) {
                  return <em key={subIdx} className="italic text-stone-700">{sub.slice(1, -1)}</em>;
                }
                return sub;
              });
            })
          )}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      {/* Expanded Interactive Chatbot Window */}
      {isOpen && (
        <div
          className={`mb-3 w-[350px] sm:w-[390px] ${
            isMinimized ? 'h-16' : 'h-[580px] sm:h-[620px]'
          } rounded-[32px] bg-stone-900 shadow-2xl border-4 border-stone-800 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6`}
        >
          {/* WhatsApp Header */}
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow z-30 select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-rose-950 flex items-center justify-center text-amber-100 font-serif font-bold text-sm shadow border border-white/20">
                  BH
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#075E54]" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1">
                  Becoming Her Coach
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                </h4>
                <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Online • AI Companion
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenInRealWhatsApp}
                title="Continue on WhatsApp App"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetConversation}
                title="Restart Chat"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Chat Body */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col bg-[#ECE5DD] overflow-hidden relative">
              {/* Privacy Notice Banner */}
              <div className="p-2 bg-[#FFF4C7] border-b border-amber-200/50 text-center text-[10px] text-stone-700 shadow-xs">
                🔒 Private & confidential AI coaching session with Becoming Her.
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.senderType === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                        msg.senderType === 'user'
                          ? 'bg-[#E7FFDB] text-stone-900 rounded-tr-none'
                          : 'bg-white text-stone-800 rounded-tl-none border border-stone-200/60'
                      }`}
                    >
                      {renderMessageContent(msg.body)}

                      {/* Interactive Buttons (e.g. Guided, Custom, 1-on-1, etc.) */}
                      {msg.metadata?.buttons && msg.metadata.buttons.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-col gap-1.5">
                          {msg.metadata.buttons.map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => handleSendMessage(btn.title, btn.id)}
                              className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold transition border border-emerald-200 text-center text-emerald-900 hover:scale-[1.01]"
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-stone-500 mt-0.5 px-1 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}

                {/* Animated Typing Indicator */}
                {loading && (
                  <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-2xl rounded-tl-none shadow-xs w-24 text-[10px] text-stone-500 border border-stone-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                    <span>typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Carousel */}
              <div className="px-3 py-1.5 bg-white/80 backdrop-blur-xs border-t border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() =>
                    handleSendMessage('What coaching programmes do you offer and what are the prices?')
                  }
                  className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-medium text-stone-600 border border-stone-200 transition"
                >
                  ✨ View Pricing
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('I feel overwhelmed with where I am in life and need clarity.')
                  }
                  className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-medium text-stone-600 border border-stone-200 transition"
                >
                  🌿 Feeling Overwhelmed
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('I want to enroll in the Guided Digital Coaching programme.')
                  }
                  className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-medium text-stone-600 border border-stone-200 transition"
                >
                  🛒 Guided (KES 1,000)
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('Can I please speak with Coach Zipporah or a human agent?')
                  }
                  className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-medium text-stone-600 border border-stone-200 transition"
                >
                  👤 Talk to Human
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 bg-[#F0F0F0] border-t border-stone-200 flex items-center gap-2 z-30">
                <input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                  placeholder="Type a message to Coach..."
                  className="flex-1 rounded-full bg-white px-4 py-2 text-xs border border-stone-200 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600 text-stone-800 placeholder:text-stone-400"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !inputMessage.trim()}
                  className="w-9 h-9 rounded-full bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow transition"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/60"
        aria-label="Open Becoming Her AI Coaching Chatbot"
      >
        {/* Ambient pulse glow */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-sm group-hover:bg-emerald-400/50 transition opacity-75 animate-pulse" />

        {/* WhatsApp Icon */}
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-6 h-6 fill-white stroke-none drop-shadow" />
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Dynamic Label */}
        <span className="relative font-semibold text-xs tracking-wide hidden sm:inline-block drop-shadow-xs">
          {isOpen ? 'Close Chat' : 'Chat with Coach'}
        </span>
      </button>
    </div>
  );
}
