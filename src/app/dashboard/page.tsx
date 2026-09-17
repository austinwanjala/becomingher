'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gem,
  BookOpen,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  Video,
  Target,
  FileText,
  UserCheck,
  Compass
} from 'lucide-react';
import { store } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<any>(null);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        // 1. Trigger auto-sync so newly completed orders/entitlements are reconciled
        try {
          const syncRes = await fetch('/api/auth/sync-entitlements', { method: 'POST' });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.entitlements) {
              setEntitlements(syncData.entitlements);
            }
          }
        } catch (syncErr) {
          console.error('Error syncing entitlements:', syncErr);
        }

        // Direct query fallback for entitlements
        const { data: entData } = await supabase
          .from('entitlements')
          .select('*')
          .eq('customer_id', user.id)
          .eq('status', 'ACTIVE');
        if (entData && entData.length > 0) setEntitlements(entData);

        // Fetch user's bookings from database
        const { data: bData } = await supabase
          .from('bookings')
          .select('*')
          .or(`customer_id.eq.${user.id},customer_email.eq.${user.email}`)
          .order('created_at', { ascending: false });
        if (bData) setDbBookings(bData);

        // Fetch user's orders from database
        const { data: oData } = await supabase
          .from('orders')
          .select('*')
          .or(`customer_id.eq.${user.id},customer_email.eq.${user.email}`)
          .order('created_at', { ascending: false });
        if (oData) setDbOrders(oData);
      }
      setIsLoading(false);
    });
  }, []);

  const customerId = user ? user.id : 'cust-demo-01';
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Grace Mwangi';

  let bookings = dbBookings.length > 0 ? dbBookings : store.bookings.filter((b) => b.customer_id === customerId);
  let orders = dbOrders.length > 0 ? dbOrders : store.orders.filter((o) => o.customer_id === customerId);
  let goals = store.goals.filter((g) => g.user_id === customerId);
  let reflections = store.reflections.filter((r) => r.user_id === customerId);

  // If newly signed-up user has no store records yet, check email match
  if (user?.email && entitlements.length === 0) {
    const matchedOrders = store.orders.filter((o) => o.customer_email.toLowerCase() === user.email.toLowerCase());
    if (matchedOrders.length > 0) {
      orders = matchedOrders;
    }
  }

  const activeEntitlements = entitlements.filter((e) => e.status === 'ACTIVE');
  const upcomingBooking = bookings.find((b) => b.booking_status === 'CONFIRMED');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white p-8 sm:p-10 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-200 text-xs font-medium">
            <Gem className="w-3.5 h-3.5" /> Welcome to Your Dedicated Customer Portal
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
            Peace and expansion, {userName}.
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Every intentional pause you take here is an act of honoring the sovereign woman you are authoring every single day.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Active Programmes</span>
            <BookOpen className="w-4 h-4 text-rose-800" />
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900">{entitlements.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">
            {entitlements.length > 0 ? 'Curriculum Unlocked' : 'Ready to Enroll'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>1-on-1 Sessions</span>
            <Calendar className="w-4 h-4 text-rose-800" />
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900">{bookings.length}</p>
          <span className="text-[11px] text-stone-500">
            {upcomingBooking ? '1 Upcoming Confirmed' : 'No Scheduled Bookings'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Active Goals</span>
            <Target className="w-4 h-4 text-rose-800" />
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900">{goals.length}</p>
          <span className="text-[11px] text-stone-500">Actively Monitored</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Saved Reflections</span>
            <FileText className="w-4 h-4 text-rose-800" />
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900">{reflections.length}</p>
          <span className="text-[11px] text-stone-500">Journal Entries</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Programme & Live Sessions */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Programme Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-semibold text-stone-900">Current Programme</h3>
                <p className="text-xs text-stone-500">Your unlocked transformational curriculum</p>
              </div>
              <Link
                href="/dashboard/programmes"
                className="text-xs font-medium text-rose-800 hover:text-rose-950"
              >
                View Curricula →
              </Link>
            </div>

            {activeEntitlements.length > 0 ? (
              <div className="space-y-4">
                {activeEntitlements.map((entitlement) => {
                  const isWorkbook = entitlement.service_id === 'srv-book-04';
                  const isSession = entitlement.service_id === 'srv-interpersonal-03';

                  let badge = 'In Progress';
                  let subtitle = 'Curriculum Unlocked';
                  let buttonLabel = 'Resume Learning';
                  let targetHref = `/dashboard/programmes/${entitlement.service_id}`;

                  if (isWorkbook) {
                    badge = 'Sacred Material';
                    subtitle = '142-Page Companion Workbook';
                    buttonLabel = 'Read & Download';
                    targetHref = '/dashboard/programmes/srv-book-04';
                  } else if (isSession) {
                    badge = 'Private Mentorship';
                    subtitle = '1-on-1 Strategy Session';
                    buttonLabel = 'View Session';
                    targetHref = '/dashboard/sessions';
                  }

                  return (
                    <div key={entitlement.id} className="space-y-4 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-rose-900 uppercase tracking-widest bg-rose-100/70 px-2 py-0.5 rounded">
                            {badge}
                          </span>
                          <h4 className="font-serif text-lg font-semibold text-stone-900">
                            {entitlement.service_name}
                          </h4>
                          <p className="text-xs text-stone-500">{subtitle}</p>
                        </div>
                        <Link
                          href={targetHref}
                          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition shrink-0 flex items-center justify-center gap-2 shadow"
                        >
                          <span>{buttonLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Progress Bar (for programmes) */}
                      {!isSession && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-stone-600 font-medium">
                            <span>{isWorkbook ? 'Reading Progress' : 'Journey Completion'}</span>
                            <span>{entitlement.progress_percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-900 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(5, entitlement.progress_percentage || 0)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-4 text-center sm:text-left">
                <div className="space-y-1">
                  <h4 className="font-serif font-semibold text-stone-900 text-base">
                    Ready to begin your coaching pathway?
                  </h4>
                  <p className="text-xs text-stone-600">
                    Select a structured digital programme or schedule a 1-on-1 session with Lead Coach Zipporah Karanja to unlock your full portal.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <Link
                    href="/checkout/srv-guided-01"
                    className="p-3 rounded-xl bg-white border border-stone-200 hover:border-rose-900 text-left transition block group"
                  >
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">KES 1,000</span>
                    <span className="text-xs font-semibold text-stone-900 group-hover:text-rose-950 block">Guided Programme</span>
                    <span className="text-[10px] text-stone-500 block">4 Weeks / 12 Lessons</span>
                  </Link>
                  <Link
                    href="/checkout/srv-custom-02"
                    className="p-3 rounded-xl bg-white border border-stone-200 hover:border-rose-900 text-left transition block group"
                  >
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">KES 1,500</span>
                    <span className="text-xs font-semibold text-stone-900 group-hover:text-rose-950 block">Custom Coaching</span>
                    <span className="text-[10px] text-stone-500 block">Bespoke Roadmap</span>
                  </Link>
                  <Link
                    href="/checkout/srv-interpersonal-03"
                    className="p-3 rounded-xl bg-white border border-stone-200 hover:border-rose-900 text-left transition block group"
                  >
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">KES 2,500</span>
                    <span className="text-xs font-semibold text-stone-900 group-hover:text-rose-950 block">1-on-1 Session</span>
                    <span className="text-[10px] text-stone-500 block">60-Min Video Call</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Interpersonal Coaching Session */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif text-xl font-semibold text-stone-900">Upcoming Live Session</h3>
                <p className="text-xs text-stone-500">Private 1-on-1 mentorship container</p>
              </div>
              <Link
                href="/dashboard/sessions"
                className="text-xs font-medium text-rose-800 hover:text-rose-950"
              >
                All Bookings →
              </Link>
            </div>

            {upcomingBooking ? (
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded">
                      Confirmed & Paid
                    </span>
                    <h4 className="font-serif text-base font-semibold text-stone-900">
                      Coaching with {upcomingBooking.coach_name}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-stone-600 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-800" /> {upcomingBooking.scheduled_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-800" /> {upcomingBooking.start_time} - {upcomingBooking.end_time} ({upcomingBooking.timezone})
                      </span>
                    </div>
                  </div>

                  {/* Meeting link only shown when paid and confirmed */}
                  {upcomingBooking.meeting_link && (
                    <a
                      href={upcomingBooking.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition flex items-center justify-center gap-2 shadow"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Google Meet</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-stone-500 space-y-2">
                <p>No upcoming 1-on-1 coaching sessions scheduled.</p>
                <Link
                  href="/services/interpersonal-coaching"
                  className="inline-block text-rose-900 font-semibold hover:underline"
                >
                  Schedule a Daytime Session with Coach Zipporah →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reflection Companion Quick Prompt & Recent Order */}
        <div className="lg:col-span-4 space-y-8">
          {/* Reflection Companion Prompt Card */}
          <div className="bg-gradient-to-br from-[#FAF8F5] to-rose-50/70 p-6 rounded-3xl border border-rose-200/70 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-rose-950">
              <div className="w-8 h-8 rounded-full bg-rose-950 text-amber-200 flex items-center justify-center shadow-sm">
                <Gem className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-base">Digital Coaching Sanctuary</h4>
                <span className="text-[10px] text-stone-500 block">Available 24/7 for you</span>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed italic bg-white/70 p-3.5 rounded-xl border border-rose-100">
              "What is one bold commitment you made to yourself today that you need gentle accountability with?"
            </p>

            <Link
              href="/dashboard/coaching"
              className="w-full py-2.5 rounded-xl bg-stone-900 text-amber-50 text-xs font-semibold text-center block hover:bg-rose-950 transition shadow"
            >
              Open Coaching Companion →
            </Link>
          </div>

          {/* Recent Selar Purchases */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="font-serif text-base font-semibold text-stone-900">Recent Purchase</h4>
              <Link href="/dashboard/purchases" className="text-[11px] text-rose-800 hover:underline">
                All Receipts
              </Link>
            </div>

            {orders.length > 0 ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-medium text-stone-900">
                  <span className="truncate max-w-[170px]">{orders[0].service_name}</span>
                  <span className="text-rose-950 font-bold">
                    {orders[0].currency} {orders[0].amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>Ref: {orders[0].order_reference}</span>
                  <span className="text-emerald-600 font-medium">✓ Selar Verified</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">No purchase records found yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
