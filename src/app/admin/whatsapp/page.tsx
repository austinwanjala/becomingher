'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Smartphone,
  Send,
  UserCheck,
  Headphones,
  Settings,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminWhatsAppPage() {
  // State
  const [metrics, setMetrics] = useState({
    totalContacts: 24,
    activeConversations: 8,
    humanHandoffCount: 2,
    serviceInquiries: 19,
    convertedCount: 7,
    conversionRate: 29.2
  });

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  // Simulator State
  const [simPhone, setSimPhone] = useState('+254712345678');
  const [simName, setSimName] = useState('Faith Wanjiru');
  const [simInput, setSimInput] = useState('');
  const [simMessages, setSimMessages] = useState<any[]>([
    {
      id: 'msg-init-1',
      senderType: 'bot',
      body: 'Hello Faith! 🌸 Welcome to *Becoming Her* — a digital sanctuary dedicated to helping women step into their highest clarity, confidence, and purpose.\n\nI am your Becoming Her coaching companion. How are you feeling today, and what brings you to Becoming Her?',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ]);
  const [simState, setSimState] = useState('DISCOVERY');
  const [simLoading, setSimLoading] = useState(false);
  const simEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll simulator
  useEffect(() => {
    simEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages]);

  // Load simulator initial history
  const refreshSimulator = async () => {
    try {
      const res = await fetch(`/api/whatsapp/simulate?phone=${encodeURIComponent(simPhone)}`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setSimMessages(data.messages);
        setSimState(data.conversation?.state || 'DISCOVERY');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send simulator message
  const handleSimSend = async (customText?: string, buttonId?: string) => {
    const textToSend = customText !== undefined ? customText : simInput;
    if (!textToSend && !buttonId) return;

    const userMsg = {
      id: `sim-u-${Date.now()}`,
      senderType: 'user',
      body: textToSend || 'Selected option',
      createdAt: new Date().toISOString()
    };

    setSimMessages((prev) => [...prev, userMsg]);
    setSimInput('');
    setSimLoading(true);

    try {
      const res = await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: simPhone,
          name: simName,
          text: textToSend,
          buttonId
        })
      });

      const data = await res.json();
      if (data.result) {
        const botMsg = {
          id: `sim-b-${Date.now()}`,
          senderType: 'bot',
          body: data.result.replyText,
          metadata: { buttons: data.result.buttons },
          createdAt: new Date().toISOString()
        };
        setSimMessages((prev) => [...prev, botMsg]);
        setSimState(data.result.state);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Meta WhatsApp Cloud API & Sandbox Live
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">
            WhatsApp Coaching Assistant
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Empathetic conversational coaching, automated programme recommendations, and Selar conversion funnel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSimulator}
            className="rounded-xl border-stone-200 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Chats
          </Button>
        </div>
      </div>

      {/* Funnel Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="rounded-2xl border-stone-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Total Contacts
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-stone-900">{metrics.totalContacts}</span>
              <Users className="w-4 h-4 text-rose-800/60" />
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
              +4 new today
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-stone-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Active Sessions
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-700">{metrics.activeConversations}</span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-stone-500 font-medium mt-1 block">
              Automated Companion mode
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-stone-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Service Inquiries
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-stone-900">{metrics.serviceInquiries}</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] text-stone-500 font-medium mt-1 block">
              Pricing shared
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-stone-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Paid Conversions
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-rose-950">{metrics.convertedCount}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
              Via Selar checkout
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-stone-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Conversion Rate
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-stone-900">{metrics.conversionRate}%</span>
              <span className="text-xs font-semibold text-emerald-600">High</span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium mt-1 block">
              Lead ➔ Paid Member
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-stone-200/80 shadow-xs bg-white">
          <CardContent className="p-4">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
              Human Handoffs
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-800">{metrics.humanHandoffCount}</span>
              <Headphones className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] text-amber-700 font-medium mt-1 block">
              Awaiting Coach response
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Live Smartphone Simulator & Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Smartphone Simulator */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-rose-800" /> Live WhatsApp Simulator
              </h3>
              <p className="text-xs text-stone-500">Test sanctuary companion state transitions in real time</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
              State: {simState}
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full max-w-[390px] h-[660px] bg-stone-900 rounded-[48px] p-3 shadow-2xl border-4 border-stone-800 relative flex flex-col overflow-hidden">
            {/* Camera notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-stone-900 rounded-full z-40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-stone-950 border border-stone-800 mr-2" />
              <div className="w-2 h-2 rounded-full bg-blue-900/60" />
            </div>

            {/* Screen Inner */}
            <div className="w-full h-full bg-[#ECE5DD] rounded-[40px] flex flex-col overflow-hidden relative">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white pt-8 pb-3 px-4 flex items-center justify-between shadow z-30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-950 flex items-center justify-center text-amber-200 font-serif font-bold text-sm shadow">
                    BH
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                      Becoming Her Coach
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </h4>
                    <p className="text-[10px] text-emerald-100">Official Coaching Sanctuary</p>
                  </div>
                </div>
                <div className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-100 font-medium">
                  Verified
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Security notice */}
                <div className="bg-[#FFF4C7] p-2 rounded-lg text-center text-[10px] text-stone-700 shadow-xs border border-amber-200/50">
                  🔒 Messages and calls are end-to-end encrypted with Becoming Her.
                </div>

                {simMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${msg.senderType === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                        msg.senderType === 'user'
                          ? 'bg-[#E7FFDB] text-stone-900 rounded-tr-none'
                          : 'bg-white text-stone-800 rounded-tl-none border border-stone-200/50'
                      }`}
                    >
                      {msg.body}

                      {/* Interactive Buttons rendered on WhatsApp */}
                      {msg.metadata?.buttons && msg.metadata.buttons.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-col gap-1.5">
                          {msg.metadata.buttons.map((btn: any) => (
                            <button
                              key={btn.id}
                              onClick={() => handleSimSend(btn.title, btn.id)}
                              className="w-full py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition border border-emerald-200 text-center"
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-stone-500 mt-0.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}

                {simLoading && (
                  <div className="flex items-center gap-1.5 bg-white p-2.5 rounded-2xl rounded-tl-none shadow-xs w-24 text-[10px] text-stone-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                    <span>typing...</span>
                  </div>
                )}
                <div ref={simEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 bg-[#F0F0F0] border-t border-stone-200 flex items-center gap-2 z-30">
                <Input
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimSend()}
                  placeholder="Type a message..."
                  className="rounded-full bg-white border-none shadow-xs text-xs h-9 focus-visible:ring-emerald-700"
                />
                <Button
                  onClick={() => handleSimSend()}
                  disabled={simLoading || !simInput.trim()}
                  size="icon"
                  className="rounded-full bg-[#075E54] hover:bg-[#128C7E] h-9 w-9 text-white shrink-0 shadow"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Scenario Buttons for Testing */}
          <div className="w-full max-w-[390px] mt-4 p-3 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Quick Test Prompts
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimSend('Hi, I want to learn about Becoming Her')}
                className="text-[11px] h-8 justify-start truncate rounded-lg"
              >
                👋 Say Hello
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimSend('What coaching programmes do you have and how much?')}
                className="text-[11px] h-8 justify-start truncate rounded-lg"
              >
                💰 View Pricing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimSend('I feel completely overwhelmed with my career and life')}
                className="text-[11px] h-8 justify-start truncate rounded-lg"
              >
                🌿 Overwhelmed (Coach)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimSend('I want to enroll in the Guided Digital Coaching programme')}
                className="text-[11px] h-8 justify-start truncate rounded-lg"
              >
                🛒 Guided Programme
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimSend('Can I speak with a real human please?')}
                className="text-[11px] h-8 justify-start truncate rounded-lg"
              >
                👤 Human Handoff
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimSend('Check status of my upcoming session booking')}
                className="text-[11px] h-8 justify-start truncate rounded-lg"
              >
                📅 My Booking
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Conversation Explorer & WhatsApp Cloud API Settings */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-6">
          {/* Active Handoffs Alert */}
          <Card className="rounded-3xl border-amber-200 bg-amber-50/50 shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                  <Headphones className="w-4 h-4 text-amber-700" />
                  <span>Human Assistance Queue</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                  2 Pending
                </span>
              </div>
              <CardDescription className="text-xs text-amber-800/80">
                Visitors who explicitly requested to speak directly with Coach Zipporah or our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              <div className="p-3 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-stone-900">Mercy Achieng (+254 798 112 334)</p>
                  <p className="text-[11px] text-stone-500">"I have a specific question about payment with M-Pesa on Selar"</p>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs h-8"
                >
                  Join Chat
                </Button>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-stone-900">Dr. Sarah Kemunto (+254 722 998 877)</p>
                  <p className="text-[11px] text-stone-500">"Inquiring about booking 3 consecutive interpersonal sessions"</p>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs h-8"
                >
                  Join Chat
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Official WhatsApp Cloud API Credentials & Configuration */}
          <Card className="rounded-3xl border-stone-200/80 bg-white shadow-xs">
            <CardHeader className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-lg font-bold text-stone-900">
                    WhatsApp Cloud API Configuration
                  </CardTitle>
                  <CardDescription className="text-xs text-stone-500 mt-0.5">
                    Connect your Meta WhatsApp Business App with Becoming Her webhook
                  </CardDescription>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">Webhook Callback URL</Label>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-[11px] text-stone-800 select-all truncate">
                    https://becomingher.co.ke/api/webhooks/whatsapp
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">Verify Token</Label>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-[11px] text-stone-800 select-all truncate">
                    becoming_her_secret_webhook_token
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">Phone Number ID</Label>
                  <Input
                    placeholder="e.g. 104829384729102"
                    defaultValue="109283746501928"
                    className="rounded-xl border-stone-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-700">System User Access Token</Label>
                  <Input
                    type="password"
                    placeholder="EAABw..."
                    defaultValue="EAABw782910secret..."
                    className="rounded-xl border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-900">Dual-Mode Resilience Enabled</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    If official credentials are not yet configured on your server, the simulator operates in High-Fidelity Sandbox Mode, persisting real contact states and funnel metrics seamlessly.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button className="rounded-xl bg-rose-950 hover:bg-stone-900 text-amber-100 text-xs font-semibold">
                  Save Credentials
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Service Sync Status */}
          <Card className="rounded-3xl border-stone-200/80 bg-white shadow-xs">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="font-serif text-base font-bold text-stone-900">
                Bot Knowledge & Pricing Grounding
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Prices and service descriptions dynamically fetched from Becoming Her single store
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-2.5">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900">Guided Digital Coaching Programme</span>
                  <span className="text-[10px] text-stone-500 block">ID: srv-guided-01</span>
                </div>
                <span className="font-serif font-bold text-rose-900 text-sm">KES 1,000</span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900">Customized Digital Coaching Programme</span>
                  <span className="text-[10px] text-stone-500 block">ID: srv-custom-02</span>
                </div>
                <span className="font-serif font-bold text-rose-900 text-sm">KES 1,500</span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900">Interpersonal Daytime Coaching Session</span>
                  <span className="text-[10px] text-stone-500 block">ID: srv-interpersonal-03</span>
                </div>
                <span className="font-serif font-bold text-rose-900 text-sm">KES 2,500</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
