-- =========================================================================
-- BECOMING HER — Complete Supabase PostgreSQL Schema & Initial Seed Data
-- Run this entire script inside your Supabase Dashboard -> SQL Editor
-- Completely safe & non-destructive: zero DROP statements & no custom ENUMs!
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES (Extends Supabase auth.users - Uses UUID matching auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'CUSTOMER',
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2B. ROLES & USER_ROLES TABLES
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);

-- Seed System Roles
INSERT INTO public.roles (id, name, description)
VALUES
  ('SUPER_ADMIN', 'Super Administrator', 'Full administrative authority and platform control'),
  ('ADMIN', 'Administrator', 'Administrative portal access to manage content, clients, and WhatsApp AI bot'),
  ('COACH', 'Coach', 'Coaching calendar, 1-on-1 calls, and client progress management'),
  ('CUSTOMER', 'Customer', 'Client enrolled in guided or custom programmes')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 3. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  image_url TEXT,
  duration TEXT,
  features TEXT[] DEFAULT '{}',
  selar_product_id TEXT,
  selar_product_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS (Permanent Ledger)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_reference TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
  service_title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  payment_method TEXT DEFAULT 'SELAR_PAYSTACK',
  payment_status TEXT DEFAULT 'PENDING',
  payment_reference TEXT,
  idempotency_key TEXT UNIQUE,
  discount_amount NUMERIC DEFAULT 0,
  coupon_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENTITLEMENTS (Customer Access Rights)
