'use client';

import Link from 'next/link';
import { Calendar, Clock, Video, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { store } from '@/lib/store';

export default function SessionsDashboardPage() {
  const customerId = 'cust-demo-01';
  const bookings = store.bookings.filter((b) => b.customer_id === customerId);

  return (
    <div className="space-y-8">
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

      <div className="space-y-4">
        {bookings.map((booking) => {
          const isConfirmed = booking.booking_status === 'CONFIRMED' && booking.payment_status === 'SUCCESSFUL';

          return (
            <div
              key={booking.id}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isConfirmed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {booking.booking_status}
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

              {/* Action / Meeting Link (Only if paid & confirmed) */}
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
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-500 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Meeting link unlocks upon verified payment.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {bookings.length === 0 && (
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
    </div>
  );
}
