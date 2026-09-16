'use client';

import { useState, useRef } from 'react';
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
  CheckCircle2,
  UploadCloud,
  Lock,
  Download,
  ExternalLink,
  FileCheck,
  X,
  Award,
  Layers,
  AlertCircle
} from 'lucide-react';
import { store } from '@/lib/store';
import { Programme, ProgrammeModule, ProgrammeLesson, ReflectionQuestion, ProgrammeBook } from '@/types';
import { createClient } from '@/utils/supabase/client';

import { getProgrammeById, saveProgramme } from '@/lib/programmes';

export default function AdminProgrammesPage() {
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  
  import { useEffect } from 'react';
  
  useEffect(() => {
    getProgrammeById('prog-guided-01').then((data) => {
      if (data) {
        setProgramme(data);
        if (data.modules && data.modules.length > 0) {
          setSelectedModuleId(data.modules[0].id);
        }
      } else {
        // Fallback or create new if not found
        console.warn('Programme not found in DB');
      }
      setIsLoading(false);
    });
  }, []);

  const selectedModule = programme?.modules.find((m) => m.id === selectedModuleId) || programme?.modules[0];

  const [isEditingLesson, setIsEditingLesson] = useState<ProgrammeLesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDuration, setLessonDuration] = useState('15 mins');
  const [lessonContent, setLessonContent] = useState('');

  const [newQuestionText, setNewQuestionText] = useState('');

  const [isEditingBook, setIsEditingBook] = useState(false);
  const [bookTitle, setBookTitle] = useState('Becoming Her: The Sacred Companion Workbook & Reflective Manifesto');
  const [bookAuthor, setBookAuthor] = useState('Lead Coach Zipporah Karanja');
  const [bookDescription, setBookDescription] = useState(
    'A structured 142-page digital workbook containing weekly reflective frameworks, habit architecture matrices, and somatic journaling exercises accompanying the Guided Digital Programme.'
  );
  const [bookPageCount, setBookPageCount] = useState<number>(142);
  const [bookCoverUrl, setBookCoverUrl] = useState(
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'
  );
  const [bookFileName, setBookFileName] = useState('becoming-her-companion-workbook.pdf');
  const [bookFileSize, setBookFileSize] = useState('8.4 MB');
  const [bookFileType, setBookFileType] = useState('PDF');
  const [bookFileUrl, setBookFileUrl] = useState('/materials/becoming-her-companion-workbook.pdf');
  
  useEffect(() => {
    if (programme?.book) {
      setBookTitle(programme.book.title);
      setBookAuthor(programme.book.author || '');
      setBookDescription(programme.book.description || '');
      setBookPageCount(programme.book.page_count || 0);
      setBookCoverUrl(programme.book.cover_image_url || '');
      setBookFileName(programme.book.file_name);
      setBookFileSize(programme.book.file_size || '');
      setBookFileType(programme.book.file_type || 'PDF');
      setBookFileUrl(programme.book.file_url);
    }
  }, [programme?.book]);

  const [bookNotification, setBookNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setBookNotification('Uploading file to storage...');

    try {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = `${sizeInMb} MB`;
      const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF';

      setBookFileName(file.name);
      setBookFileSize(sizeStr);
      setBookFileType(extension);

      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      setBookFileUrl(publicUrlData.publicUrl);
      setBookNotification(`File "${file.name}" (${sizeStr}) uploaded successfully. Click "Save Book Details" below.`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setBookNotification(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setBookNotification(null), 5000);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programme) return;

    const updatedBook = {
      id: programme.book?.id || `book-${Date.now()}`,
      programme_id: programme.id,
      title: bookTitle,
      author: bookAuthor,
      description: bookDescription,
      page_count: bookPageCount,
      cover_image_url: bookCoverUrl,
      file_name: bookFileName,
      file_size: bookFileSize,
      file_type: bookFileType,
      file_url: bookFileUrl,
      is_published: true,
      uploaded_at: programme.book?.uploaded_at || new Date().toISOString()
    };

    const updatedProgramme = { ...programme, book: updatedBook };
    setProgramme(updatedProgramme);
    await saveProgramme(updatedProgramme);
    
    setIsEditingBook(false);
    setBookNotification('Accompanying Programme Book saved & synced! Access is locked to paid members.');
    setTimeout(() => setBookNotification(null), 5000);
  };

  const handleRemoveBook = async () => {
    if (!programme) return;
    if (confirm('Are you sure you want to remove the accompanying book from this programme? Members will no longer be able to download it.')) {
      const updatedProgramme = { ...programme, book: null };
      setProgramme(updatedProgramme);
      await saveProgramme(updatedProgramme);
      
      setIsEditingBook(false);
      setBookNotification('Accompanying book removed from programme.');
      setTimeout(() => setBookNotification(null), 5000);
    }
  };

  const handleAddModule = async () => {
    if (!programme) return;
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
    const updatedProgramme = { ...programme, modules: updatedModules };
    
    setProgramme(updatedProgramme);
    setSelectedModuleId(newMod.id);
    await saveProgramme(updatedProgramme);
    store.addAuditLog('MODULE_CREATED', 'CURRICULUM', `New module created in ${programme.title}`);
  };

  const handleAddReflectionQuestion = async () => {
    if (!programme || !newQuestionText.trim() || !selectedModule) return;
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

    const updatedProgramme = { ...programme, modules: updatedModules };
    setProgramme(updatedProgramme);
    await saveProgramme(updatedProgramme);
    setNewQuestionText('');
    store.addAuditLog('REFLECTION_QUESTION_ADDED', 'CURRICULUM', `Question added to ${selectedModule.title}`);
  };

  const startEditLesson = (les: ProgrammeLesson) => {
    setIsEditingLesson(les);
    setLessonTitle(les.title);
    setLessonDuration(les.duration);
    setLessonContent(les.content);
  };

  const saveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programme || !isEditingLesson || !selectedModule) return;

    const updatedLessons = selectedModule.lessons.map((l) =>
      l.id === isEditingLesson.id
        ? { ...l, title: lessonTitle, duration: lessonDuration, content: lessonContent }
        : l
    );

    const updatedModules = programme.modules.map((m) =>
      m.id === selectedModule.id ? { ...m, lessons: updatedLessons } : m
    );

    const updatedProgramme = { ...programme, modules: updatedModules };
    setProgramme(updatedProgramme);
    await saveProgramme(updatedProgramme);
    
    setIsEditingLesson(null);
    store.addAuditLog('LESSON_UPDATED', 'CURRICULUM', `Lesson "${lessonTitle}" updated`);
  };

  if (isLoading || !programme) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-stone-400">Loading curriculum...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-900 bg-rose-100/70 px-2.5 py-0.5 rounded-full">
            Programme Administration
          </span>
          <h1 className="font-serif text-3xl font-semibold text-stone-900 mt-1">
            Curriculum & Book Architect
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Manage course curriculum, lesson frameworks, and the exclusive companion book locked behind paid enrollment.
          </p>
        </div>

        <button
          onClick={handleAddModule}
          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Module</span>
        </button>
      </div>

      {/* Global Notification Banner */}
      {bookNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{bookNotification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXCLUSIVE PROGRAMME BOOK / WORKBOOK UPLOAD SECTION                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-950 shrink-0 shadow-sm">
              <BookOpen className="w-6 h-6 text-rose-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-stone-900">
                  Accompanying Programme Book & Digital Workbook
                </h3>
                {programme.book ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Attached & Gated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                    <AlertCircle className="w-3 h-3" /> No Book Attached
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
                Upload an official workbook or reading companion for this programme. In accordance with platform access rules, this asset is <strong className="text-stone-900">strictly locked and accessible only after the customer purchases this service</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {programme.book && !isEditingBook && (
              <button
                type="button"
                onClick={() => setIsEditingBook(true)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Book Details
              </button>
            )}
            {!programme.book && !isEditingBook && (
              <button
                type="button"
                onClick={() => setIsEditingBook(true)}
                className="px-4 py-2 rounded-xl bg-rose-950 text-white hover:bg-rose-900 text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload Programme Book
              </button>
            )}
          </div>
        </div>

        {/* Current Book Display / Live Preview */}
        {programme.book && !isEditingBook && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-stone-50/70 p-5 rounded-2xl border border-stone-200/80 items-center">
            {/* Book Cover Visual */}
            <div className="md:col-span-3 flex justify-center">
              <div className="relative w-36 sm:w-40 aspect-[3/4] rounded-xl overflow-hidden shadow-md border-2 border-white group">
                <img
                  src={programme.book.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
                  alt={programme.book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-200">
                    {programme.book.file_type || 'PDF'}
                  </span>
                  <span className="text-[10px] font-semibold truncate">
                    {programme.book.page_count} Pages
                  </span>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="md:col-span-6 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-900">
                <Award className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Official Included Companion
                </span>
              </div>
              <h4 className="font-serif text-lg font-semibold text-stone-900">
                {programme.book.title}
              </h4>
              <p className="text-[11px] text-stone-500 font-medium">
                By {programme.book.author || 'Lead Coach Zipporah Karanja'}
              </p>
              <p className="text-stone-600 leading-relaxed line-clamp-3">
                {programme.book.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-stone-500 font-mono">
                <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-stone-400" />
                  {programme.book.file_name}
                </span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                  {programme.book.file_size}
                </span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                  {programme.book.page_count} Pages
                </span>
              </div>
            </div>

            {/* Admin Actions & Security Enforcement Info */}
            <div className="md:col-span-3 flex flex-col gap-2.5 text-xs justify-center border-t md:border-t-0 md:border-l border-stone-200 md:pl-6 pt-4 md:pt-0">
              <div className="bg-white p-3 rounded-xl border border-stone-200/80 space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-950">
                  <Lock className="w-3.5 h-3.5 text-rose-800" />
                  <span>Access Control Rule</span>
                </div>
                <p className="text-[10px] text-stone-500 leading-normal">
                  Protected via <code className="bg-stone-100 px-1 py-0.5 rounded">/api/programmes/[id]/book</code>. Unauthenticated users receive HTTP 403.
                </p>
              </div>

              <a
                href={`/api/programmes/${programme.id}/book?download=1`}
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-2 rounded-xl bg-stone-900 text-amber-50 hover:bg-rose-950 transition flex items-center justify-center gap-1.5 font-semibold text-[11px] shadow-sm text-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Test Download File</span>
              </a>

              <button
                type="button"
                onClick={handleRemoveBook}
                className="w-full px-3 py-1.5 rounded-xl border border-rose-200 text-rose-800 hover:bg-rose-50 transition text-[11px] font-medium flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Book</span>
              </button>
            </div>
          </div>
        )}

        {/* Book Upload & Edit Form Modal / Card */}
        {isEditingBook && (
          <form onSubmit={handleSaveBook} className="p-6 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-5">
            <div className="flex items-center justify-between border-b border-rose-200/60 pb-3">
              <div className="space-y-0.5">
                <h4 className="font-serif text-base font-semibold text-stone-900">
                  {programme.book ? 'Edit Accompanying Book Details' : 'Upload Accompanying Programme Book'}
                </h4>
                <p className="text-[11px] text-stone-600">
                  Supported formats: PDF, EPUB, or document file. This file will unlock automatically when a member completes payment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingBook(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-rose-100/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dropzone Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-800">
                Book / Workbook File (PDF or EPUB)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-rose-300 hover:border-rose-500 bg-white p-6 rounded-2xl text-center cursor-pointer transition hover:bg-rose-50/50 flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-900 group-hover:scale-110 transition">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-900">
                    Click to browse or drag & drop the book file here
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Recommended: PDF or EPUB document up to 50MB
                  </p>
                </div>
                {bookFileName && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selected: {bookFileName} ({bookFileSize})</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.epub,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-stone-700">Book Title</label>
                <input
                  type="text"
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="e.g. Becoming Her: The Sacred Companion Workbook & Reflective Manifesto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Author / Coach</label>
                <input
                  type="text"
                  required
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="e.g. Lead Coach Zipporah Karanja"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Estimated Page Count</label>
                <input
                  type="number"
                  min="1"
                  value={bookPageCount}
                  onChange={(e) => setBookPageCount(parseInt(e.target.value) || 1)}
                  placeholder="e.g. 142"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-stone-700">Cover Image URL</label>
                <input
                  type="url"
                  value={bookCoverUrl}
                  onChange={(e) => setBookCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-stone-700">Book Description & Key Takeaways</label>
                <textarea
                  rows={3}
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  placeholder="Describe the exercises, reflection prompts, and weekly frameworks included in this workbook..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-200/60">
              <button
                type="button"
                onClick={() => setIsEditingBook(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200/60 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-rose-950 text-white text-xs font-semibold hover:bg-rose-900 transition flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Book Details & Enable Lock</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODULE & CURRICULUM ARCHITECT                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Module Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-stone-500" />
              <span>Programme Modules</span>
            </h3>
            <span className="text-xs text-stone-500">
              {programme.modules.length} Stages
            </span>
          </div>

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

              {/* Reflection Questions */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <h4 className="font-serif text-sm font-semibold text-stone-900">
                  Guided Reflection Questions
                </h4>
                <div className="space-y-2">
                  {selectedModule.reflection_questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-start gap-2"
                    >
                      <span className="font-bold text-rose-900">{qIdx + 1}.</span>
                      <p className="text-stone-700 font-medium leading-relaxed">{q.question}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add another deep reflection inquiry prompt..."
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-1 focus:ring-rose-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddReflectionQuestion}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition"
                  >
                    Add Question
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
