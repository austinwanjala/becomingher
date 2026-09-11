-- =========================================================================
-- BECOMING HER — Roles & User Roles Table Migration
-- Run this in your Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Create ROLES Table
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 2. Create USER_ROLES Table
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

-- 3. Row Level Security Policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to roles" ON public.roles;
CREATE POLICY "Allow read access to roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access to user_roles" ON public.user_roles;
CREATE POLICY "Allow read access to user_roles" ON public.user_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all on user_roles" ON public.user_roles;
CREATE POLICY "Allow all on user_roles" ON public.user_roles FOR ALL USING (true);

-- 4. Database Trigger:
-- Users created directly from Supabase Authentication -> ADMIN
-- Users registered via public website (/register) -> CUSTOMER
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  user_name TEXT;
BEGIN
  user_name := COALESCE(new.raw_user_meta_data->>'name', 'Member');

  -- If created directly from Supabase Dashboard Authentication, default to ADMIN
  -- Only public customer portal registrations (/register) have registered_via = 'customer'
  IF (new.raw_user_meta_data->>'registered_via' = 'customer') OR (new.raw_user_meta_data->>'source' = 'website') THEN
    assigned_role := 'CUSTOMER';
  ELSE
    assigned_role := 'ADMIN';
  END IF;

  -- Insert or update public.profiles safely
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

  -- Insert into public.user_roles
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (new.id, assigned_role)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Sync raw_app_meta_data so role is in JWT
  new.raw_app_meta_data := jsonb_set(COALESCE(new.raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb(assigned_role));

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Promote all existing authenticated users created in Supabase to ADMIN
INSERT INTO public.user_roles (user_id, role_id)
SELECT id, 'ADMIN' FROM auth.users
ON CONFLICT (user_id, role_id) DO NOTHING;

UPDATE public.profiles
SET role = 'ADMIN'
WHERE id IN (SELECT id FROM auth.users);

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"ADMIN"');
