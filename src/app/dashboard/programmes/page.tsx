'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileText,
  Download,
  Calendar,
  Sparkles,
  Compass,
  PlayCircle,
  Gem,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getProgrammes } from '@/lib/programmes';
import { getServices } from '@/lib/services';
import { Programme, Service } from '@/types';

export default function ProgrammesHubPage() {
  const [user, setUser] = useState<any>(null);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initPage() {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser }
        } = await supabase.auth.getUser();

        setUser(currentUser);

        // 1. Sync & fetch entitlements via server API
        try {
          const syncRes = await fetch('/api/auth/sync-entitlements', { method: 'POST' });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.entitlements) {
              setEntitlements(syncData.entitlements);
            }
          }
        } catch (syncErr) {
          console.error('Error syncing entitlements:', syncErr);
        }

        // Direct fallback query if needed
        if (currentUser) {
          const { data: entData } = await supabase
            .from('entitlements')
            .select('*')
            .eq('customer_id', currentUser.id)
            .eq('status', 'ACTIVE');

          if (entData && entData.length > 0) {
            setEntitlements(entData);
          }
        }

        // 2. Fetch programmes and services
        const [progList, svcList] = await Promise.all([
          getProgrammes(),
          getServices()
        ]);

        if (progList) setProgrammes(progList);
        if (svcList) setServices(svcList);
      } catch (err) {
        console.error('Failed loading programmes hub:', err);
      } finally {
        setLoading(false);
      }
    }

    initPage();
  }, []);

  const activeEntitlementIds = new Set(entitlements.map((e) => e.service_id));

  // Separate enrolled programmes vs standalone workbooks vs sessions
  const enrolledProgrammes = programmes.filter((p) =>
    activeEntitlementIds.has(p.service_id) || activeEntitlementIds.has(p.id)
  );

  const hasWorkbookEntitlement = activeEntitlementIds.has('srv-book-04');
  const hasSessionEntitlement = activeEntitlementIds.has('srv-interpersonal-03');

  // Other available programmes not yet enrolled
  const availableProgrammes = programmes.filter(
    (p) => !activeEntitlementIds.has(p.service_id) && !activeEntitlementIds.has(p.id)
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white p-8 sm:p-10 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-200 text-xs font-medium">
            <Compass className="w-3.5 h-3.5" /> Sanctuary Learning Container
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
            My Programmes & Curricula
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Your unlocked transformational coaching journeys, sovereign reflection matrices, and sacred digital materials.
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-800" />
          <p className="text-xs text-stone-500">Unlocking your sacred sanctuary curricula...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* SECTION 1: ENROLLED DIGITAL PROGRAMMES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Enrolled Programmes
                </h2>
                <p className="text-xs text-stone-500">
                  Step into your active self-paced transformational frameworks
                </p>
              </div>
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {enrolledProgrammes.length} Active {enrolledProgrammes.length === 1 ? 'Programme' : 'Programmes'}
              </span>
            </div>

            {enrolledProgrammes.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enrolledProgrammes.map((prog) => {
                  const ent = entitlements.find(
                    (e) => e.service_id === prog.service_id || e.service_id === prog.id
                  );
                  const progress = ent?.progress_percentage || 0;
                  const totalModules = prog.modules?.length || 4;
                  const totalLessons =
                    prog.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 12;

                  return (
                    <div
                      key={prog.id}
                      className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-6 sm:p-7 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-rose-900 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md">
                              Unlocked & In Progress
                            </span>
                            <h3 className="font-serif text-xl font-bold text-stone-900">
                              {prog.title}
                            </h3>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 text-rose-900">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        </div>

                        <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                          {prog.description || prog.subtitle}
                        </p>

                        {/* Curriculum Specs */}
                        <div className="flex flex-wrap gap-2 text-[11px] font-medium text-stone-600">
                          <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/60 flex items-center gap-1.5">
                            <PlayCircle className="w-3.5 h-3.5 text-rose-800" />
                            {totalModules} Modules
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/60 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            {totalLessons} Guided Lessons
                          </span>
                          {prog.book && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-900 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-rose-700" />
                              Includes 142-Page Companion Book
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs text-stone-600 font-medium">
                            <span>Journey Completion</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-900 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(5, progress)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-5 sm:p-6 bg-stone-50/70 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {prog.book ? (
                          <a
                            href={`/api/programmes/${prog.id}/book?download=1`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-stone-700 hover:text-rose-950 flex items-center gap-1.5 transition order-2 sm:order-1"
                          >
                            <Download className="w-3.5 h-3.5 text-rose-800" />
                            <span>Download Companion PDF</span>
                          </a>
                        ) : (
                          <span className="text-xs text-stone-400 order-2 sm:order-1">Self-Paced Mentorship</span>
                        )}

                        <Link
                          href={`/dashboard/programmes/${prog.service_id}`}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center justify-center gap-2 shadow order-1 sm:order-2"
                        >
                          <span>Resume Learning</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-sm text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-900 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    No Coaching Programmes Enrolled Yet
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Begin your transformational journey by enrolling in "The Guided Journey" or booking a customized mentorship roadmap with Lead Coach Zipporah Karanja.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition shadow"
                  >
                    <span>Browse All Coaching Programmes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: STANDALONE DIGITAL BOOKS & MATERIALS */}
          {hasWorkbookEntitlement && (
            <div className="space-y-4 pt-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Digital Materials & Companion Workbooks
                </h2>
                <p className="text-xs text-stone-500">
                  Your permanent library of sacred prompts, reflection exercises, and frameworks
                </p>
              </div>

              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  <div className="w-20 aspect-[3/4] rounded-xl bg-stone-900 overflow-hidden shadow-md shrink-0 border border-stone-200">
                    <img
                      src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800"
                      alt="Companion Workbook"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Unlocked & Owned
                    </span>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      Becoming Her: The Sacred Companion Workbook & Reflective Manifesto
                    </h3>
                    <p className="text-xs text-stone-600 max-w-xl">
                      A structured 142-page digital workbook containing weekly reflective frameworks, habit architecture matrices, and somatic journaling exercises by Lead Coach Zipporah Karanja.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                  <a
                    href="/api/programmes/prog-guided-01/book?download=1"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center justify-center gap-2 shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </a>
                  <Link
                    href="/dashboard/programmes/srv-guided-01"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4 text-stone-600" />
                    <span>Open Reader</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: 1-ON-1 COACHING SESSIONS */}
          {hasSessionEntitlement && (
            <div className="space-y-4 pt-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Private Mentorship Sessions
                </h2>
                <p className="text-xs text-stone-500">
                  Your confidential 1-on-1 strategy containers with Lead Coach Zipporah Karanja
                </p>
              </div>

              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-900 flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Confirmed Active
                    </span>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      1-on-1 Interpersonal Mentorship Session
                    </h3>
                    <p className="text-xs text-stone-600">
                      Access your scheduled video meeting room, daytime appointments, and personal coaching notes.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/sessions"
                  className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center justify-center gap-2 shadow shrink-0"
                >
                  <span>View Sessions & Meeting Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* SECTION 4: AVAILABLE PROGRAMMES TO ENROLL */}
          {availableProgrammes.length > 0 && (
            <div className="space-y-4 pt-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Explore More Curricula
                </h2>
                <p className="text-xs text-stone-500">
                  Deepen your sacred journey with our specialized self-mastery pathways
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableProgrammes.map((prog) => {
                  const svc = services.find((s) => s.id === prog.service_id);
                  const price = svc ? `${svc.currency} ${svc.price.toLocaleString()}` : 'KES 1,000';

                  return (
                    <div
                      key={prog.id}
                      className="bg-white/80 rounded-3xl border border-stone-200 p-6 sm:p-7 space-y-4 hover:border-rose-300 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-md">
                            {price}
                          </span>
                          <Lock className="w-4 h-4 text-stone-400" />
                        </div>
                        <h3 className="font-serif text-lg font-bold text-stone-900">
                          {prog.title}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-3">
                          {prog.description || prog.subtitle}
                        </p>
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/checkout/${prog.service_id}`}
                          className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-rose-900 hover:text-white text-stone-800 text-xs font-semibold transition flex items-center justify-center gap-2"
                        >
                          <span>Enroll in {prog.title}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
