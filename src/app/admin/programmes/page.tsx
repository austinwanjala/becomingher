'use client';

import { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { store } from '@/lib/store';
import { Programme, ProgrammeModule, ProgrammeLesson, ReflectionQuestion } from '@/types';

export default function AdminProgrammesPage() {
  const [programme, setProgramme] = useState<Programme>(store.programme);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(programme.modules[0]?.id || '');
  const selectedModule = programme.modules.find((m) => m.id === selectedModuleId) || programme.modules[0];

  const [isEditingLesson, setIsEditingLesson] = useState<ProgrammeLesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDuration, setLessonDuration] = useState('15 mins');
  const [lessonContent, setLessonContent] = useState('');

  const [newQuestionText, setNewQuestionText] = useState('');

  const handleAddModule = () => {
    const newModNumber = programme.modules.length + 1;
    const newMod: ProgrammeModule = {
      id: `mod-${Date.now()}`,
      programme_id: programme.id,
      title: `Module ${newModNumber}: New Curriculum Stage`,
      description: 'Describe the transformation and core inquiry of this module.',
      order: newModNumber,
      lessons: [
        {
          id: `les-${Date.now()}-1`,
          title: 'Foundation Principles',
          duration: '15 mins',
          description: 'Introduction to this stage.',
          content: 'Add your lesson wisdom and reflective frameworks here.',
          order: 1
        }
      ],
      reflection_questions: [
        {
          id: `ref-${Date.now()}-1`,
          question: 'What is your core inquiry for this stage?',
          placeholder: 'Type your reflection...',
          order: 1
        }
      ]
    };

    const updatedModules = [...programme.modules, newMod];
    setProgramme({ ...programme, modules: updatedModules });
    store.programme.modules = updatedModules;
    setSelectedModuleId(newMod.id);
    store.addAuditLog('MODULE_CREATED', 'CURRICULUM', `New module created in ${programme.title}`);
  };

  const handleAddReflectionQuestion = () => {
    if (!newQuestionText.trim() || !selectedModule) return;
    const newQ: ReflectionQuestion = {
      id: `ref-q-${Date.now()}`,
      question: newQuestionText.trim(),
      placeholder: 'Type your reflection...',
      order: selectedModule.reflection_questions.length + 1
    };

    const updatedQuestions = [...selectedModule.reflection_questions, newQ];
    const updatedModules = programme.modules.map((m) =>
      m.id === selectedModule.id ? { ...m, reflection_questions: updatedQuestions } : m
    );

    setProgramme({ ...programme, modules: updatedModules });
    store.programme.modules = updatedModules;
    setNewQuestionText('');
    store.addAuditLog('REFLECTION_QUESTION_ADDED', 'CURRICULUM', `Question added to ${selectedModule.title}`);
  };

  const startEditLesson = (les: ProgrammeLesson) => {
    setIsEditingLesson(les);
    setLessonTitle(les.title);
    setLessonDuration(les.duration);
    setLessonContent(les.content);
  };

  const saveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingLesson || !selectedModule) return;

    const updatedLessons = selectedModule.lessons.map((l) =>
      l.id === isEditingLesson.id
        ? { ...l, title: lessonTitle, duration: lessonDuration, content: lessonContent }
        : l
    );

    const updatedModules = programme.modules.map((m) =>
      m.id === selectedModule.id ? { ...m, lessons: updatedLessons } : m
    );

    setProgramme({ ...programme, modules: updatedModules });
    store.programme.modules = updatedModules;
    setIsEditingLesson(null);
    store.addAuditLog('LESSON_UPDATED', 'CURRICULUM', `Lesson "${lessonTitle}" updated`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Curriculum & Module Architect
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Design modules, lessons, audio/video guides, and reflection inquiries for digital coaching programmes.
          </p>
        </div>

        <button
          onClick={handleAddModule}
          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Module</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Module Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-serif text-base font-semibold text-stone-900">Programme Modules</h3>
          <div className="space-y-2">
            {programme.modules.map((mod, idx) => {
              const isSelected = mod.id === selectedModule?.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-800">
                      Module {idx + 1}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {mod.lessons.length} Lessons • {mod.reflection_questions.length} Questions
                    </span>
                  </div>
                  <h4 className="font-serif font-semibold text-sm text-stone-900">{mod.title}</h4>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Module Editor */}
        <div className="lg:col-span-8 space-y-6">
          {selectedModule && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <div className="border-b border-stone-100 pb-4 space-y-1">
                <span className="text-xs text-rose-800 font-semibold uppercase tracking-widest">
                  Editing Module Content
                </span>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  {selectedModule.title}
                </h2>
                <p className="text-xs text-stone-600">{selectedModule.description}</p>
              </div>

              {/* Lessons list in module */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-semibold text-stone-900">Lessons in this Module</h4>
                </div>

                <div className="space-y-2">
                  {selectedModule.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <h5 className="font-semibold text-stone-900">{lesson.title}</h5>
                        <p className="text-stone-500 text-[11px]">{lesson.duration}</p>
                      </div>
                      <button
                        onClick={() => startEditLesson(lesson)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:text-stone-950 text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Lesson
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reflection Questions Manager */}
              <div className="pt-6 border-t border-stone-100 space-y-4">
                <h4 className="font-serif text-sm font-semibold text-stone-900">
                  Reflection Questions & Journal Prompts
                </h4>

                <div className="space-y-2">
                  {selectedModule.reflection_questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs flex items-start gap-2 text-stone-800"
                    >
                      <span className="font-bold text-rose-900 shrink-0">{idx + 1}.</span>
                      <span className="flex-1">{q.question}</span>
                    </div>
                  ))}
                </div>

                {/* Add new question */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Enter a new reflective inquiry..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-stone-900"
                  />
                  <button
                    onClick={handleAddReflectionQuestion}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Edit Modal */}
      {isEditingLesson && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-3xl p-8 border border-stone-200 shadow-2xl space-y-5">
            <h3 className="font-serif text-xl font-semibold text-stone-900">Edit Lesson Content</h3>
            <form onSubmit={saveLesson} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Duration Description</label>
                <input
                  type="text"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Lesson Text & Wisdom</label>
                <textarea
                  rows={6}
                  required
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditingLesson(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950 shadow"
                >
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
