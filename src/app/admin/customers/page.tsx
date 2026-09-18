'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, RefreshCw, UserCheck } from 'lucide-react';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = () => {
    setIsLoading(true);
    setError(null);
    fetch('/api/admin/customers')
      .then((res) => res.json())
      .then((data) => {
        if (data.customers) setCustomers(data.customers);
        if (data.error) setError(data.error);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.programmes?.some((p: string) => p.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Client Sanctuary Roster
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Manage enrolled members, purchased programmes, and coaching engagement history.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-rose-800' : 'text-stone-500'}`} />
          <span>{isLoading ? 'Refreshing...' : 'Refresh Roster'}</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, email address, or enrolled programme..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-lg font-semibold text-stone-900">Registered Members</h3>
            <span className="text-xs text-stone-500 font-medium bg-stone-100 px-2.5 py-1 rounded-full">
              {isLoading ? 'Loading...' : `${filtered.length} Customers`}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 text-xs text-center border-b border-rose-100">
            Error loading customers: {error}
          </div>
        )}

        <div className="divide-y divide-stone-100 text-xs text-stone-700">
          {isLoading && customers.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-800" />
              <p>Loading member records from sanctuary ledger...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p>No customers match your search criteria.</p>
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/50 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-base font-semibold text-stone-900">{c.name}</h4>
                    <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded font-mono text-stone-600 uppercase">
                      {c.role}
                    </span>
                  </div>
                  <p className="text-stone-500">{c.email} • {c.phone}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-600 pt-1">
                    <span>Enrolled: <strong>{c.programmes?.length > 0 ? c.programmes.join(', ') : 'None'}</strong></span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                        c.sessions > 0
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      1-on-1 Sessions: <strong>{c.sessions}</strong>
                    </span>
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
                    KES {Number(c.totalSpent || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Joined {c.joined}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
