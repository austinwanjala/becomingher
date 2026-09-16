-- create_entitlements_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS public.entitlements CASCADE;

CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  order_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  progress_percentage INTEGER DEFAULT 0,
  questionnaire_url TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own entitlements
DROP POLICY IF EXISTS "Users can view own entitlements" ON public.entitlements;
CREATE POLICY "Users can view own entitlements" 
ON public.entitlements 
FOR SELECT 
USING (auth.uid() = customer_id);

-- Create policy to allow users to update their own entitlements
DROP POLICY IF EXISTS "Users can update own entitlements" ON public.entitlements;
CREATE POLICY "Users can update own entitlements" 
ON public.entitlements 
FOR UPDATE 
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Create policy to allow admin (service role) full access
DROP POLICY IF EXISTS "Service role full access on entitlements" ON public.entitlements;
CREATE POLICY "Service role full access on entitlements"
ON public.entitlements
FOR ALL
USING (true)
WITH CHECK (true);
