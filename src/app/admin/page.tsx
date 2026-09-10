import Link from 'next/link';
import {
  Users,
  CreditCard,
  BookOpen,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';
import { store } from '@/lib/store';

export default function AdminOverviewPage() {
  const services = store.getServices();
  const orders = store.orders;
  const bookings = store.bookings;
  const entitlements = store.entitlements;
  const cms = store.cms;

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'SUCCESSFUL')
    .reduce((acc, o) => acc + o.amount, 0);

  const successfulPayments = orders.filter((o) => o.payment_status === 'SUCCESSFUL').length;
  const pendingPayments = orders.filter((o) => o.payment_status === 'PENDING').length;
  const failedPayments = orders.filter((o) => o.payment_status === 'FAILED').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Platform Command Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Real-time telemetry across Selar transactions, enrollments, bookings, and content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/services"
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Service</span>
          </Link>

          <a
            href={cms.contact.selar_store_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Selar Store</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Total Gross Revenue</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900">
            KES {totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Processed via Selar Gateway</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Successful Transactions</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900">
            {successfulPayments}
          </p>
          <span className="text-[11px] text-stone-500">
            {pendingPayments} Pending • {failedPayments} Failed
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Active Enrollments</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900">
            {entitlements.length}
          </p>
          <span className="text-[11px] text-stone-500">Guided & Custom Programmes</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>1-on-1 Sessions</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-3xl font-bold text-stone-900">
            {bookings.length}
          </p>
          <span className="text-[11px] text-stone-500">Anti-Double Booking Active</span>
        </div>
      </div>

      {/* Two Columns: Recent Transactions & Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Orders / Selar Transactions */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Recent Selar Transactions
              </h3>
              <p className="text-xs text-stone-500">Real-time payment logs and entitlement status</p>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-semibold text-rose-800 hover:text-rose-950 flex items-center gap-1"
            >
              <span>Full Reconciliation</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-900">{order.customer_name}</span>
                    <span className="text-stone-400 font-mono text-[11px]">{order.customer_email}</span>
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    {order.service_name} • Selar Ref: <span className="font-mono">{order.transaction_reference}</span>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-serif font-bold text-stone-900 block">
                    {order.currency} {order.amount.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                      order.payment_status === 'SUCCESSFUL'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Offerings & Quick Navigation */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-semibold text-stone-900 border-b border-stone-100 pb-3">
              Services & Selar Product Mappings
            </h3>

            <div className="space-y-3 text-xs">
              {services.map((s) => (
                <div key={s.id} className="p-3 bg-stone-50 rounded-xl space-y-1 border border-stone-100">
                  <div className="flex justify-between font-semibold text-stone-900">
                    <span className="truncate max-w-[180px]">{s.name}</span>
                    <span className="text-rose-950 font-serif font-bold">
                      KES {s.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>Selar ID: <code className="font-mono text-rose-900">{s.selar_product_id || 'v09683c927'}</code></span>
                    <span className="text-emerald-700">Active</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/admin/services"
              className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold text-center block transition"
            >
              Manage Services & Selar Products →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-rose-950 to-stone-900 text-white p-6 rounded-3xl shadow-md space-y-3">
            <h4 className="font-serif text-base font-semibold">CMS Website Editor</h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              Modify hero headings, about mission, testimonials, and FAQs live without editing code.
            </p>
            <Link
              href="/admin/cms"
              className="inline-block px-4 py-2 rounded-xl bg-white text-stone-950 text-xs font-semibold hover:bg-amber-100 transition shadow"
            >
              Open Website CMS →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
