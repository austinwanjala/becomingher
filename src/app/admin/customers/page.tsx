'use client';

import { useState, useEffect } from 'react';
import { Users, Search, BookOpen, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { store } from '@/lib/store';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');

  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(res => res.json())
      .then(data => {
        if (data.customers) setCustomers(data.customers);
        if (data.error) setError(data.error);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

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
          <span className="text-xs text-stone-500">{isLoading ? 'Loading...' : `${filtered.length} Customers`}</span>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 text-xs text-center border-b border-rose-100">
            Error loading customers: {error}
          </div>
        )}

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
                  <span>Enrolled: <strong>{c.programmes?.join(', ') || 'None'}</strong></span>
                  <span>1-on-1 Sessions: <strong>{c.sessions}</strong></span>
                </div>
                {c.questionnaires && c.questionnaires.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {c.questionnaires.map((q: any, i: number) => (
                      <a
                        key={i}
                        href={q.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-semibold border border-green-200 hover:bg-green-100 transition shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Filled Questionnaire ({q.service})</span>
                      </a>
                    ))}
                  </div>
                )}
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
