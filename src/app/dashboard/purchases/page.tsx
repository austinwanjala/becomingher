'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Gem,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { Order } from '@/types';
import { createBrowserClient } from '@/utils/supabase/client';

export default function PurchasesDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };
    
    fetchOrders();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          Purchases & Official Receipts
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Permanent ledger of your investments, Selar transaction references, and digital tax receipts.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Order History</h3>
          <span className="text-xs text-stone-500 font-medium">
            {loading ? 'Loading...' : `${orders.length} Purchases`}
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {order.payment_status}
                  </span>
                  <span className="text-xs font-mono text-stone-500">{order.order_reference}</span>
                </div>
                <h4 className="font-serif text-base font-semibold text-stone-900">
                  {order.service_name}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                  <span>Provider: {order.payment_provider}</span>
                  <span>Tx Ref: <code className="font-mono text-stone-700">{order.transaction_reference}</code></span>
                  <span>Date: {new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Total Paid</span>
                  <span className="font-serif text-lg font-bold text-rose-950">
                    {order.currency} {order.amount.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReceipt(order)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Receipt</span>
                </button>
              </div>
            </div>
          ))}

          {!loading && orders.length === 0 && (
            <div className="p-12 text-center text-xs text-stone-500">
              No purchase records found.
            </div>
          )}
          {loading && (
            <div className="p-12 text-center text-xs text-stone-500 animate-pulse">
              Loading purchase records...
            </div>
          )}
        </div>
      </div>

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 border border-stone-200 shadow-2xl space-y-6 relative print:p-0 print:border-none print:shadow-none">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-2 border-b border-stone-200 pb-6">
              <div className="w-10 h-10 rounded-full bg-rose-950 text-white flex items-center justify-center mx-auto shadow">
                <Gem className="w-5 h-5 text-amber-200" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">Becoming Her</h3>
              <p className="text-xs text-stone-500 uppercase tracking-widest">
                Official Digital Service Receipt
              </p>
            </div>

            {/* Details Grid */}
            <div className="space-y-3 text-xs text-stone-700">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Customer Name:</span>
                <span className="font-semibold text-stone-900">{selectedReceipt.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Customer Email:</span>
                <span className="font-mono text-stone-800">{selectedReceipt.customer_email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Service Acquired:</span>
                <span className="font-medium text-stone-900 text-right">{selectedReceipt.service_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Order Reference:</span>
                <span className="font-mono font-bold text-stone-900">{selectedReceipt.order_reference}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Selar Transaction Ref:</span>
                <span className="font-mono text-stone-700">{selectedReceipt.transaction_reference}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Payment Gateway:</span>
                <span className="font-medium text-stone-900">Selar (M-Pesa / Card)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Payment Date:</span>
                <span>{new Date(selectedReceipt.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-semibold text-stone-900">
                <span>Amount Paid:</span>
                <span className="font-serif text-lg text-rose-950">
                  {selectedReceipt.currency} {selectedReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-emerald-700">
                <span>Transaction Status:</span>
                <span className="font-bold">✓ Confirmed & Entitlement Active</span>
              </div>
            </div>

            {/* Receipt Footer note */}
            <div className="text-center pt-4 border-t border-stone-200 text-[11px] text-stone-500">
              <p>Becoming Her Digital Sanctuary • Founded by Zipporah Karanja</p>
              <p>Questions? Reach out to hello@becomingher.co.ke</p>
            </div>

            {/* Print Action Buttons */}
            <div className="flex gap-3 pt-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center justify-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print or Save PDF</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-3 rounded-xl bg-stone-100 text-stone-700 text-xs font-medium hover:bg-stone-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
