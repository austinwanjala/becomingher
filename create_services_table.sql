-- Drop if exists to ensure a fresh schema
DROP TABLE IF EXISTS public.services CASCADE;

-- Create Services Table
CREATE TABLE public.services (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    image_url TEXT NOT NULL,
    duration TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    selar_product_id TEXT,
    selar_product_url TEXT,
    pdf_title TEXT,
    pdf_name TEXT,
    pdf_url TEXT,
    resources JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow public read access to all active services
CREATE POLICY "Enable read access for all users" ON public.services
    FOR SELECT
    USING (is_active = true);

-- Allow admins full access to services
-- Note: Assuming auth.uid() check or similar for admin access, 
-- but for simplicity if not using Supabase Auth strictly for admins:
CREATE POLICY "Enable full access for all users" ON public.services
    FOR ALL
    USING (true);

-- Seed Data (Optional, based on store.ts)
INSERT INTO public.services (id, type, slug, name, short_description, description, price, currency, image_url, duration, is_active, is_featured, features, selar_product_id, selar_product_url, resources)
VALUES 
(
    'srv-guided-01', 
    'DIGITAL_PROGRAMME', 
    'guided-coaching', 
    'Guided Digital Coaching Programme', 
    'A 4-week structured transformative coaching journey designed for women stepping into clarity, intentionality, and personal mastery.', 
    'The Guided Digital Coaching Programme is an immersive, self-paced yet deeply guided development experience. Structured across four progressive modules, it blends reflective inquiries, habit frameworks, actionable exercises, and embedded reflective coaching support to help you unlock the woman you are becoming.', 
    1000, 
    'KES', 
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800', 
    '4 Modules (Self-Paced / 4 Weeks)', 
    true, 
    true, 
    '["4 Comprehensive Modules & 12 Guided Lessons", "Interactive Reflection Prompts & Digital Journaling", "Downloadable Worksheets, Audio Guides & Resources", "Integrated 24/7 Digital Coaching Companion", "Lifetime Access & Progress Tracking Dashboard", "Official Becoming Her Completion Certificate"]'::jsonb,
    'v09683c927', 
    'https://selar.com/v09683c927',
    '[]'::jsonb
),
(
    'srv-custom-02', 
    'CUSTOM_COACHING', 
    'custom-coaching', 
    'Customized Digital Coaching Programme', 
    'A bespoke coaching experience curated uniquely around your individual life vision, challenges, and goals with personalized reflective guidance.', 
    'Receive a personalized digital coaching curriculum crafted specifically for your journey. Following payment, you complete an in-depth life assessment questionnaire. Our system and coaching framework build tailored daily reflections, targeted milestone plans, and persistent conversational support tailored to your life situation.', 
    1500, 
    'KES', 
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800', 
    'Personalized 8-Week Roadmap', 
    true, 
    true, 
    '["Deep Onboarding Life Assessment & Goal Mapping", "Customized Curriculum Tailored to Your Specific Obstacles", "Personalized Reflection Companion Aligned to Your Profile", "Weekly Goal Reviews & Dynamic Action Prompts", "Unlimited Reflective Dialogue & Daily Accountability", "Priority Access to Becoming Her Masterclasses"]'::jsonb,
    'v09683c927', 
    'https://selar.com/v09683c927',
    '[]'::jsonb
),
(
    'srv-interpersonal-03', 
    'INTERPERSONAL_SESSION', 
    'interpersonal-coaching', 
    '1-on-1 Interpersonal Session', 
    'A deep, focused 90-minute live coaching dialogue to untangle immediate roadblocks, re-align your vision, and set deliberate next steps.', 
    'Sometimes you need a sounding board, a mirror, and an objective guide all at once. The Interpersonal Session is a 90-minute high-impact video call designed to help you break through mental loops, gain immediate clarity on a pressing life situation, and leave with a tangible strategy for the week ahead.', 
    2500, 
    'KES', 
    'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&q=80&w=800', 
    '90 Minutes (Live Video Session)', 
    true, 
    false, 
    '["90-Minute Focused Video Dialogue", "Pre-Session Intake Form for Accelerated Context", "Post-Session Summary Notes & Action Plan", "One Week of Follow-up Text Support", "Access to Recorded Session (Optional)"]'::jsonb,
    'v09683c927', 
    'https://selar.com/v09683c927',
    '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;
