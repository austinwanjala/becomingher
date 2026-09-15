'use client';

import { useState } from 'react';
import { Brain, Plus, Trash2, Edit2, Save, Heart, BookOpen, ShieldCheck } from 'lucide-react';
import { store } from '@/lib/store';
import { KnowledgeDocument } from '@/types';

export default function AdminKnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>(store.knowledgeBase);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'FRAMEWORK' | 'METHODOLOGY' | 'FAQ' | 'EXERCISE' | 'POLICY'>('FRAMEWORK');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('transformation, framework');

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newDoc: KnowledgeDocument = {
      id: `kb-${Date.now()}`,
      title: title.trim(),
      category,
      content: content.trim(),
      tags: tags.split(',').map((t) => t.trim().toLowerCase()),
      is_published: true,
      updated_at: new Date().toISOString()
    };

    const updated = [newDoc, ...docs];
    setDocs(updated);
    store.knowledgeBase = updated;
    store.addAuditLog('KNOWLEDGE_BASE_ADDED', 'AI_KNOWLEDGE', `Document "${title}" added to AI Knowledge Base`);
    setIsCreating(false);
    setTitle('');
    setContent('');
  };

  const handleDelete = (id: string) => {
    const updated = docs.filter((d) => d.id !== id);
    setDocs(updated);
    store.knowledgeBase = updated;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Sanctuary Knowledge Base & Frameworks
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Approved coaching methodologies and policies that ground the Sanctuary Digital Companion.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Knowledge Document</span>
        </button>
      </div>

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  {doc.category}
                </span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-stone-400 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-serif text-lg font-semibold text-stone-900">{doc.title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans line-clamp-4">
                {doc.content}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
              <div className="flex items-center gap-1">
                <span>Tags:</span>
                {doc.tags.map((tag, idx) => (
                  <span key={idx} className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px] text-stone-700">
                    #{tag}
                  </span>
                ))}
              </div>
              <span>Active RAG Context</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Document Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-3xl p-8 border border-stone-200 shadow-2xl space-y-5">
            <h3 className="font-serif text-xl font-semibold text-stone-900">
              Add Approved Knowledge Document
            </h3>

            <form onSubmit={handleCreateDoc} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Navigating Corporate Transition Framework"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="FRAMEWORK">FRAMEWORK</option>
                  <option value="METHODOLOGY">METHODOLOGY</option>
                  <option value="FAQ">FAQ</option>
                  <option value="EXERCISE">EXERCISE</option>
                  <option value="POLICY">POLICY</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Core Content / Guidance / Script</label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the approved methodology or instructions the companion must strictly adhere to..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-stone-700">Tags (Comma-separated keywords for retrieval)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
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
                  Save to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
