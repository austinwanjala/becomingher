-- create_entitlements_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  order_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  progress_percentage INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own entitlements
CREATE POLICY "Users can view own entitlements" 
ON public.entitlements 
FOR SELECT 
USING (auth.uid() = customer_id);

-- Create policy to allow admin (service role) full access
CREATE POLICY "Service role full access on entitlements"
ON public.entitlements
FOR ALL
USING (true)
WITH CHECK (true);
