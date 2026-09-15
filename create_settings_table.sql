-- Create the site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'global',
  brand jsonb DEFAULT '{}',
  cms jsonb DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the settings (so the public website can load the logo/copy)
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (true);

-- Allow admins to update the settings
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (
  (auth.jwt() ->> 'role' = 'ADMIN') OR (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
);

CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (
  (auth.jwt() ->> 'role' = 'ADMIN') OR (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
);

-- Seed initial row
INSERT INTO public.site_settings (id, brand, cms) 
VALUES ('global', '{}', '{}')
ON CONFLICT (id) DO NOTHING;
