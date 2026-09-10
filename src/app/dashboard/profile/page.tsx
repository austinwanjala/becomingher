'use client';

import { useState } from 'react';
import { User, Mail, Phone, Lock, Bell, Check, Save } from 'lucide-react';

export default function ProfileDashboardPage() {
  const [name, setName] = useState('Grace Mwangi');
  const [email, setEmail] = useState('grace@example.com');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [notifications, setNotifications] = useState({
    sessionReminders: true,
    weeklyJournalPrompts: true,
    newsletter: false
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          Personal Sanctuary Profile
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Manage your account credentials, contact information, and notifications.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <h3 className="font-serif text-lg font-semibold text-stone-900 border-b border-stone-100 pb-3">
            Account Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-stone-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Phone Number (M-Pesa / SMS)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-semibold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-800" />
            <span>Notification & Reminder Preferences</span>
          </h3>

          <div className="space-y-3 text-xs text-stone-700">
            <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 cursor-pointer">
              <span>Send 24-hour and 1-hour coaching session reminders via SMS & Email</span>
              <input
                type="checkbox"
                checked={notifications.sessionReminders}
                onChange={(e) =>
                  setNotifications({ ...notifications, sessionReminders: e.target.checked })
                }
                className="rounded text-rose-900 focus:ring-rose-900"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 cursor-pointer">
              <span>Receive weekly inspirational journaling prompts from AI Assistant</span>
              <input
                type="checkbox"
                checked={notifications.weeklyJournalPrompts}
                onChange={(e) =>
                  setNotifications({ ...notifications, weeklyJournalPrompts: e.target.checked })
                }
                className="rounded text-rose-900 focus:ring-rose-900"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-emerald-600 font-medium">
            {saved && '✓ Changes saved successfully!'}
          </span>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-2 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Update Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
