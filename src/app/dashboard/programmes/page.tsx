'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  FileText,
  Sun,
  ChevronRight,
  ArrowRight,
  Save,
  Check,
  Download,
  ExternalLink,
  Eye,
  X,
  FileCheck,
  BookMarked
} from 'lucide-react';
import { store } from '@/lib/store';

export default function ProgrammesDashboardPage() {
  const customerId = 'cust-demo-01';
  const hasAccess = store.hasActiveEntitlement(customerId, 'srv-guided-01');
  const programme = store.programme;
  const book = programme.book;
  const service = store.getServiceById('srv-guided-01');

  // Selected module & lesson state
  const [activeModuleId, setActiveModuleId] = useState(programme.modules[0].id);
  const activeModule = programme.modules.find((m) => m.id === activeModuleId) || programme.modules[0];
  const [activeLessonId, setActiveLessonId] = useState(activeModule.lessons[0]?.id);
  const activeLesson = activeModule.lessons.find((l) => l.id === activeLessonId) || activeModule.lessons[0];

  // Book Reader Modal State
  const [isReadingBook, setIsReadingBook] = useState(false);

  // Reflection responses state
  const [reflections, setReflections] = useState<Record<string, string>>({
    'ref-1-1': 'I used to believe that my worth was directly tied to how much I could sacrifice for others without complaining. I am unlearning the need to be the perpetual savior.'
  });
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  // Completed lessons
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({
    'les-1-1': true
  });

  const handleSaveReflection = (questionId: string, questionText: string) => {
    const text = reflections[questionId] || '';
    if (!text.trim()) return;

    store.reflections.unshift({
      id: `ref-${Date.now()}`,
      user_id: customerId,
      programme_id: programme.id,
      module_id: activeModule.id,
      question_id: questionId,
      question: questionText,
      response: text,
      created_at: new Date().toISOString()
    });

    setSavedStatus((prev) => ({ ...prev, [questionId]: true }));
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [questionId]: false }));
    }, 3000);
  };

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

  // =========================================================================
  // UNPAID / NOT ACQUIRED ACCESS ENFORCEMENT
  // =========================================================================
  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-900 mx-auto flex items-center justify-center shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-rose-900 uppercase tracking-widest bg-rose-100 px-3 py-1 rounded-full">
              Access Restricted • Payment Required
            </span>
            <h2 className="font-serif text-3xl font-semibold text-stone-900">
              Programme & Companion Book Locked
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
              This transformative digital programme and its accompanying 142-page guided workbook are reserved exclusively for enrolled members.
            </p>
          </div>
        </div>

        {/* Locked Companion Book Showcase Card */}
        {book && (
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-rose-200/80 shadow-sm relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3 text-rose-700" />
                Locked Companion Book Included
              </span>
              <span className="text-xs font-semibold text-stone-500">
                {book.page_count} Pages • {book.file_type || 'PDF'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
              <div className="relative w-28 aspect-[3/4] rounded-xl overflow-hidden shadow-md border-2 border-white shrink-0">
                <img
                  src={book.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
                  alt={book.title}
                  className="w-full h-full object-cover filter blur-[1px]"
                />
                <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow">
                    <Lock className="w-4 h-4 text-rose-900" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-center sm:text-left text-xs">
                <h4 className="font-serif text-base font-semibold text-stone-900">
                  {book.title}
                </h4>
                <p className="text-[11px] text-stone-500 font-medium">
                  By {book.author || 'Lead Coach Zipporah Karanja'}
                </p>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {book.description}
                </p>
                <p className="text-[10px] text-rose-900 font-semibold pt-1">
                  🔒 Download & digital reader access unlock automatically upon acquiring the service.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/checkout/srv-guided-01"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-stone-900 text-amber-50 text-xs font-semibold hover:bg-rose-950 transition shadow-lg hover:shadow-xl group"
          >
            <span>Unlock Guided Digital Programme & Book (KES 1,000)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE MEMBER UNLOCKED EXPERIENCE
  // =========================================================================
  const totalLessons = programme.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  return (
    <div className="space-y-8">
      {/* Top Header & Overall Progress */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-rose-900 uppercase tracking-widest bg-rose-100/70 px-2.5 py-0.5 rounded-full">
            Active Entitlement: Unlocked
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
            {programme.title}
          </h1>
          <p className="text-xs text-stone-600">{programme.subtitle}</p>
        </div>

        <div className="md:w-64 space-y-2 shrink-0">
          <div className="flex justify-between text-xs text-stone-700 font-medium">
            <span>Overall Progress</span>
            <span className="text-rose-950 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-900 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-500 block text-right">
            {completedCount} of {totalLessons} lessons finished
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACCOMPANYING PROGRAMME BOOK UNLOCKED CARD                                 */}
      {/* ========================================================================= */}
      {book && (
        <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-amber-50 rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* 3D Styled Book Thumbnail */}
            <div className="relative w-28 sm:w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-amber-200/30 shrink-0 group">
              <img
                src={book.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute top-2 left-2 bg-rose-900/90 text-amber-100 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border border-amber-200/20">
                {book.file_type || 'PDF'}
              </div>
            </div>

            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wider border border-amber-300/20">
                <Sun className="w-3 h-3 text-amber-300" />
                <span>Your Included Companion Book</span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-amber-50">
                {book.title}
              </h3>
              <p className="text-xs text-stone-300 font-medium">
                Authored by {book.author || 'Lead Coach Zipporah Karanja'} • {book.page_count} Pages
              </p>
              <p className="text-xs text-stone-300/90 leading-relaxed line-clamp-2">
                {book.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <a
              href={`/api/programmes/${programme.id}/book?download=1`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-amber-100 text-stone-950 font-semibold text-xs hover:bg-white transition flex items-center justify-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Book ({book.file_size || 'PDF'})</span>
            </a>

            <button
              type="button"
              onClick={() => setIsReadingBook(true)}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-50 font-semibold text-xs border border-white/20 transition flex items-center justify-center gap-1.5"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Read Online / View Workbook</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADDITIONAL UNLOCKED RESOURCES CARD                                        */}
      {/* ========================================================================= */}
      {service?.resources && service.resources.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-stone-900">
              Your Additional Materials
            </h3>
            <p className="text-xs text-stone-600">
              Download your supplementary worksheets, audio guides, and frameworks.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {service.resources.map((res) => (
              <div key={res.id} className="p-4 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{res.title}</p>
                    <p className="text-xs text-stone-500">{res.file_name} • {res.file_size || 'File'}</p>
                  </div>
                </div>
                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-900 text-amber-50 hover:bg-rose-950 transition shadow"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Selector Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {programme.modules.map((mod) => {
          const isSelected = mod.id === activeModule.id;
          return (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModuleId(mod.id);
                setActiveLessonId(mod.lessons[0]?.id);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-rose-950 text-amber-50 shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {mod.title.split(':')[0]}
            </button>
          );
        })}
      </div>

      {/* Main Study Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Lessons Sidebar */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="font-serif text-lg font-semibold text-stone-900">
              {activeModule.title}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{activeModule.description}</p>
          </div>

          <div className="space-y-2">
            {activeModule.lessons.map((lesson) => {
              const isSelected = lesson.id === activeLesson?.id;
              const isDone = !!completedLessons[lesson.id];

              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-rose-50 border-rose-200 text-rose-950 font-semibold shadow-xs'
                      : 'bg-white border-stone-100 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLessonCompleted(lesson.id);
                      }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        isDone
                          ? 'bg-rose-900 border-rose-900 text-white'
                          : 'border-stone-300 text-transparent hover:border-stone-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="block leading-tight">{lesson.title}</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        {lesson.duration}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Lesson Viewer & Inquiries */}
        <div className="lg:col-span-8 space-y-6">
          {activeLesson ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8">
              {/* Lesson Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-rose-900 uppercase tracking-wider">
                    {activeModule.title.split(':')[0]} • Lesson {activeLesson.order}
                  </span>
                  <h2 className="font-serif text-2xl font-semibold text-stone-900">
                    {activeLesson.title}
                  </h2>
                </div>

                <button
                  onClick={() => toggleLessonCompleted(activeLesson.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    completedLessons[activeLesson.id]
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {completedLessons[activeLesson.id] ? 'Completed' : 'Mark as Complete'}
                  </span>
                </button>
              </div>

              {/* Lesson Audio/Video Player Simulation */}
              {activeLesson.video_url && (
                <div className="aspect-video w-full rounded-2xl bg-stone-900 flex flex-col items-center justify-center text-stone-400 p-6 relative overflow-hidden shadow-inner">
                  <PlayCircle className="w-16 h-16 text-rose-200/80 mb-2 cursor-pointer hover:scale-105 transition" />
                  <p className="text-xs font-serif text-stone-300">
                    Guided Audio Meditation & Reflection
                  </p>
                  <span className="text-[10px] text-stone-500">{activeLesson.duration}</span>
                </div>
              )}

              {/* Lesson Core Text */}
              <div className="prose prose-stone max-w-none text-xs sm:text-sm leading-relaxed text-stone-700 space-y-4">
                <p className="font-serif italic text-rose-950/90 text-sm sm:text-base border-l-2 border-rose-900 pl-4 py-1">
                  “{activeLesson.description}”
                </p>
                <div className="whitespace-pre-line text-stone-700 leading-relaxed pt-2">
                  {activeLesson.content}
                </div>
              </div>

              {/* Reflection Questions for this Module */}
              <div className="pt-8 border-t border-stone-200 space-y-6">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    Deep Reflection Exercise
                  </h3>
                  <p className="text-xs text-stone-500">
                    Your responses are permanently archived to your private transformation journal.
                  </p>
                </div>

                {activeModule.reflection_questions.map((q) => (
                  <div key={q.id} className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                    <label className="font-serif text-sm font-semibold text-stone-900 block leading-snug">
                      {q.question}
                    </label>
                    <textarea
                      rows={4}
                      value={reflections[q.id] || ''}
                      onChange={(e) =>
                        setReflections({ ...reflections, [q.id]: e.target.value })
                      }
                      placeholder={q.placeholder || 'Type your authentic reflection here...'}
                      className="w-full p-3.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-950/20 bg-white"
                    />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[11px] text-stone-500">
                        {savedStatus[q.id] ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Saved to journal!
                          </span>
                        ) : (
                          'Auto-synced to your portfolio'
                        )}
                      </span>
                      <button
                        onClick={() => handleSaveReflection(q.id, q.question)}
                        className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Reflection</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
              <p className="text-sm text-stone-500">Select a lesson on the left to begin.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ONLINE COMPANION WORKBOOK READER MODAL                                    */}
      {/* ========================================================================= */}
      {isReadingBook && book && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] rounded-3xl border border-stone-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in">
            {/* Reader Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-950 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-rose-900" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-stone-900">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    By {book.author || 'Lead Coach Zipporah Karanja'} • Official Member Copy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/programmes/${programme.id}/book?download=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 flex items-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsReadingBook(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reader Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed font-serif">
              <div className="text-center py-4 border-b border-stone-100 space-y-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-rose-900 bg-rose-50 px-3 py-1 rounded-full">
                  Guided Transformation Manual
                </span>
                <h2 className="text-2xl font-bold text-stone-900">
                  {book.title}
                </h2>
                <p className="font-sans text-xs text-stone-500">
                  {book.description}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-rose-950">
                  Sacred Welcome & Invocation
                </h4>
                <p className="italic text-stone-800 text-base leading-relaxed bg-amber-50/60 p-4 rounded-xl border border-amber-200/50">
                  “You are not here to build a replica of who you were taught to be. You are here to remember who you were before the world told you who to become.”
                  <br />
                  <span className="text-xs font-sans not-italic text-stone-500 block mt-2 text-right">
                    — Lead Coach Zipporah Karanja
                  </span>
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-rose-950">
                  The Four Pillars of Becoming Her
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="font-bold text-rose-900">Stage 1: The Awakening</span>
                    <p className="text-stone-600 text-[11px]">Deconstruct limiting beliefs, perfectionism, and ancestral scripts.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="font-bold text-rose-900">Stage 2: Core Identity</span>
                    <p className="text-stone-600 text-[11px]">Anchor in 5 non-negotiable bedrock values and embody your future self.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="font-bold text-rose-900">Stage 3: Sacred Rituals</span>
                    <p className="text-stone-600 text-[11px]">Morning/evening architecture and gentle, high-impact goal execution.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="font-bold text-rose-900">Stage 4: Living Sovereignty</span>
                    <p className="text-stone-600 text-[11px]">Navigating relapses with self-compassion and signing your manifesto.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-100 text-center font-sans text-xs text-stone-600 space-y-2">
                <p>Want the full high-resolution printable PDF with worksheets and journaling templates?</p>
                <a
                  href={`/api/programmes/${programme.id}/book?download=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950 text-white font-semibold text-xs hover:bg-rose-900 shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Complete 142-Page Workbook (PDF)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
