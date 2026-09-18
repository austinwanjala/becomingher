'use client';

import { useState } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, DollarSign, Percent } from 'lucide-react';
import { store } from '@/lib/store';
import { Coupon } from '@/types';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(store.coupons);
  const [isCreating, setIsCreating] = useState(false);

  // Form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [minSpend, setMinSpend] = useState(3000);
  const [usageLimit, setUsageLimit] = useState(100);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      id: `cp-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      min_spend: minSpend,
      times_used: 0,
      usage_limit: usageLimit,
      is_active: true
    };

    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    store.coupons = updated;
    store.addAuditLog('COUPON_CREATED', 'COUPONS', `Coupon ${newCoupon.code} created`);
    setIsCreating(false);
    setCode('');
  };

  const toggleActive = (id: string) => {
    const updated = coupons.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c));
    setCoupons(updated);
    store.coupons = updated;
  };

  const handleDeleteCoupon = (id: string, code: string) => {
    const confirm = window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`);
    if (!confirm) return;

    const updated = coupons.filter((c) => c.id !== id);
    setCoupons(updated);
    store.coupons = updated;
    store.addAuditLog('COUPON_DELETED', 'COUPONS', `Coupon ${code} deleted`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Coupons & Promotional Passes
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Create percentage or fixed discounts in KES applied at checkout.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Active Coupons</h3>
          <span className="text-xs text-stone-500">{coupons.length} Registered</span>
        </div>

        <div className="divide-y divide-stone-100 text-xs text-stone-700">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    {c.code}
                  </span>
                  <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded font-medium text-stone-600">
                    {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `KES ${c.discount_value} OFF`}
                  </span>
                </div>
                <p className="text-stone-500">
                  Min spend: KES {c.min_spend?.toLocaleString()} • Used: {c.times_used} / {c.usage_limit || '∞'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    c.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {c.is_active ? 'Active' : 'Disabled'}
                </button>

                <button
                  onClick={() => handleDeleteCoupon(c.id, c.code)}
                  className="p-2 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 border border-stone-200 transition"
                  title="Delete Coupon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-stone-200 shadow-2xl space-y-5">
            <h3 className="font-serif text-xl font-semibold text-stone-900">Create New Coupon Code</h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SISTERHOOD20"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-stone-700">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (KES)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-stone-700">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-medium text-stone-700">Minimum Spend (KES)</label>
                  <input
                    type="number"
                    value={minSpend}
                    onChange={(e) => setMinSpend(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-stone-700">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 shadow"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
