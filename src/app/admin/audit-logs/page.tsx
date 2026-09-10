'use client';

import { useState } from 'react';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';
import { store } from '@/lib/store';
import { AuditLog } from '@/types';

export default function AdminAuditLogsPage() {
  const [logs] = useState<AuditLog[]>(store.auditLogs);
  const [search, setSearch] = useState('');

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          System Security & Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Immutable logging of administrative interventions, manual payment verifications, and content alterations.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit logs by action, resource, or details..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Recorded Operations</h3>
          <span className="text-xs text-stone-500">{filtered.length} Entries Logged</span>
        </div>

        <div className="divide-y divide-stone-100 text-xs text-stone-700">
          {filtered.map((log) => (
            <div key={log.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-rose-950 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-stone-400 text-[11px]">[{log.resource}]</span>
                </div>
                <p className="text-stone-800">{log.details}</p>
                <p className="text-[10px] text-stone-400">Initiator: {log.user_email}</p>
              </div>

              <div className="text-right text-[11px] text-stone-400 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-10 text-center text-xs text-stone-400">No logs matching search criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
}
