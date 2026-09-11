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

const OFFICIAL_WHATSAPP_PHONE = '254720120227';

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [visitorName, setVisitorName] = useState('Sister');
  const [visitorUserId, setVisitorUserId] = useState<string | null>(null);
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
          const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member';
          setVisitorName(name);
          setVisitorUserId(user.id);
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
          buttonId,
          userId: visitorUserId
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
      const isInternalLink =
        line.includes('http') ||
        line.includes('/register') ||
        line.includes('/checkout') ||
        line.includes('/dashboard');
      const isWhatsAppLink = line.includes('wa.me');

      if (!line.trim()) {
        return <span key={lineIdx} className="block h-2" />;
      }

      if (isWhatsAppLink) {
        return (
          <span key={lineIdx} className="my-2 block">
            <a
              href="https://wa.me/254720120227?text=Hello%20Coach%20Zipporah!%20%F0%9F%8C%B8%20I'm%20reaching%20out%20from%20Becoming%20Her%20to%20speak%20with%20you%20directly."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-[11px] shadow-sm transition hover:scale-[1.02]"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
              <span>Open WhatsApp with Coach (+254 720 120 227)</span>
            </a>
          </span>
        );
      }

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
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto print:hidden">
        {/* Floating Bubble Pill for Returning Visitors */}
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="cursor-pointer group flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-emerald-100 hover:border-emerald-300 transition-all transform hover:-translate-y-0.5 duration-200"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-medium text-stone-800 flex items-center gap-1">
              <span>Chat with Coach</span>
              <span className="font-serif italic text-rose-900 font-bold">Zipporah</span>
            </p>
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-[10px] font-bold">
              1
            </div>
          </div>
        )}

        {/* WhatsApp Icon Circle */}
        <button
          onClick={() => {
            setIsOpen(prev => !prev);
            setIsMinimized(false);
          }}
          aria-label="Open Becoming Her WhatsApp Assistant"
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen ? 'bg-stone-800 hover:bg-stone-900' : 'bg-[#25D366] hover:bg-[#20bd5a]'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200 rotate-0" />
          ) : (
            <>
              <MessageCircle className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] font-bold text-white items-center justify-center">
                  🌸
                </span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Main Chat Modal Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[400px] z-50 transition-all duration-300 transform origin-bottom-right ${
            isMinimized ? 'h-14 overflow-hidden rounded-2xl' : 'h-[580px] max-h-[82vh] rounded-3xl'
          } bg-stone-100 shadow-2xl border border-stone-200/80 flex flex-col overflow-hidden`}
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
                  {visitorUserId ? `Member: ${visitorName}` : 'Online • AI Companion'}
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
                onClick={() => setIsMinimized(prev => !prev)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition"
              >
                <ChevronDown className={`w-4 h-4 transform transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Body & Input Container */}
          {!isMinimized && (
            <>
              {/* WhatsApp Wallpaper Messages Area */}
              <div
                className="flex-1 p-3.5 overflow-y-auto space-y-3.5"
                style={{
                  backgroundColor: '#ECE5DD',
                  backgroundImage: `radial-gradient(#d4c8be 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }}
              >
                {/* Security / Encryption Notice */}
                <div className="flex justify-center my-1">
                  <div className="bg-[#FFF4C7] text-[#554000] text-[10px] px-3 py-1 rounded-lg text-center max-w-[90%] shadow-2xs border border-[#FFE28A]/60 flex items-center gap-1.5 leading-snug">
                    <Sparkles className="w-3 h-3 shrink-0 text-amber-700" />
                    <span>Confidential coaching sanctuary grounded in Becoming Her transformation modules.</span>
                  </div>
                </div>

                {/* Messages Feed */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.senderType === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs transition-all ${
                        msg.senderType === 'user'
                          ? 'bg-[#E7FFDB] text-stone-900 rounded-tr-none'
                          : 'bg-white text-stone-900 rounded-tl-none border border-stone-200/60'
                      }`}
                    >
                      <div className="text-xs leading-relaxed space-y-1">
                        {renderMessageContent(msg.body)}
                      </div>

                      {/* Interactive Buttons rendered on message */}
                      {msg.metadata?.buttons && msg.metadata.buttons.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex flex-col gap-1.5">
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
                {visitorUserId ? (
                  <>
                    <button
                      onClick={() =>
                        handleSendMessage('What did I write in my reflections?', 'btn_my_reflections')
                      }
                      className="shrink-0 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-[10px] font-medium text-rose-900 border border-rose-200 transition flex items-center gap-1"
                    >
                      💭 My Reflections
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage('Give me a reflection question to answer right now.', 'btn_reflect_prompt')
                      }
                      className="shrink-0 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-[10px] font-medium text-amber-900 border border-amber-200 transition flex items-center gap-1"
                    >
                      ✍️ Reflect Now
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage('What are my active goals and progress?', 'btn_view_goals')
                      }
                      className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[10px] font-medium text-emerald-900 border border-emerald-200 transition flex items-center gap-1"
                    >
                      🎯 My Goals
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage('What was my challenge in my onboarding questionnaire?')
                      }
                      className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-[10px] font-medium text-stone-700 border border-stone-200 transition"
                    >
                      📋 My Assessment
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage('Can I please speak with Coach Zipporah or a human agent?', 'btn_talk_human')
                      }
                      className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-[10px] font-medium text-stone-700 border border-stone-200 transition"
                    >
                      👤 Talk to Coach
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
            </>
          )}
        </div>
      )}
    </>
  );
}
