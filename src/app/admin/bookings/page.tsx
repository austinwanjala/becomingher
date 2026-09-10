'use client';

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  Plus,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { store } from '@/lib/store';
import { Booking } from '@/types';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(store.bookings);
  const [coach, setCoach] = useState(store.coach);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [manualMeetingLink, setManualMeetingLink] = useState('');

  const startEditMeetingLink = (booking: Booking) => {
    setEditingBooking(booking);
    setManualMeetingLink(booking.meeting_link || `https://meet.google.com/bch-${Math.random().toString(36).substring(2, 6)}`);
  };

  const saveMeetingLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    editingBooking.meeting_link = manualMeetingLink;
    editingBooking.booking_status = 'CONFIRMED';
    setBookings([...bookings]);
    store.addAuditLog('BOOKING_MEETING_LINK_UPDATED', 'BOOKINGS', `Meeting link set for booking ${editingBooking.id}`);
    setEditingBooking(null);
  };

  const cancelBooking = (id: string) => {
    const confirm = window.confirm('Cancel this booking? Customer will be notified.');
    if (!confirm) return;

    const updated = bookings.map((b) => (b.id === id ? { ...b, booking_status: 'CANCELLED' as const } : b));
    setBookings(updated);
    store.bookings = updated;
    store.addAuditLog('BOOKING_CANCELLED', 'BOOKINGS', `Booking ${id} cancelled by admin.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          Coaching Calendar & Bookings Manager
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Inspect client appointments, manage coach availability hours, and generate or override Google Meet links.
        </p>
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
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Session Bookings</h3>
          <span className="text-xs text-stone-500">{bookings.length} Bookings</span>
        </div>

        <div className="divide-y divide-stone-100 text-xs">
          {bookings.map((b) => {
            const isConfirmed = b.booking_status === 'CONFIRMED';

            return (
              <div
                key={b.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-stone-50/50 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isConfirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {b.booking_status}
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">{b.id}</span>
                  </div>

                  <div>
                    <h4 className="font-serif text-base font-semibold text-stone-900">
                      {b.customer_name} ({b.customer_email})
                    </h4>
                    {b.notes && <p className="text-stone-500 italic mt-0.5">Note: "{b.notes}"</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-stone-600">
                    <span className="flex items-center gap-1 font-medium text-stone-900">
                      <CalendarIcon className="w-3.5 h-3.5 text-rose-800" /> {b.scheduled_date}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-stone-900">
                      <Clock className="w-3.5 h-3.5 text-rose-800" /> {b.start_time} - {b.end_time} ({b.timezone})
                    </span>
                  </div>

                  {b.meeting_link && (
                    <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-700">
                      <Video className="w-3.5 h-3.5" />
                      <a href={b.meeting_link} target="_blank" rel="noopener noreferrer" className="underline font-mono">
                        {b.meeting_link}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditMeetingLink(b)}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition"
                  >
                    Edit Meeting Link
                  </button>

                  {b.booking_status !== 'CANCELLED' && (
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
              Set the Google Meet or video conferencing URL for this session.
            </p>

            <form onSubmit={saveMeetingLink} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Meeting URL</label>
                <input
                  type="url"
                  required
                  value={manualMeetingLink}
                  onChange={(e) => setManualMeetingLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 shadow"
                >
                  Save Meeting Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
