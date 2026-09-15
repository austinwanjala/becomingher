'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Star,
  ArrowRight,
  CreditCard,
  Lock,
  Tag,
  Loader2,
  Clock,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { store } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';
import { DisclaimerModal } from '@/components/DisclaimerModal';

export default function CheckoutPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const service = store.getServiceById(resolvedParams.serviceId);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+254 700 000 000');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);

  // Interpersonal booking states
  const [selectedDate, setSelectedDate] = useState('2026-09-22');
  const [selectedTime, setSelectedTime] = useState('11:00');
  const [bookingNotes, setBookingNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check authenticated session on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        setCustomerEmail(user.email || '');
        const metaName = user.user_metadata?.name || user.email?.split('@')[0] || 'Beloved Member';
        setCustomerName(metaName);
      }
      setAuthChecked(true);
    });
  }, []);

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl border border-stone-200">
            <h2 className="font-serif text-2xl font-semibold">Service Not Found</h2>
            <p className="text-sm text-stone-600">The selected coaching service could not be located.</p>
            <Link href="/services" className="inline-block px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium">
              View All Services
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const basePrice = service.price;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Apply Coupon handler
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const codeUpper = couponCode.trim().toUpperCase();
    const coupon = store.coupons.find((c) => c.code === codeUpper && c.is_active);

    if (coupon) {
      if (coupon.min_spend && basePrice < coupon.min_spend) {
        setCouponMessage(`Minimum spend of KES ${coupon.min_spend.toLocaleString()} required.`);
        return;
      }
      let discount = 0;
      if (coupon.discount_type === 'PERCENTAGE') {
        discount = (basePrice * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }
      setDiscountAmount(discount);
      setCouponMessage(`✓ Coupon applied! Saved KES ${discount.toLocaleString()}`);
    } else {
      setDiscountAmount(0);
      setCouponMessage('Invalid or expired coupon code.');
    }
  };

  // Submit checkout handler
  const handleCheckout = async (e: React.FormEvent, simulateInstantSuccess: boolean = false) => {
    e.preventDefault();
    setErrorMessage('');

    // Strictly enforce account creation before payment
    if (!currentUser) {
      setErrorMessage('An account is required before payment. Please create an account or sign in to continue.');
      router.push(`/register?redirect=${encodeURIComponent(`/checkout/${service.id}`)}`);
      return;
    }

    // Strictly enforce disclaimer acceptance before payment
    if (!isDisclaimerAccepted) {
      setErrorMessage('Please acknowledge the coaching disclaimer below before proceeding to payment.');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        serviceId: service.id,
        customerId: currentUser.id,
        customerName: customerName.trim() || currentUser.email,
        customerEmail: customerEmail.trim() || currentUser.email,
        customerPhone,
        couponCode: discountAmount > 0 ? couponCode : undefined,
        disclaimerAccepted: isDisclaimerAccepted
      };

      if (service.type === 'INTERPERSONAL_SESSION') {
        payload.bookingDetails = {
          scheduledDate: selectedDate,
          startTime: selectedTime,
          endTime: '12:00',
          timezone: 'Africa/Nairobi (EAT)',
          notes: bookingNotes
        };
      }

      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout initialization failed');
      }

      if (simulateInstantSuccess) {
        // Direct simulation for local verification without waiting for live card input
        await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.orderId,
            transactionReference: data.transactionReference
          })
        });

        router.push(`/payment/return?order_id=${data.orderId}&service_id=${service.id}`);
        return;
      }

      // In normal mode, redirect to the Selar checkout page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/payment/return?order_id=${data.orderId}&service_id=${service.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while processing checkout.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header Breadcrumb */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Link href="/services" className="hover:text-stone-900">Services</Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">Checkout</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
            Secure Your Coaching Journey
          </h1>
          <p className="text-sm text-stone-600">
            Complete your enrollment securely through our official Selar payment gateway.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-medium flex items-center justify-between gap-4">
            <span>{errorMessage}</span>
            {!currentUser && (
              <Link
                href={`/register?redirect=${encodeURIComponent(`/checkout/${service.id}`)}`}
                className="underline font-semibold text-rose-900 whitespace-nowrap"
              >
                Create Account Now →
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Customer Details & Booking Slot */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={(e) => handleCheckout(e, false)} className="space-y-8">
              
              {/* Account Status / Requirement Card */}
              {authChecked && (
                <div>
                  {currentUser ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                            <span>Account Verified</span>
                            <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-medium">Active Member</span>
                          </div>
                          <span className="text-emerald-700 text-[11px] block">
                            Logged in as {currentUser.email}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/login?redirect=${encodeURIComponent(`/checkout/${service.id}`)}`}
                        className="text-[11px] text-emerald-800 hover:text-emerald-950 underline font-medium"
                      >
                        Switch Account
                      </Link>
                    </div>
                  ) : (
                    <div className="p-6 rounded-3xl bg-amber-50/90 border border-amber-200/90 space-y-4 shadow-sm">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-sm">
                          <Lock className="w-5 h-5 text-amber-800" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-serif font-semibold text-stone-900 text-base">
                            Step 1: Create an Account Before Payment
                          </h4>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            An account is required so your purchased coaching modules, personal reflection companion, and calendar meeting links are immediately assigned to you upon payment confirmation.
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <Link
                          href={`/register?redirect=${encodeURIComponent(`/checkout/${service.id}`)}`}
                          className="flex-1 py-3 px-4 rounded-xl bg-rose-950 text-amber-50 text-xs font-semibold text-center hover:bg-stone-900 transition shadow flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Create Account First (1 Minute)</span>
                        </Link>
                        <Link
                          href={`/login?redirect=${encodeURIComponent(`/checkout/${service.id}`)}`}
                          className="flex-1 py-3 px-4 rounded-xl border border-stone-300 bg-white text-stone-800 text-xs font-semibold text-center hover:bg-stone-50 transition flex items-center justify-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Already have an account? Sign In</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Info Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    {currentUser ? '1. Customer Information' : '2. Customer Details'}
                  </h3>
                  <span className="text-xs text-stone-500">Coaching Profile</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-stone-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                      placeholder="e.g. Grace Mwangi"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">Email Address (For Access)</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                      placeholder="grace.mwangi@gmail.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-700">Phone (For M-Pesa / SMS)</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>
              </div>

              {/* Interpersonal Booking Calendar Slot (If 1-on-1 session) */}
              {service.type === 'INTERPERSONAL_SESSION' && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <h3 className="font-serif text-lg font-semibold text-stone-900">
                      Select Session Date & Time
                    </h3>
                    <span className="text-xs text-rose-800 font-medium">15-Min Temporary Hold</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700">Coaching Date</label>
                      <input
                        type="date"
                        required
                        min="2026-09-11"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-700">Available Time Slot</label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-950/20 bg-white"
                      >
                        <option value="09:00">09:00 AM - 10:00 AM (EAT)</option>
                        <option value="11:00">11:00 AM - 12:00 PM (EAT)</option>
                        <option value="14:00">02:00 PM - 03:00 PM (EAT)</option>
                        <option value="16:00">04:00 PM - 05:00 PM (EAT)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-stone-700">What would you like to focus on in this session?</label>
                      <textarea
                        rows={2}
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="e.g. Navigating my career transition, setting emotional boundaries..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Provider & Action Buttons */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    Payment Gateway
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <Lock className="w-3.5 h-3.5" /> 256-bit Encrypted
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-900 text-white flex items-center justify-center font-serif font-bold text-lg">
                      S
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-stone-900">Selar Checkout (Official)</h4>
                      <p className="text-[11px] text-stone-500">Supports M-Pesa, Visa, Mastercard, Apple Pay, Bank Transfer</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-stone-600 bg-white px-2.5 py-1 rounded border border-stone-200">
                    Product: {service.selar_product_id || 'v09683c927'}
                  </span>
                </div>

                {/* Compact Legal Disclaimer Card */}
                {currentUser && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
                        <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
                        <span>Important</span>
                      </div>
                      <DisclaimerModal triggerText="Read full disclaimer" />
                    </div>

                    <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed">
                      Becoming Her is a coaching and personal-development programme. It is not therapy or counselling and does not replace professional medical or mental-health care.
                    </p>

                    <label
                      htmlFor="checkout-disclaimer-checkbox"
                      className="flex items-start gap-2.5 pt-1 cursor-pointer select-none group"
                    >
                      <input
                        id="checkout-disclaimer-checkbox"
                        type="checkbox"
                        checked={isDisclaimerAccepted}
                        onChange={(e) => setIsDisclaimerAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 accent-stone-900 focus:ring-rose-900 cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] sm:text-xs text-stone-800 group-hover:text-stone-950 font-medium leading-snug">
                        I understand the nature of this programme.
                      </span>
                    </label>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-2 flex flex-col gap-3">
                  {currentUser ? (
                    <>
                      <button
                        type="submit"
                        disabled={isLoading || !isDisclaimerAccepted}
                        className="w-full py-4 rounded-xl bg-stone-900 text-amber-50 font-medium text-sm hover:bg-rose-950 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Proceed to Selar Payment ({service.currency} {finalPrice.toLocaleString()})</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      {!isDisclaimerAccepted && (
                        <p className="text-[10px] text-center text-stone-500 italic">
                          Please check the box above acknowledging the coaching disclaimer to proceed.
                        </p>
                      )}
                    </>
                  ) : (
                    <Link
                      href={`/register?redirect=${encodeURIComponent(`/checkout/${service.id}`)}`}
                      className="w-full py-4 rounded-xl bg-rose-950 text-amber-50 font-medium text-sm hover:bg-stone-900 transition flex items-center justify-center gap-2 shadow-lg text-center"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account to Proceed to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  {/* Dev / Instant Test Flow Button */}
                  <button
                    type="button"
                    onClick={(e) => handleCheckout(e, true)}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl border border-dashed border-stone-300 text-stone-600 hover:text-stone-950 hover:bg-stone-50 text-xs font-medium transition"
                  >
                    ⚡ Simulate Instant Verified Payment (Testing Sandbox)
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6 sticky top-28">
              <h3 className="font-serif text-lg font-semibold text-stone-900 border-b border-stone-100 pb-4">
                Order Summary
              </h3>

              {/* Service details */}
              <div className="flex gap-4">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-20 h-20 rounded-xl object-cover border border-stone-200 shrink-0"
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-semibold text-stone-900">{service.name}</h4>
                  <p className="text-xs text-rose-800 font-medium">{service.duration}</p>
                  <p className="text-xs text-stone-500 line-clamp-2">{service.short_description}</p>
                </div>
              </div>

              {/* Included features */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Includes:</span>
                <ul className="space-y-1.5 text-xs text-stone-700">
                  {service.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-800 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coupon input */}
              <div className="pt-4 border-t border-stone-100 space-y-2">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-800" /> Have a Coupon Code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. BECOMINGHER10"
                    className="flex-1 px-3 py-2 text-xs uppercase font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-950/20"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-xs ${couponMessage.startsWith('✓') ? 'text-emerald-700 font-medium' : 'text-rose-700'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Programme Investment</span>
                  <span>{service.currency} {basePrice.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>- {service.currency} {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-900 font-serif text-lg font-bold pt-2 border-t border-stone-100">
                  <span>Total Due Today</span>
                  <span className="text-rose-950">{service.currency} {finalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Guarantee */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200/60 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  100% Secure Checkout powered by Selar. Instant access and meeting confirmation delivered to your email and customer dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
