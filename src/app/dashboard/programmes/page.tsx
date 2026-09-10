'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  FileText,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Save,
  Check
} from 'lucide-react';
import { store } from '@/lib/store';

export default function ProgrammesDashboardPage() {
  const customerId = 'cust-demo-01';
  const hasAccess = store.hasActiveEntitlement(customerId, 'srv-guided-01');
  const programme = store.programme;

  // Selected module & lesson state
  const [activeModuleId, setActiveModuleId] = useState(programme.modules[0].id);
  const activeModule = programme.modules.find((m) => m.id === activeModuleId) || programme.modules[0];
  const [activeLessonId, setActiveLessonId] = useState(activeModule.lessons[0]?.id);
  const activeLesson = activeModule.lessons.find((l) => l.id === activeLessonId) || activeModule.lessons[0];

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
      id: `ref-ans-${Date.now()}`,
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

  // If user does not have active entitlement, enforce access control rule
  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-900 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl font-semibold text-stone-900">
            Programme Locked
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
            “Purchase this programme to unlock your coaching journey.”
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/checkout/srv-guided-01"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-stone-900 text-amber-50 text-xs font-semibold hover:bg-rose-950 transition shadow"
          >
            <span>Unlock Guided Digital Programme (KES 1,000)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Calculate progress
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
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-stone-900 text-amber-50 border-stone-900 shadow'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {mod.title.split(':')[0]}
            </button>
          );
        })}
      </div>

      {/* Two-Column Curriculum Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Lessons & Reflections Outline in this Module */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-stone-900">
                {activeModule.title}
              </h3>
              <p className="text-xs text-stone-500 pt-1 leading-relaxed">
                {activeModule.description}
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-stone-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Module Lessons
              </span>
              {activeModule.lessons.map((lesson) => {
                const isActive = lesson.id === activeLesson?.id;
                const isCompleted = completedLessons[lesson.id];
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-rose-50 text-rose-950 font-semibold border border-rose-200'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <PlayCircle className={`w-3.5 h-3.5 ${isActive ? 'text-rose-900' : 'text-stone-400'}`} />
                      <span className="truncate">{lesson.title}</span>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Lesson Content & Reflection Exercises */}
        <div className="lg:col-span-8 space-y-8">
          {activeLesson ? (
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-8">
              {/* Lesson Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
                <div className="space-y-1">
                  <span className="text-xs text-rose-800 font-medium">{activeLesson.duration}</span>
                  <h2 className="font-serif text-2xl font-semibold text-stone-900">
                    {activeLesson.title}
                  </h2>
                  <p className="text-xs text-stone-500">{activeLesson.description}</p>
                </div>

                <button
                  onClick={() => toggleLessonCompleted(activeLesson.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    completedLessons[activeLesson.id]
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completedLessons[activeLesson.id] ? 'Lesson Completed' : 'Mark as Complete'}</span>
                </button>
              </div>

              {/* Lesson Body Content */}
              <div className="prose prose-stone text-xs sm:text-sm leading-relaxed text-stone-700 space-y-4">
                <p>{activeLesson.content}</p>
                <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 my-4 space-y-2">
                  <h4 className="font-serif font-semibold text-stone-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-800" /> Sacred Action Principle
                  </h4>
                  <p className="text-xs text-stone-600">
                    Growth does not happen in consuming information; it occurs in the sacred stillness of intentional integration. Ground yourself in what you have read before answering your reflection prompt below.
                  </p>
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
    </div>
  );
}
