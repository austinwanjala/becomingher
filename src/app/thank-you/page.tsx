'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  Download,
  BookOpen,
  Calendar,
  Video,
  Mail,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileText,
  Loader2,
  Feather,
  RefreshCw,
  Clock,
  HeartHandshake,
  AlertCircle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/utils/supabase/client';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract all parameters Selar or our checkout passes
  const orderId =
    searchParams.get('order_id') ||
    searchParams.get('orderId') ||
    searchParams.get('order') ||
    searchParams.get('id') ||
    '';
  const transactionRef =
    searchParams.get('reference') ||
    searchParams.get('trxref') ||
    searchParams.get('transaction_id') ||
    searchParams.get('custom_ref') ||
    searchParams.get('ref') ||
    searchParams.get('tx_ref') ||
    searchParams.get('transactionId') ||
    '';
  const productId =
    searchParams.get('product_id') ||
    searchParams.get('productId') ||
    searchParams.get('code') ||
    searchParams.get('product_code') ||
    '';
  const serviceId = searchParams.get('service_id') || searchParams.get('serviceId') || '';
  const emailParam = searchParams.get('email') || searchParams.get('customer_email') || '';
  const nameParam = searchParams.get('name') || searchParams.get('customer_name') || '';

  const [status, setStatus] = useState<'verifying' | 'confirmed' | 'pending' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment with Selar and unlocking your sanctuary materials...');
  const [details, setDetails] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Check client auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, []);

  const verify = async (isManualCheck = false) => {
    try {
      const effectiveEmail = emailParam || user?.email || '';
      const effectiveName = nameParam || user?.user_metadata?.name || '';
      const effectiveCustomerId = user?.id || '';

      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          transactionReference: transactionRef,
          reference: transactionRef,
          productId,
          serviceId,
          email: effectiveEmail,
          name: effectiveName,
          customerId: effectiveCustomerId,
          forceCheck: isManualCheck
        })
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        setStatus('confirmed');
        setMessage('Payment verified successfully. Your sanctuary access is unlocked and materials are ready.');
        setDetails(data);

        // Also trigger background sync for logged in users
        fetch('/api/auth/sync-entitlements', { method: 'POST' }).catch(() => {});
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Verification attempt warning:', err);
      return false;
    }
  };

  const handleCheckAgain = async () => {
    setStatus('verifying');
    setMessage('Connecting to Selar and updating your member entitlements...');
    try {
      // First trigger auth sync-entitlements
      await fetch('/api/auth/sync-entitlements', { method: 'POST' }).catch(() => {});
      const verified = await verify(true);
      if (!verified) {
        setStatus('pending');
        setMessage('Selar has recorded your payment. Your access and downloadable materials will appear in your Member Dashboard.');
      }
    } catch (_) {
      window.location.reload();
    }
  };

  // Run auto-verification polling
  useEffect(() => {
    let intervalId: any;
    let attempts = 0;
    const maxAttempts = 10;

    const runPoll = async () => {
      attempts++;
      const isConfirmed = await verify();
      if (isConfirmed) {
        clearInterval(intervalId);
      } else if (attempts >= maxAttempts) {
        setStatus('pending');
        setMessage('Your transaction is being confirmed by Selar. Your access and downloadable materials will be available in your portal.');
        clearInterval(intervalId);
      }
    };

    // Initial check after slight delay to allow Selar webhook / payment propagation
    const timer = setTimeout(() => {
      runPoll();
      intervalId = setInterval(runPoll, 2000);
    }, 800);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [orderId, transactionRef, productId, serviceId, emailParam, nameParam, user]);

  const order = details?.order;
  const service = details?.service;
  const materials = details?.materials;
  const booking = details?.booking;

  const displayCustomerName =
    order?.customer_name || nameParam || user?.user_metadata?.name || 'Beloved Sister';
  const displayCustomerEmail =
    order?.customer_email || emailParam || user?.email || 'your registered email';

  const dashboardTargetUrl =
    materials?.dashboardUrl ||
    (service?.id === 'srv-interpersonal-03'
      ? '/dashboard/sessions'
      : service?.id === 'srv-custom-02'
      ? '/dashboard/programmes/srv-custom-02'
      : '/dashboard/programmes');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 font-sans selection:bg-rose-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* State: Verifying */}
        {status === 'verifying' && (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto my-12 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold tracking-wide">
              <Feather className="w-4 h-4 text-rose-700 animate-pulse" /> Becoming Her Sanctuary
            </div>

            <div className="flex justify-center my-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-100 to-amber-50 flex items-center justify-center shadow-inner">
                  <Loader2 className="w-12 h-12 text-rose-800 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-rose-300 border-dashed animate-spin-slow" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-medium tracking-tight">
                Confirming Your Sacred Enrollment
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                {message}
              </p>
            </div>

            <div className="pt-4 text-xs text-stone-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Bank-Grade Selar Verification In Progress</span>
            </div>
          </div>
        )}

        {/* State: Confirmed & Verified */}
        {status === 'confirmed' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Celebration Hero */}
            <div className="bg-gradient-to-br from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center sm:text-left">
              <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-rose-200 text-xs font-semibold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Payment Confirmed & Verified</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal leading-tight text-white">
                  Welcome to Your Elevation, <br className="hidden sm:inline" />
                  <span className="italic font-light text-rose-200">{displayCustomerName}</span>
                </h1>

                <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl font-light">
                  Thank you for honoring your sovereignty. Your enrollment for{' '}
                  <strong className="text-white font-medium">{order?.service_name || service?.name || 'Becoming Her Coaching'}</strong>{' '}
                  has been verified and permanently unlocked in your sanctuary.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-stone-300">
                  <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Order: <strong className="font-mono text-white">{order?.order_reference || 'Confirmed'}</strong></span>
                  </div>
                  {order?.amount && (
                    <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                      <span>Total: <strong className="text-amber-200 font-semibold">{order.currency || 'KES'} {Number(order.amount).toLocaleString()}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Email Dispatch Alert Box */}
            <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-rose-950">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-serif font-semibold text-base text-rose-900">
                  Materials Dispatched to Your Email
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  We have sent your complete order receipt, downloadable workbooks, and onboarding guides directly to{' '}
                  <strong className="text-stone-900 font-medium">{displayCustomerEmail}</strong>. If you do not see it in your primary inbox, please check your updates or spam folder.
                </p>
              </div>
            </div>

            {/* Accompaniments & Immediate Downloads Section */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif text-stone-900 font-medium">
                    Your Unlocked Sanctuary Materials
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Accessible immediately below for instant reading, download, and action.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full self-start">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lifetime Access
                </div>
              </div>

              {/* 1. Primary PDF Workbook / Companion Book Download */}
              {materials?.pdfUrl && (
                <div className="bg-stone-50 rounded-2xl p-5 sm:p-6 border border-stone-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-rose-300 transition group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-900 to-rose-950 text-white flex items-center justify-center shrink-0 shadow-md">
                      <BookOpen className="w-6 h-6 text-rose-200" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded">
                        Digital Book &amp; Workbook
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-stone-900">
                        {materials.pdfTitle || 'Becoming Her Companion Workbook'}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {materials.pdfName || 'Digital PDF'} &bull; Instant download for offline reading, reflective matrices &amp; habit blueprints.
                      </p>
                    </div>
                  </div>

                  <a
                    href={materials.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-medium transition shadow-md hover:shadow-lg shrink-0"
                  >
                    <Download className="w-4 h-4 text-rose-300" />
                    <span>Download PDF Workbook</span>
                  </a>
                </div>
              )}

              {/* 2. Personalized Assessment Questionnaire (Custom Coaching) */}
              {materials?.questionnaireUrl && (
                <div className="bg-rose-50/50 rounded-2xl p-5 sm:p-6 border-2 border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-900 text-white flex items-center justify-center shrink-0 shadow-md">
                      <FileText className="w-6 h-6 text-amber-200" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded">
                        Action Required: Onboarding Assessment
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-rose-950">
                        Personalized Life Assessment Questionnaire
                      </h3>
                      <p className="text-xs text-stone-600 max-w-lg leading-relaxed">
                        Download this questionnaire (.docx), complete your personal reflections and goals, and re-upload the completed document in your Member Dashboard so Lead Coach Zipporah can formulate your personalized pathway.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                    <a
                      href={materials.questionnaireUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold transition shadow-sm"
                    >
                      <Download className="w-4 h-4 text-amber-200" />
                      <span>Download Questionnaire (.docx)</span>
                    </a>
                    <Link
                      href="/dashboard/programmes/srv-custom-02"
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-white border border-rose-300 text-rose-900 hover:bg-rose-50 text-xs font-medium transition text-center"
                    >
                      <span>Upload in Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* 3. 1-on-1 Interpersonal Session Schedule & Video Link */}
              {booking && (
                <div className="bg-emerald-50/60 rounded-2xl p-5 sm:p-6 border-2 border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Video className="w-6 h-6 text-emerald-200" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded">
                        Confirmed Session
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-semibold text-emerald-950">
                        1-on-1 Coaching Session with Lead Coach Zipporah
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
                        <span className="flex items-center gap-1 font-medium text-stone-800">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                          {booking.scheduled_date || 'Upcoming'}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-stone-800">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          {booking.start_time || '11:00'} (EAT)
                        </span>
                      </div>
                    </div>
                  </div>

                  {booking.meeting_link && (
                    <a
                      href={booking.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition shadow-md shrink-0"
                    >
                      <Video className="w-4 h-4 text-emerald-200" />
                      <span>Join Google Meet Session</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  )}
                </div>
              )}

              {/* 4. Additional Accompaniments / Resource Files */}
              {materials?.resources && materials.resources.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Additional Included Accompaniments:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {materials.resources.map((res: any, idx: number) => (
                      <div
                        key={res.id || idx}
                        className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center justify-between gap-3 hover:bg-white transition"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-semibold text-stone-900 truncate">
                            {res.title || res.file_name}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {res.file_size || 'Material file'} &bull; {res.file_type || 'Download'}
                          </p>
                        </div>
                        <a
                          href={res.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-medium transition shrink-0 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next Steps & Portal Access CTA Banner */}
            <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-rose-300 text-xs uppercase font-bold tracking-widest">
                  Your Sanctuary Awaits
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium">
                  Enter Your Member Dashboard
                </h3>
                <p className="text-stone-300 text-xs sm:text-sm max-w-lg leading-relaxed font-light">
                  Track weekly reflections, stream audio meditations, submit your inquiries, and step fully into the woman you are becoming.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link
                  href={dashboardTargetUrl}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-medium text-sm transition shadow-lg shrink-0"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {!user && (
                  <Link
                    href={`/login?redirect=${encodeURIComponent(dashboardTargetUrl)}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition border border-white/20 shrink-0"
                  >
                    <span>Sign In to Save Progress</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Return home link */}
            <div className="text-center pt-4">
              <Link
                href="/"
                className="text-xs text-stone-500 hover:text-stone-900 underline transition"
              >
                Return to Becoming Her Homepage
              </Link>
            </div>
          </div>
        )}

        {/* State: Pending Verification */}
        {status === 'pending' && (
          <div className="bg-white rounded-3xl shadow-xl border border-stone-200/80 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-serif text-stone-900 font-semibold">
                Payment Received &amp; Processing
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                Selar is currently confirming your transaction settlement. Your access entitlement and downloadable materials will appear in your Member Dashboard shortly.
              </p>
            </div>

            {transactionRef && (
              <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-600 font-mono border border-stone-200">
                Transaction Reference: {transactionRef}
              </div>
            )}

            <div className="pt-2 space-y-3">
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleCheckAgain}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-100 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Status Again</span>
              </button>
            </div>
          </div>
        )}

        {/* State: Failed or Error */}
        {status === 'failed' && (
          <div className="bg-white rounded-3xl shadow-xl border border-rose-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-serif text-stone-900 font-semibold">
                Verification Notice
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/contact"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-900 text-white font-medium hover:bg-rose-800 transition text-sm shadow-md"
              >
                <span>Contact Sanctuary Support</span>
              </Link>
              <Link
                href="/"
                className="w-full py-2 text-stone-500 hover:text-stone-900 text-xs transition"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
          <div className="flex flex-col items-center gap-3 text-stone-600">
            <Loader2 className="w-8 h-8 text-rose-800 animate-spin" />
            <p className="text-xs uppercase tracking-widest font-semibold">Entering Sanctuary...</p>
          </div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
