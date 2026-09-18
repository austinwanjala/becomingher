'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowDownRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Order } from '@/types';

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    successfulCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    failedCount: 0,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Manual verification modal state
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [manualReason, setManualReason] = useState('Customer confirmed payment via Selar dashboard receipt.');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch payments');

      if (data.orders) setOrders(data.orders as Order[]);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err: any) {
      console.error('Error fetching admin payments:', err);
      setError(err.message || 'An error occurred while loading payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtered orders with robust null-safety
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (o.order_reference && o.order_reference.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.service_name && o.service_name.toLowerCase().includes(q)) ||
      (o.transaction_reference && o.transaction_reference.toLowerCase().includes(q));

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
        alert('Payment successfully verified and services unlocked for the client.');
        await fetchOrders();
      } else {
        alert(`Verification notice: ${data.error || 'Could not verify payment'}`);
      }
    } catch (err: any) {
      alert(`Error verifying payment: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setVerifyingOrder(null);
    }
  };

  const handleRefund = async (order: Order) => {
    const confirm = window.confirm(
      `Are you sure you want to refund order ${order.order_reference}? Service entitlements will be revoked.`
    );
    if (!confirm) return;

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentStatus: 'REFUNDED',
          notes: 'Refunded via Admin Portal'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');

      alert(`Order ${order.order_reference} marked as REFUNDED and entitlements revoked.`);
      await fetchOrders();
    } catch (err: any) {
      alert(`Error processing refund: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Selar Transactions & Payment Reconciliation
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Live payment audits, gross collected revenue, idempotent verification, and access revocation.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-800' : 'text-stone-500'}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Payments'}</span>
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-900">Total Collected</span>
            <DollarSign className="w-4 h-4 text-rose-800" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-900">
            KES {metrics.totalRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500">Across {metrics.successfulCount} settled transactions</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Successful</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-700">
            {metrics.successfulCount}
          </div>
          <p className="text-[11px] text-stone-500">Active customer orders</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Pending Verification</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-amber-700">
            {metrics.pendingCount}
          </div>
          <p className="text-[11px] text-stone-500">Awaiting Selar webhook or approval</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">Refunded / Revoked</span>
            <ArrowDownRight className="w-4 h-4 text-stone-500" />
          </div>
          <div className="font-serif text-2xl font-bold text-stone-700">
            {metrics.refundedCount}
          </div>
          <p className="text-[11px] text-stone-500">Revoked platform access</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ref, customer name, email, product, or Selar tx ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-stone-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-1 focus:ring-stone-900"
          >
            <option value="ALL">All Payment Statuses ({orders.length})</option>
            <option value="SUCCESSFUL">Successful ({metrics.successfulCount})</option>
            <option value="PENDING">Pending ({metrics.pendingCount})</option>
            <option value="REFUNDED">Refunded ({metrics.refundedCount})</option>
            <option value="FAILED">Failed ({metrics.failedCount})</option>
          </select>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Recorded Transactions</h3>
          <span className="text-xs text-stone-500 font-medium bg-stone-100 px-2.5 py-1 rounded-full">
            {loading ? 'Loading...' : `${filteredOrders.length} Matching Orders`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Service / Product</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-800" />
                    <p>Loading real-time transactions from Supabase ledger...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-stone-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p>No orders match the selected filter or search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/60 transition">
                      <td className="p-4 font-mono font-semibold text-stone-900">
                        {order.order_reference}
                        {order.transaction_reference && (
                          <span className="block text-[10px] text-stone-400 font-mono">
                            Tx: {order.transaction_reference}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-stone-900">{order.customer_name || 'Client'}</p>
                        <p className="text-[11px] text-stone-500">{order.customer_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-stone-900">{order.service_name}</p>
                        {order.selar_product_id && (
                          <p className="text-[10px] text-stone-400 font-mono">
                            Selar: {order.selar_product_id}
                          </p>
                        )}
                      </td>
                      <td className="p-4 font-serif font-bold text-stone-900">
                        {order.currency || 'KES'} {Number(order.amount || 0).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                            order.payment_status === 'SUCCESSFUL'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.payment_status === 'REFUNDED'
                              ? 'bg-stone-100 text-stone-600 border border-stone-200'
                              : order.payment_status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="p-4 text-stone-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {order.payment_status !== 'SUCCESSFUL' && order.payment_status !== 'REFUNDED' && (
                          <button
                            onClick={() => setVerifyingOrder(order)}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-[11px] font-semibold hover:bg-rose-950 transition shadow-sm"
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
                })
              )}
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
                <p>Amount: {verifyingOrder.currency || 'KES'} {Number(verifyingOrder.amount || 0).toLocaleString()}</p>
                <p>Transaction Ref: <code className="font-mono">{verifyingOrder.transaction_reference || 'N/A'}</code></p>
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
