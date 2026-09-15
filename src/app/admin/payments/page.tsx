'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowDownRight,
  FileText
} from 'lucide-react';
import { Order, PaymentStatus } from '@/types';
import { createBrowserClient } from '@/utils/supabase/client';

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Manual verification modal state
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [manualReason, setManualReason] = useState('Customer confirmed payment via Selar dashboard receipt.');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchOrders = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.transaction_reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || o.payment_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingOrder) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: verifyingOrder.id,
          transactionReference: verifyingOrder.transaction_reference,
          manualByAdmin: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        await fetchOrders();
      }
    } finally {
      setIsProcessing(false);
      setVerifyingOrder(null);
    }
  };

  const handleRefund = async (order: Order) => {
    const confirm = window.confirm(`Are you sure you want to refund order ${order.order_reference}? Access will be revoked.`);
    if (!confirm) return;

    const supabase = createBrowserClient();
    await supabase.from('orders').update({
      payment_status: 'REFUNDED',
      updated_at: new Date().toISOString()
    }).eq('id', order.id);

    // Refresh orders
    await fetchOrders();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          Selar Transactions & Payment Reconciliation
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Audit server-side payment confirmations, verify transactions idempotently, and manage refunds.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, customer name, email, or Selar tx ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-stone-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Recorded Transactions</h3>
          <span className="text-xs text-stone-500">{filteredOrders.length} Matching Orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Service / Selar Product</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredOrders.map((order) => {

                return (
                  <tr key={order.id} className="hover:bg-stone-50/60 transition">
                    <td className="p-4 font-mono font-semibold text-stone-900">
                      {order.order_reference}
                      <span className="block text-[10px] text-stone-400 font-mono">
                        Tx: {order.transaction_reference}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-stone-900">{order.customer_name}</p>
                      <p className="text-[11px] text-stone-500">{order.customer_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-stone-900">{order.service_name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        Selar: {order.selar_product_id || 'v09683c927'}
                      </p>
                    </td>
                    <td className="p-4 font-serif font-bold text-stone-900">
                      {order.currency} {order.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                          order.payment_status === 'SUCCESSFUL'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.payment_status === 'REFUNDED'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-stone-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {order.payment_status !== 'SUCCESSFUL' && order.payment_status !== 'REFUNDED' && (
                        <button
                          onClick={() => setVerifyingOrder(order)}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-[11px] font-semibold hover:bg-rose-950 transition"
                        >
                          Verify Payment
                        </button>
                      )}

                      {order.payment_status === 'SUCCESSFUL' && (
                        <button
                          onClick={() => handleRefund(order)}
                          className="px-3 py-1.5 rounded-lg border border-stone-200 text-rose-800 hover:bg-rose-50 text-[11px] font-medium transition"
                        >
                          Refund & Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Verification Modal with Audit Requirement */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-stone-200 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Manual Payment Verification
              </h3>
              <p className="text-xs text-stone-500">
                Authorizing an order manually requires an audit explanation.
              </p>
            </div>

            <form onSubmit={handleManualVerify} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1 text-stone-700">
                <p>Order: <strong>{verifyingOrder.order_reference}</strong></p>
                <p>Customer: {verifyingOrder.customer_name} ({verifyingOrder.customer_email})</p>
                <p>Amount: {verifyingOrder.currency} {verifyingOrder.amount.toLocaleString()}</p>
                <p>Transaction Ref: <code className="font-mono">{verifyingOrder.transaction_reference}</code></p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800">Admin Authorization Reason</label>
                <textarea
                  rows={3}
                  required
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  placeholder="Explain why this payment is confirmed (e.g. M-Pesa SMS confirmation code, Selar receipt)..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setVerifyingOrder(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 transition shadow disabled:opacity-50"
                >
                  {isProcessing ? 'Verifying...' : 'Authorize & Unlock Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
