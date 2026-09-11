'use client';

import { useState } from 'react';
import {
  Sparkles,
  Send,
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  ClipboardList,
  AlertCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { store } from '@/lib/store';
import { Goal } from '@/types';

export default function CoachingDashboardPage() {
  const customerId = 'cust-demo-01';

  // AI Chat state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Welcome to your sacred coaching room, Grace. 

I am here to walk alongside you as your Becoming Her Sanctuary Companion. I have access to your active programme reflections and your core goals. 

How is your spirit feeling today, and what area of your personal elevation would you like to explore together?`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Goals state
  const [goals, setGoals] = useState<Goal[]>(store.goals);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Personal Sovereignty');
  const [newGoalDate, setNewGoalDate] = useState('2026-10-15');
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Onboarding Questionnaire state (For Customized Coaching)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [qAnswers, setQAnswers] = useState({
    life_area: 'Career Leadership & Boundaries',
    challenge: 'Saying yes to too many demands and feeling stretched thin.',
    goals: 'Learn to say no with peace; lead our upcoming division launch.',
    support_pref: 'Gentle inquiry with structured weekly accountability.'
  });
  const [onboardingSaved, setOnboardingSaved] = useState(false);

  // Send message to AI coaching API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    const updatedMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext: {
            name: 'Grace Mwangi',
            programme: 'Guided Digital Coaching Programme',
            goals: goals.map((g) => g.title).join(', ')
          }
        })
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I am here with you, beloved. Take a deep breath. Let us re-focus on the quiet wisdom inside your heart.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAskPrompt = async (promptText: string) => {
    if (isSending) return;
    const updatedMessages = [...messages, { role: 'user' as const, content: promptText }];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext: {
            name: 'Grace Mwangi',
            programme: 'Guided Digital Coaching Programme',
            goals: goals.map((g) => g.title).join(', ')
          }
        })
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I am here with you, beloved. Take a deep breath. Let us re-focus on the quiet wisdom inside your heart.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleActionStep = (goalId: string, actionId: string) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        if (goal.id !== goalId) return goal;
        const updatedSteps = goal.action_steps.map((step) =>
          step.id === actionId ? { ...step, is_completed: !step.is_completed } : step
        );
        const completedCount = updatedSteps.filter((s) => s.is_completed).length;
        const newProgress = Math.round((completedCount / updatedSteps.length) * 100);
        return {
          ...goal,
          action_steps: updatedSteps,
          progress: newProgress,
          status: newProgress === 100 ? 'COMPLETED' : 'IN_PROGRESS'
        };
      })
    );
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      user_id: customerId,
      title: newGoalTitle,
      description: 'Defined during coaching session',
      category: newGoalCategory,
      target_date: newGoalDate,
      status: 'IN_PROGRESS',
      progress: 0,
      action_steps: [
        { id: 'act-1', text: 'Define 3 concrete boundaries around this milestone', is_completed: false },
        { id: 'act-2', text: 'Schedule weekly accountability review with coaching companion', is_completed: false }
      ],
      created_at: new Date().toISOString()
    };

    setGoals([newGoal, ...goals]);
    store.goals.unshift(newGoal);
    setNewGoalTitle('');
    setShowGoalModal(false);
  };

  const handleSaveOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingSaved(true);
    
    // Save to centralized store so AI chatbot and WhatsApp bot can answer questions on it in real time
    store.questionnaires[customerId] = {
      user_id: customerId,
      life_area: qAnswers.life_area,
      challenge: qAnswers.challenge,
      current_challenge: qAnswers.challenge,
      goals: qAnswers.goals,
      current_goals: qAnswers.goals,
      support_pref: qAnswers.support_pref,
      support_preference: qAnswers.support_pref,
      completed_at: new Date().toISOString()
    };
    store.questionnaires['cust-demo-01'] = store.questionnaires[customerId];

    setTimeout(() => {
      setShowOnboardingModal(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Thank you for completing your customized onboarding assessment, Grace. I have updated your profile with your focus on "${qAnswers.life_area}" and your desire to navigate "${qAnswers.challenge}". Let us step intentionally into this journey.`
        }
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">
            Sanctuary Reflection & Goal Mastery
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            A 24/7 confidential development companion calibrated to your life goals and programme reflections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOnboardingModal(true)}
            className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold hover:bg-stone-50 transition shadow-sm flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5 text-rose-800" />
            <span>Onboarding Profile</span>
          </button>

          <button
            onClick={() => setShowGoalModal(true)}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950 transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Coaching Room (Chat Interface) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF8F5]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-950 text-amber-200 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-sm text-stone-900">Sanctuary Reflection Companion</h3>
                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Session
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    role: 'assistant',
                    content: 'Starting a fresh coaching session. What is present for you right now, beloved?'
                  }
                ]);
              }}
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> New Session
            </button>
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-100 text-[11px] text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Coaching assistant for personal development only. Not therapy or medical care.</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-rose-950 text-amber-200 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-stone-900 text-amber-50 rounded-tr-none shadow'
                      : 'bg-[#FAF8F5] text-stone-800 rounded-tl-none border border-stone-200/70'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-2 items-center text-xs text-stone-400 italic pl-10">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-800" />
                <span>Reflecting on your intention...</span>
              </div>
            )}
          </div>

          {/* Suggested Coaching Topics */}
          <div className="px-4 py-2 bg-stone-50/80 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <span className="text-stone-400 shrink-0 font-medium mr-1">Ask:</span>
            {[
              'How do I overcome imposter syndrome?',
              'How do I set boundaries without guilt?',
              'Give me a journaling prompt for today',
              'How do I navigate burnout & rest?',
              'How do I book a 1-on-1 session with Coach Zipporah?'
            ].map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAskPrompt(prompt)}
                disabled={isSending}
                className="shrink-0 px-3 py-1 rounded-full bg-white hover:bg-rose-50 hover:text-rose-900 border border-stone-200 text-stone-700 transition disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-stone-100 bg-[#FAF8F5] flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question, share a reflection, or explore a challenge..."
              className="flex-1 px-4 py-3 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-950/20 bg-white"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="px-4 py-3 rounded-xl bg-stone-900 text-white hover:bg-rose-950 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Goal Tracking & Action Steps */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-800" /> Active Milestones & Goals
              </h3>
              <span className="text-xs text-stone-500 font-medium">{goals.length} Goals</span>
            </div>

            <div className="space-y-4">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-widest">
                        {goal.category}
                      </span>
                      <h4 className="font-serif text-sm font-semibold text-stone-900">{goal.title}</h4>
                      <p className="text-[11px] text-stone-500">{goal.description}</p>
                    </div>
                    <span className="text-[10px] text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200 shrink-0">
                      Target: {goal.target_date}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-stone-600">
                      <span>Progress</span>
                      <span className="font-semibold">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-900 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action steps with checkboxes */}
                  <div className="pt-2 border-t border-stone-200/70 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
                      Action Steps:
                    </span>
                    {goal.action_steps.map((step) => (
                      <button
                        key={step.id}
                        onClick={() => handleToggleActionStep(goal.id, step.id)}
                        className="w-full text-left flex items-start gap-2 text-xs text-stone-700 hover:text-stone-950"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border mt-0.5 flex items-center justify-center ${
                            step.is_completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-400 bg-white'
                          }`}
                        >
                          {step.is_completed && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <span className={step.is_completed ? 'line-through text-stone-400' : ''}>
                          {step.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-6">
            <h3 className="font-serif text-xl font-semibold text-stone-900">Author a New Sacred Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Implement daily 20-minute sacred journaling"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700">Category</label>
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                >
                  <option value="Personal Sovereignty">Personal Sovereignty</option>
                  <option value="Career & Leadership">Career & Leadership</option>
                  <option value="Emotional Peace & Boundaries">Emotional Peace & Boundaries</option>
                  <option value="Spiritual Well-being">Spiritual Well-being</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700">Target Date</label>
                <input
                  type="date"
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-rose-950"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Questionnaire Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-stone-900">Customized Onboarding Assessment</h3>
              <p className="text-xs text-stone-500">Your answers inform your personalized coaching and reflection roadmaps.</p>
            </div>

            <form onSubmit={handleSaveOnboarding} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800">1. Area of life for support:</label>
                <input
                  type="text"
                  value={qAnswers.life_area}
                  onChange={(e) => setQAnswers({ ...qAnswers, life_area: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800">2. Current challenge or block:</label>
                <textarea
                  rows={2}
                  value={qAnswers.challenge}
                  onChange={(e) => setQAnswers({ ...qAnswers, challenge: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800">3. Goals for the next 90 days:</label>
                <textarea
                  rows={2}
                  value={qAnswers.goals}
                  onChange={(e) => setQAnswers({ ...qAnswers, goals: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800">4. Support style preference:</label>
                <input
                  type="text"
                  value={qAnswers.support_pref}
                  onChange={(e) => setQAnswers({ ...qAnswers, support_pref: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowOnboardingModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-rose-950"
                >
                  {onboardingSaved ? 'Profile Updated!' : 'Save & Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