CREATE TABLE IF NOT EXISTS public.entitlements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES public.services(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'ACTIVE',
  progress_percentage INT DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROGRAMMES, MODULES, & LESSONS
CREATE TABLE IF NOT EXISTS public.programmes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  service_id TEXT REFERENCES public.services(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  overview TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.programme_modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  programme_id TEXT REFERENCES public.programmes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES public.programme_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT,
  description TEXT,
  content TEXT,
  video_url TEXT,
  audio_url TEXT,
  pdf_url TEXT,
  "order" INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REFLECTIONS & JOURNALING
CREATE TABLE IF NOT EXISTS public.reflection_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES public.programme_modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  placeholder TEXT,
  "order" INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.reflections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  programme_id TEXT REFERENCES public.programmes(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES public.programme_modules(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES public.reflection_questions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COACHES & INTERPERSONAL BOOKINGS
CREATE TABLE IF NOT EXISTS public.coaches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  available_days TEXT[],
  session_duration_minutes INT DEFAULT 60
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  coach_id TEXT REFERENCES public.coaches(id) ON DELETE CASCADE,
  coach_name TEXT,
  service_id TEXT REFERENCES public.services(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  timezone TEXT DEFAULT 'Africa/Nairobi (EAT)',
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_status TEXT DEFAULT 'PENDING',
  booking_status TEXT DEFAULT 'PENDING_PAYMENT',
  meeting_link TEXT,
  reservation_expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anti-double-booking unique index for confirmed / pending holds
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_coach_slot 
ON public.bookings (coach_id, scheduled_date, start_time) 
WHERE booking_status IN ('CONFIRMED', 'PENDING_PAYMENT');

-- 9. GOAL TRACKING
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_date DATE,
  status TEXT DEFAULT 'IN_PROGRESS',
  progress INT DEFAULT 0,
  action_steps JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AI KNOWLEDGE BASE & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  programme_id TEXT REFERENCES public.programmes(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10B. WHATSAPP BUSINESS & AI CHATBOT TABLES
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone_number TEXT UNIQUE NOT NULL,
  whatsapp_user_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  profile_data JSONB DEFAULT '{}',
  first_interaction TIMESTAMPTZ DEFAULT NOW(),
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contact_id TEXT REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  state TEXT DEFAULT 'NEW_VISITOR',
  status TEXT DEFAULT 'BOT',
  recommended_service TEXT,
  intended_service TEXT,
  summary TEXT,
  session_token TEXT,
  message_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  message_type TEXT DEFAULT 'TEXT',
  content TEXT NOT NULL,
  whatsapp_message_id TEXT,
  ai_generated BOOLEAN DEFAULT false,
  interactive_options TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id TEXT PRIMARY KEY DEFAULT 'default-config',
  phone_number_id TEXT,
  business_account_id TEXT,
  business_number TEXT,
  webhook_verify_token TEXT,
  welcome_message TEXT,
  ai_personality TEXT,
  business_hours TEXT,
  human_handoff_enabled BOOLEAN DEFAULT true,
  automated_reminders_enabled BOOLEAN DEFAULT true,
  reminder_24h_template TEXT,
  reminder_1h_template TEXT,
  payment_confirmation_template TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ENABLE ROW-LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- 12. RLS POLICIES
DROP POLICY IF EXISTS "Allow read access to roles" ON public.roles;
CREATE POLICY "Allow read access to roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access to user_roles" ON public.user_roles;
CREATE POLICY "Allow read access to user_roles" ON public.user_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all on user_roles" ON public.user_roles;
CREATE POLICY "Allow all on user_roles" ON public.user_roles FOR ALL USING (true);

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Services (Public can view active)
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services FOR SELECT USING (is_active = true);

-- Programmes & Lessons (Public can view published)
DROP POLICY IF EXISTS "Public can view published programmes" ON public.programmes;
CREATE POLICY "Public can view published programmes" ON public.programmes FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public can view modules" ON public.programme_modules;
CREATE POLICY "Public can view modules" ON public.programme_modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view lessons" ON public.lessons;
CREATE POLICY "Public can view lessons" ON public.lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view reflection questions" ON public.reflection_questions;
CREATE POLICY "Public can view reflection questions" ON public.reflection_questions FOR SELECT USING (true);

-- Orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);

-- Entitlements
DROP POLICY IF EXISTS "Users can view own entitlements" ON public.entitlements;
CREATE POLICY "Users can view own entitlements" ON public.entitlements FOR SELECT USING (auth.uid() = customer_id);

-- Reflections & Goals
DROP POLICY IF EXISTS "Users can manage own reflections" ON public.reflections;
CREATE POLICY "Users can manage own reflections" ON public.reflections FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- Bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);

-- 13. AUTO-PROFILE & ROLE TRIGGER ON USER CREATION
-- Users created directly under Supabase Authentication -> ADMIN
-- Users registered via the public customer portal (/register) -> CUSTOMER
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  user_name TEXT;
BEGIN
  user_name := COALESCE(new.raw_user_meta_data->>'name', 'Member');

  -- If created directly from Supabase Dashboard Authentication, assign ADMIN.
  -- Only users registering via the public customer portal (/register) have registered_via = 'customer'.
  IF (new.raw_user_meta_data->>'registered_via' = 'customer') OR (new.raw_user_meta_data->>'source' = 'website') THEN
    assigned_role := 'CUSTOMER';
  ELSE
    assigned_role := 'ADMIN';
  END IF;

  -- Insert/update profiles safely (supports both TEXT and legacy user_role ENUM)
  BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (new.id, user_name, assigned_role)
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      EXECUTE 'INSERT INTO public.profiles (id, full_name, role) VALUES ($1, $2, $3::user_role) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role'
      USING new.id, user_name, assigned_role;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, assigned_role)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Sync raw_app_meta_data for JWT presence
  new.raw_app_meta_data := jsonb_set(COALESCE(new.raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb(assigned_role));

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-promote any existing Supabase Auth users to ADMIN
INSERT INTO public.user_roles (user_id, role_id)
SELECT id, 'ADMIN' FROM auth.users
ON CONFLICT (user_id, role_id) DO NOTHING;

UPDATE public.profiles
SET role = 'ADMIN'
WHERE id IN (SELECT id FROM auth.users);

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"ADMIN"');

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

-- Seed 3 Main Services
INSERT INTO public.services (id, slug, type, name, short_description, description, price, currency, image_url, duration, features, selar_product_id, selar_product_url, is_active, is_featured)
VALUES 
(
  'srv-guided-01',
  'guided-coaching',
  'DIGITAL_PROGRAMME',
  'Guided Digital Coaching Programme',
  'A 4-week structured transformative coaching journey designed for women stepping into clarity, intentionality, and personal mastery.',
  'The Guided Digital Coaching Programme is an immersive, self-paced yet deeply guided development experience.',
  1000,
  'KES',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
  '4 Modules (Self-Paced / 4 Weeks)',
  ARRAY['4 Comprehensive Modules & 12 Guided Lessons', 'Interactive Reflection Prompts & Digital Journaling', 'Downloadable Resources', 'Integrated 24/7 AI Coach', 'Lifetime Access'],
  'v09683c927',
  'https://selar.com/v09683c927',
  true,
  true
),
(
  'srv-custom-02',
  'custom-coaching',
  'CUSTOM_COACHING',
  'Customized Digital Coaching Programme',
  'A bespoke coaching experience curated uniquely around your individual life vision, challenges, and goals with personalized AI-driven guidance.',
  'Receive a personalized digital coaching curriculum crafted specifically for your journey.',
  1500,
  'KES',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800',
  'Personalized 8-Week Roadmap',
  ARRAY['Deep Life Assessment', 'Customized Curriculum', 'Personalized AI Companion', 'Weekly Milestone Reviews', 'Unlimited Accountability'],
  'v09683c927',
  'https://selar.com/v09683c927',
  true,
  true
),
(
  'srv-interpersonal-03',
  'interpersonal-coaching',
  'INTERPERSONAL_SESSION',
  'Interpersonal Daytime Coaching Session',
  'An intimate 60-minute 1-on-1 video coaching session with Lead Coach Zipporah Karanja to gain breakthrough clarity and strategic direction.',
  'Step into a confidential, focused, and deeply empowering 1-on-1 space with a professional coach.',
  2500,
  'KES',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
  '60 Minutes (Live Video)',
  ARRAY['Private 60-Min Video with Zipporah Karanja', 'Anti-Double Booking Live Slot Hold', 'Instant Google Meet Delivery', 'Post-Session Action Plan'],
  'v09683c927',
  'https://selar.com/v09683c927',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Seed Lead Coach Zipporah Karanja
INSERT INTO public.coaches (id, name, title, bio, avatar_url, email, phone, available_days, session_duration_minutes)
VALUES (
  'coach-zipporah-01',
  'Zipporah Karanja',
  'Founder & Certified Women’s Transformation Coach',
  'Zipporah is an internationally certified executive and personal development coach who has guided hundreds of women across East Africa and beyond.',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
  'zipporah@becomingher.co.ke',
  '+254 700 000 000',
  ARRAY['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
  60
)
ON CONFLICT (id) DO NOTHING;

-- Seed Guided Programme
INSERT INTO public.programmes (id, service_id, title, subtitle, description, overview, image_url, is_published)
VALUES (
  'prog-guided-01',
  'srv-guided-01',
  'Becoming Her: The Guided Journey',
  'Step into Alignment, Purpose, and Unwavering Confidence',
  'A transformative four-stage framework empowering you to release past constraints, define your authentic core identity, and embody the woman you aspire to be.',
  'Welcome to your sacred space of transformation. Over the next four modules, you will explore who you were, realign with who you are, and intentionally author the woman you are becoming.',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Seed Modules
INSERT INTO public.programme_modules (id, programme_id, title, description, "order")
VALUES
('mod-1', 'prog-guided-01', 'Module 1: The Awakening & Unlearning', 'Examine the inherited narratives, limiting beliefs, and external expectations that no longer serve your evolution.', 1),
('mod-2', 'prog-guided-01', 'Module 2: The Core Identity & Self-Concept', 'Anchor into your core values, rebuild self-trust, and calibrate your daily self-talk.', 2),
('mod-3', 'prog-guided-01', 'Module 3: Purpose, Vision & Daily Rituals', 'Translate lofty dreams into concrete daily micro-habits, rituals, and creative flow states.', 3),
('mod-4', 'prog-guided-01', 'Module 4: Integration, Elevation & Sovereignty', 'Sustain your growth, navigate setbacks with grace, and walk in perpetual alignment.', 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Lessons
INSERT INTO public.lessons (id, module_id, title, duration, description, content, "order")
VALUES
('les-1-1', 'mod-1', 'Welcome & Intentional Foundations', '12 mins', 'Setting sacred intentions for your personal growth journey.', 'True transformation begins with unconditional radical honesty. Before we step into the woman you are becoming, we must honor the woman who brought you here. Ground yourself in this moment.', 1),
('les-1-2', 'mod-1', 'Deconstructing Limiting Scripts', '18 mins', 'Identifying childhood and cultural conditioning around perfectionism.', 'Notice the words you use when speaking about your potential. When you tell yourself "I am not ready," whose voice is that really? In this lesson, we isolate fear-based beliefs.', 2),
('les-1-3', 'mod-1', 'The Power of Emotional Boundaries', '15 mins', 'Creating energetic boundaries to preserve your focus and peace.', 'Boundaries are not walls; they are doors with locks. You choose who enters and who remains on the outside.', 3),
('les-2-1', 'mod-2', 'Clarifying Your Non-Negotiable Values', '16 mins', 'Discovering the 5 bedrock values that govern your decisions.', 'When values are clear, decisions are effortless. We map out your core hierarchy of values to eliminate decision fatigue.', 1),
('les-2-2', 'mod-2', 'The Identity Shift: Embodying Her Today', '22 mins', 'Bridging the gap between your present self and future self.', 'You do not attract what you want; you attract what you embody. We begin practicing habits of your future self today.', 2),
('les-3-1', 'mod-3', 'Designing Sacred Morning & Evening Architecture', '14 mins', 'Crafting rituals that protect mental clarity.', 'How you start your day determines your sovereignty. Learn how to reclaim the first 60 minutes from digital clutter.', 1),
('les-3-2', 'mod-3', 'Audacious Goals with Gentle Execution', '20 mins', 'Goal-setting through feminine flow and ease.', 'Feminine ambition is not about exhaustion or hustle culture. It is rooted in ease, strategy, and self-compassion.', 2),
('les-4-1', 'mod-4', 'Navigating Triggers & Old Relapses', '19 mins', 'Building psychological resilience against setbacks.', 'Growth is cyclical, not linear. When you experience a setback, it is not failure; it is an invitation for deeper integration.', 1),
('les-4-2', 'mod-4', 'Your Manifesto: Living as Her', '25 mins', 'Writing and committing to your Becoming Her Manifesto.', 'This is your graduation into sovereignty. You now possess the inner compass and emotional tools to flourish permanently.', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed Reflection Questions
INSERT INTO public.reflection_questions (id, module_id, question, placeholder, "order")
VALUES
('ref-1-1', 'mod-1', 'What belief about yourself have you outgrown, yet still find yourself subconsciously carrying?', 'Write your honest reflection here...', 1),
('ref-1-2', 'mod-1', 'Where in your life are you over-functioning or people-pleasing at the expense of your peace?', 'Detail situations, relationships, or work demands...', 2),
('ref-2-1', 'mod-2', 'How would you describe the woman you are becoming in five vivid adjectives?', 'e.g., Grounded, Radiant, Unapologetic, Strategic, Peaceful...', 1),
('ref-3-1', 'mod-3', 'What is one bold desire you have whispered in secret that you are now ready to declare out loud?', 'Your authentic vision...', 1),
('ref-4-1', 'mod-4', 'What promise will you make to yourself today as you complete this sacred chapter?', 'My unwavering commitment to myself...', 1)
ON CONFLICT (id) DO NOTHING;
