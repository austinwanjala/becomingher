'use client';

import { useState } from 'react';
import { Users, Search, BookOpen, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { store } from '@/lib/store';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');

  // Roster of customers
  const customers = [
    {
      id: 'cust-demo-01',
      name: 'Grace Mwangi',
      email: 'grace@example.com',
      phone: '+254 712 345 678',
      role: 'CUSTOMER',
      programmes: ['Guided Digital Coaching Programme'],
      sessions: 1,
      totalSpent: 1000,
      joined: '2026-09-01'
    },
    {
      id: 'cust-demo-02',
      name: 'Dr. Sarah K.',
      email: 'sarah.k@example.com',
      phone: '+254 722 987 654',
      role: 'CUSTOMER',
      programmes: ['Customized Digital Coaching'],
      sessions: 0,
      totalSpent: 1500,
      joined: '2026-09-05'
    },
    {
      id: 'cust-demo-03',
      name: 'Wanjiku N.',
      email: 'wanjiku@example.com',
      phone: '+254 733 456 789',
      role: 'CUSTOMER',
      programmes: ['Interpersonal Coaching Session'],
      sessions: 2,
      totalSpent: 5000,
      joined: '2026-08-20'
    }
  ];

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          Client Sanctuary Roster
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Manage enrolled members, purchased programmes, and coaching engagement history.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or email address..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Registered Members</h3>
          <span className="text-xs text-stone-500">{filtered.length} Customers</span>
        </div>

        <div className="divide-y divide-stone-100 text-xs text-stone-700">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/50 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-base font-semibold text-stone-900">{c.name}</h4>
                  <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded font-mono text-stone-600">
                    {c.role}
                  </span>
                </div>
                <p className="text-stone-500">{c.email} • {c.phone}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-600 pt-1">
                  <span>Enrolled: <strong>{c.programmes.join(', ')}</strong></span>
                  <span>1-on-1 Sessions: <strong>{c.sessions}</strong></span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-stone-500 block">Total Invested</span>
                <span className="font-serif text-base font-bold text-rose-950">
                  KES {c.totalSpent.toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Joined {c.joined}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
