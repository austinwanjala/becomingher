'use client';

import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  ShieldCheck,
  ExternalLink,
  Mail,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  CalendarCheck,
  UserCheck
} from 'lucide-react';
import { store } from '@/lib/store';
import { Booking } from '@/types';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(store.coach);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [manualMeetingLink, setManualMeetingLink] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED'>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notifyCustomerOnSave, setNotifyCustomerOnSave] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to fetch bookings`);
      }
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setErrorMessage(err.message || 'Failed to load bookings from database.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const startEditMeetingLink = (booking: Booking) => {
    setEditingBooking(booking);
    setManualMeetingLink(
      booking.meeting_link || `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}`
    );
  };

  const saveMeetingLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    try {
      setIsSavingLink(true);
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBooking.id,
          meeting_link: manualMeetingLink,
          booking_status: 'CONFIRMED'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update meeting link');
      }

      // If requested, immediately notify the customer with the updated link email
      let emailNotice = '';
      if (notifyCustomerOnSave) {
        try {
          const emailRes = await fetch('/api/admin/resend-booking-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: editingBooking.id,
              isUpdatedLink: true,
              meetingLink: manualMeetingLink
            })
          });
          if (emailRes.ok) {
            emailNotice = ' and notification email with the updated link was sent to customer!';
          }
        } catch (emailErr) {
          console.warn('Failed to auto-dispatch updated link email:', emailErr);
        }
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === editingBooking.id
            ? { ...b, meeting_link: manualMeetingLink, booking_status: 'CONFIRMED' }
            : b
        )
      );
      setEditingBooking(null);
      alert(`Meeting link successfully updated${emailNotice || '!'}`);
    } catch (err: any) {
      alert(`Error updating meeting link: ${err.message}`);
    } finally {
      setIsSavingLink(false);
    }
  };

  const resendEmail = async (id: string) => {
    try {
      setIsResending(id);
      const targetBooking = bookings.find((b) => b.id === id);
      const res = await fetch('/api/admin/resend-booking-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          isUpdatedLink: true,
          meetingLink: targetBooking?.meeting_link
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend email');
      alert('Email with updated meeting link successfully resent to customer!');
    } catch (err: any) {
      alert(`Error resending email: ${err.message}`);
    } finally {
      setIsResending(null);
    }
  };

  const cancelBooking = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirm) return;

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          booking_status: 'CANCELLED'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, booking_status: 'CANCELLED' } : b))
      );
      alert('Booking marked as CANCELLED.');
    } catch (err: any) {
      alert(`Error cancelling booking: ${err.message}`);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const status = b.booking_status?.toUpperCase();
    const matchesStatus =
      statusFilter === 'ALL' ||
      status === statusFilter ||
      (statusFilter === 'PENDING' && (status === 'PENDING' || status === 'PENDING_PAYMENT'));
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.customer_email?.toLowerCase().includes(q) ||
      b.id?.toLowerCase().includes(q) ||
      b.order_id?.toLowerCase().includes(q) ||
      b.notes?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const confirmedCount = bookings.filter((b) => b.booking_status === 'CONFIRMED').length;
  const pendingCount = bookings.filter(
    (b) => b.booking_status === 'PENDING' || b.booking_status === 'PENDING_PAYMENT'
  ).length;
  const cancelledCount = bookings.filter((b) => b.booking_status === 'CANCELLED').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Coaching Calendar & Bookings Manager
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Real-time client appointments, coach availability hours, and Google Meet video links.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-800' : 'text-stone-500'}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh List'}</span>
        </button>
      </div>

      {/* Coach Availability Overview Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider">
              Lead Coach Schedule
            </span>
            <h3 className="font-serif text-xl font-semibold text-stone-900">
              {coach.name} ({coach.title})
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            Session Length: {coach.session_duration_minutes} Minutes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
            <span className="font-semibold text-stone-900 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-rose-800" /> Operating Days:
            </span>
            <p className="text-stone-600">{coach.available_days.join(', ')}</p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
            <span className="font-semibold text-stone-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-800" /> Operating Daily Hours:
            </span>
            <p className="text-stone-600">
              {coach.available_hours.map((h) => `${h.start} - ${h.end}`).join(' • ')} (EAT)
            </p>
          </div>
        </div>
      </div>

      {/* Bookings Ledger */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Ledger Header with Stats & Filter */}
        <div className="p-6 border-b border-stone-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-lg font-semibold text-stone-900">Live Client Bookings</h3>
              <span className="text-xs text-stone-500 font-medium bg-stone-100 px-2.5 py-1 rounded-full">
                {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
              </span>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-medium text-stone-600 self-start md:self-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-stone-900 shadow-sm font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                All ({bookings.length})
              </button>
              <button
                onClick={() => setStatusFilter('CONFIRMED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'CONFIRMED'
                    ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                Confirmed ({confirmedCount})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'PENDING'
                    ? 'bg-white text-amber-800 shadow-sm font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('CANCELLED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'CANCELLED'
                    ? 'bg-white text-rose-800 shadow-sm font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by client name, email, booking reference, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 transition"
            />
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 mx-6 my-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bookings List */}
        <div className="divide-y divide-stone-100 text-xs">
          {loading && (
            <div className="p-16 text-center text-stone-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-800" />
              <p>Fetching appointments from database...</p>
            </div>
          )}

          {!loading && filteredBookings.length === 0 && (
            <div className="p-16 text-center text-stone-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-50 text-stone-400 mx-auto flex items-center justify-center border border-stone-200">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-semibold text-stone-800">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'No matching bookings found'
                    : 'No Client Bookings Yet'}
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'Try clearing your search query or switching status filters.'
                    : 'When clients book a 1-on-1 session or custom coaching appointment, their live bookings will appear here.'}
                </p>
              </div>
            </div>
          )}

          {!loading &&
            filteredBookings.map((b) => {
              const isConfirmed = b.booking_status === 'CONFIRMED';
              const isCancelled = b.booking_status === 'CANCELLED';

              return (
                <div
                  key={b.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-stone-50/50 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isCancelled
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.booking_status || 'CONFIRMED'}
                      </span>
                      <span className="text-stone-400 font-mono text-[11px]">{b.id}</span>
                      {b.order_id && (
                        <span className="text-[10px] text-stone-400 font-mono bg-stone-100 px-1.5 py-0.5 rounded">
                          Order: {b.order_id}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-serif text-base font-semibold text-stone-900">
                        {b.customer_name || 'Client'}{' '}
                        <span className="font-sans text-xs text-stone-500 font-normal">
                          ({b.customer_email || 'No email provided'})
                        </span>
                      </h4>
                      {b.notes && (
                        <p className="text-stone-600 italic mt-0.5 bg-stone-50 p-2 rounded-xl border border-stone-100">
                          &ldquo;{b.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-stone-600">
                      <span className="flex items-center gap-1 font-medium text-stone-900">
                        <CalendarIcon className="w-3.5 h-3.5 text-rose-800" /> {b.scheduled_date}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-stone-900">
                        <Clock className="w-3.5 h-3.5 text-rose-800" /> {b.start_time} - {b.end_time} ({b.timezone || 'EAT'})
                      </span>
                      {b.coach_name && (
                        <span className="flex items-center gap-1 text-stone-500">
                          <UserCheck className="w-3.5 h-3.5 text-stone-400" /> Coach: {b.coach_name}
                        </span>
                      )}
                    </div>

                    {b.meeting_link && (
                      <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-800">
                        <Video className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <a
                          href={b.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-mono text-emerald-800 hover:text-emerald-950 truncate max-w-md"
                        >
                          {b.meeting_link}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEditMeetingLink(b)}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition"
                    >
                      {b.meeting_link ? 'Edit Meeting Link' : 'Set Meeting Link'}
                    </button>

                    <button
                      onClick={() => resendEmail(b.id)}
                      disabled={isResending === b.id}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-rose-800 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isResending === b.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                      <span>Resend Email</span>
                    </button>

                    {!isCancelled && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="px-3.5 py-2 rounded-xl border border-stone-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Manual Meeting Link Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-stone-200 shadow-2xl space-y-5">
            <h3 className="font-serif text-xl font-semibold text-stone-900">
              Configure Video Meeting Link
            </h3>
            <p className="text-xs text-stone-500">
              Set the Google Meet or video conferencing URL for client{' '}
              <strong>{editingBooking.customer_name}</strong>.
            </p>

            <form onSubmit={saveMeetingLink} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Meeting URL</label>
                <input
                  type="url"
                  required
                  value={manualMeetingLink}
                  onChange={(e) => setManualMeetingLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-rose-800/20 focus:border-rose-800 outline-none"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <label className="flex items-center gap-2.5 text-stone-700 cursor-pointer pt-1 bg-rose-50/60 p-3 rounded-xl border border-rose-200/60">
                <input
                  type="checkbox"
                  checked={notifyCustomerOnSave}
                  onChange={(e) => setNotifyCustomerOnSave(e.target.checked)}
                  className="rounded border-stone-300 text-rose-800 focus:ring-rose-800 h-4 w-4"
                />
                <span className="text-xs font-medium text-rose-950">
                  Email updated meeting link to client immediately
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isSavingLink}
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLink}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 shadow transition flex items-center gap-1.5"
                >
                  {isSavingLink && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingLink ? 'Saving...' : 'Save Meeting Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
