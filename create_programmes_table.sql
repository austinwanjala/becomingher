-- Drop if exists to ensure a fresh schema
DROP TABLE IF EXISTS public.programmes CASCADE;

-- Create Programmes Table
CREATE TABLE public.programmes (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    description TEXT NOT NULL,
    overview TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    book JSONB,
    modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow public read access to all published programmes
CREATE POLICY "Enable read access for all users" ON public.programmes
    FOR SELECT
    USING (is_published = true);

-- Allow admins full access to programmes
CREATE POLICY "Enable full access for all users" ON public.programmes
    FOR ALL
    USING (true);

-- Seed Data (Optional, based on store.ts)
INSERT INTO public.programmes (id, service_id, title, subtitle, description, overview, image_url, is_published, book, modules)
VALUES 
(
    'prog-guided-01',
    'srv-guided-01',
    'Becoming Her: The Guided Journey',
    'Step into Alignment, Purpose, and Unwavering Confidence',
    'A transformative four-stage framework empowering you to release past constraints, define your authentic core identity, and embody the woman you aspire to be.',
    'Welcome to your sacred space of transformation. Over the next four modules, you will explore who you were, realign with who you are, and intentionally author the woman you are becoming.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    true,
    NULL,
    '[
      {
        "id": "mod-1",
        "programme_id": "prog-guided-01",
        "title": "Module 1: The Awakening & Unlearning",
        "description": "Examine the inherited narratives, limiting beliefs, and external expectations that no longer serve your evolution.",
        "order": 1,
        "lessons": [
          {
            "id": "les-1-1",
            "title": "Welcome & Intentional Foundations",
            "duration": "12 mins",
            "description": "Setting sacred intentions for your personal growth journey and establishing a routine for reflection.",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "content": "True transformation begins with unconditional radical honesty. Before we step into the woman you are becoming, we must honor the woman who brought you here. Take a deep breath and ground yourself in this moment. You are not starting from scratch; you are starting from wisdom.",
            "order": 1
          },
          {
            "id": "les-1-2",
            "title": "Deconstructing Limiting Scripts",
            "duration": "18 mins",
            "description": "Identifying childhood and cultural conditioning around perfectionism, people-pleasing, and silence.",
            "content": "Notice the words you use when speaking about your potential. When you tell yourself \"I am not ready,\" whose voice is that really? In this lesson, we isolate fear-based beliefs from your authentic truth.",
            "order": 2
          },
          {
            "id": "les-1-3",
            "title": "The Power of Emotional Boundaries",
            "duration": "15 mins",
            "description": "Creating energetic boundaries to preserve your focus, peace, and self-respect.",
            "content": "Boundaries are not walls; they are doors with locks. You choose who enters and who remains on the outside. Learn how to say a guilt-free \"No\" to protect your sacred \"Yes\".",
            "order": 3
          }
        ],
        "reflection_questions": [
          {
            "id": "ref-1-1",
            "question": "What belief about yourself have you outgrown, yet still find yourself subconsciously carrying?",
            "placeholder": "Write your honest reflection here...",
            "order": 1
          },
          {
            "id": "ref-1-2",
            "question": "Where in your life are you over-functioning or people-pleasing at the expense of your peace?",
            "placeholder": "Detail situations, relationships, or work demands...",
            "order": 2
          }
        ]
      },
      {
        "id": "mod-2",
        "programme_id": "prog-guided-01",
        "title": "Module 2: The Core Identity & Self-Concept",
        "description": "Anchor into your core values, rebuild self-trust, and calibrate your daily self-talk.",
        "order": 2,
        "lessons": [
          {
            "id": "les-2-1",
            "title": "Clarifying Your Non-Negotiable Values",
            "duration": "16 mins",
            "description": "Discovering the 5 bedrock values that govern your highest decisions and life direction.",
            "content": "When values are clear, decisions are effortless. We map out your core hierarchy of values to eliminate decision fatigue and regret.",
            "order": 1
          },
          {
            "id": "les-2-2",
            "title": "The Identity Shift: Embodying Her Today",
            "duration": "22 mins",
            "description": "Bridging the gap between your present self and the future version of you.",
            "content": "You do not attract what you want; you attract what you embody. We begin practicing somatic and behavioral habits of your future self in real-time today.",
            "order": 2
          }
        ],
        "reflection_questions": [
          {
            "id": "ref-2-1",
            "question": "If you had absolute guaranteed success, how would you behave differently today?",
            "placeholder": "Imagine a day in the life of your most embodied self...",
            "order": 1
          }
        ]
      },
      {
        "id": "mod-3",
        "programme_id": "prog-guided-01",
        "title": "Module 3: Purpose, Vision & Daily Architecture",
        "description": "Design a life architecture that effortlessly supports your highest vision.",
        "order": 3,
        "lessons": [
          {
            "id": "les-3-1",
            "title": "Designing Sacred Routines",
            "duration": "14 mins",
            "description": "Morning and evening rituals that anchor your nervous system.",
            "content": "How you begin and end your day sets the energetic frequency of your entire life. We construct simple, sustainable rituals tailored to your nervous system.",
            "order": 1
          },
          {
            "id": "les-3-2",
            "title": "Audacious Goals & Gentle Execution",
            "duration": "20 mins",
            "description": "Setting high standards while maintaining a culture of self-compassion.",
            "content": "Ambition and burnout do not have to be synonymous. Learn to pursue audacious goals from a place of abundance rather than lack.",
            "order": 2
          }
        ],
        "reflection_questions": [
          {
            "id": "ref-3-1",
            "question": "What is one bold desire you have whispered in secret that you are now ready to declare out loud?",
            "placeholder": "I am ready to...",
            "order": 1
          }
        ]
      },
      {
        "id": "mod-4",
        "programme_id": "prog-guided-01",
        "title": "Module 4: Integration, Elevation & Sovereignty",
        "description": "Solidify your new operational baseline and prepare for inevitable growth edges.",
        "order": 4,
        "lessons": [
          {
            "id": "les-4-1",
            "title": "Navigating Growth Edges & Relapses",
            "duration": "18 mins",
            "description": "How to handle triggers and moments when you slip back into old patterns.",
            "content": "Relapse into old behaviors is a natural part of integration. The goal is not perfection; it is shortening the recovery time. We build your personal anchor plan.",
            "order": 1
          },
          {
            "id": "les-4-2",
            "title": "Your Becoming Her Manifesto",
            "duration": "10 mins",
            "description": "Finalizing your transformation journey and declaring your new normal.",
            "content": "You are now authoring the next chapter. This final lesson brings all the frameworks together into your personalized, living manifesto.",
            "order": 2
          }
        ],
        "reflection_questions": [
          {
            "id": "ref-4-1",
            "question": "What promise will you make to yourself today as you step into your sovereignty?",
            "placeholder": "I promise myself that...",
            "order": 1
          }
        ]
      }
    ]'::jsonb
) ON CONFLICT (id) DO NOTHING;
