'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { store } from '@/lib/store';
import { Booking } from '@/types';
import { createClient } from '@/utils/supabase/client';

export default function SessionsDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Deletion state
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadUserSessions = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch via client or fallback
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .or(`customer_id.eq.${user.id},customer_email.eq.${user.email}`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setBookings(data as Booking[]);
        } else {
          // Fallback check in store by email/id
          const storeMatched = store.bookings.filter(
            (b) =>
              b.customer_id === user.id ||
              (user.email && b.customer_email?.toLowerCase() === user.email.toLowerCase())
          );
          setBookings(storeMatched);
        }
      } else {
        setBookings(store.bookings.filter((b) => b.customer_id === 'cust-demo-01'));
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserSessions();
  }, []);

  // Handler to delete an unverified meeting
  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;

    setIsDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/bookings?id=${encodeURIComponent(bookingToDelete.id)}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete scheduled meeting.');
      }

      // Update state locally
      setBookings((prev) => prev.filter((b) => b.id !== bookingToDelete.id));
      setSuccessMessage('Scheduled meeting removed successfully. The reserved time slot has been released.');
      setBookingToDelete(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while deleting the meeting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            My 1-on-1 Coaching Sessions
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Confidential daytime video mentorship sessions with Lead Coach Zipporah Karanja.
          </p>
        </div>

        <Link
          href="/services/interpersonal-coaching"
          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-2 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Book Another Session</span>
        </Link>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 ml-4 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-700 hover:text-rose-900 ml-4 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-800" />
          <p className="text-xs text-stone-500">Loading your coaching appointments...</p>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const isConfirmed =
            booking.booking_status === 'CONFIRMED' && booking.payment_status === 'SUCCESSFUL';

          return (
            <div
              key={booking.id}
              className={`bg-white p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition ${
                isConfirmed ? 'border-stone-200' : 'border-amber-200/80 bg-amber-50/15'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isConfirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 font-medium'
                    }`}
                  >
                    {isConfirmed ? 'Paid & Confirmed' : 'Payment Not Verified'}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">Ref: {booking.id}</span>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-semibold text-stone-900">
                    Daytime Mentorship with {booking.coach_name}
                  </h3>
                  {booking.notes && (
                    <p className="text-xs text-stone-500 italic mt-0.5">
                      Focus: "{booking.notes}"
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                  <span className="flex items-center gap-1.5 font-medium text-stone-900">
                    <Calendar className="w-4 h-4 text-rose-800" />
                    {booking.scheduled_date}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-stone-900">
                    <Clock className="w-4 h-4 text-rose-800" />
                    {booking.start_time} - {booking.end_time} ({booking.timezone})
                  </span>
                </div>
              </div>

              {/* Action / Meeting Link (Confirmed vs Unverified) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {isConfirmed && booking.meeting_link ? (
                  <a
                    href={booking.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition flex items-center justify-center gap-2 shadow"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Google Meet Room</span>
                  </a>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-500 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Meeting link unlocks upon verified payment.</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/checkout/${booking.service_id || 'srv-interpersonal-03'}`}
                        className="px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center justify-center gap-1.5 shadow-sm text-center flex-1 sm:flex-initial"
                      >
                        <span>Retry Payment</span>
                      </Link>

                      <button
                        onClick={() => setBookingToDelete(booking)}
                        className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        title="Delete this unverified scheduled meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!loading && bookings.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
            <p className="text-xs text-stone-500">You have no booked coaching sessions yet.</p>
            <Link
              href="/services/interpersonal-coaching"
              className="inline-block px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition"
            >
              Schedule a 1-on-1 Session
            </Link>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deleting Unverified Meeting */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Delete Scheduled Meeting?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                This meeting for{' '}
                <strong className="text-stone-900 font-medium">
                  {bookingToDelete.scheduled_date} at {bookingToDelete.start_time} ({bookingToDelete.timezone})
                </strong>{' '}
                has unverified payment status. Deleting it will permanently remove the booking and release the held time slot so another member can book it.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBookingToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition text-xs font-medium disabled:opacity-50"
              >
                Keep Meeting
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Meeting'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
