-- Initial Schema for Becoming Her

-- ENUMS
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'COACH', 'CUSTOMER');
CREATE TYPE service_type AS ENUM ('DIGITAL_PROGRAMME', 'CUSTOM_COACHING', 'INTERPERSONAL_SESSION');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED', 'VERIFICATION_REQUIRED');
CREATE TYPE entitlement_status AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
CREATE TYPE booking_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'CUSTOMER',
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICES
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type service_type NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SELAR PRODUCT MAPPINGS
CREATE TABLE selar_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  selar_product_id TEXT NOT NULL,
  selar_product_url TEXT,
  product_name TEXT,
  price NUMERIC,
  currency TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, selar_product_id)
);

-- ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id),
  service_id UUID REFERENCES services(id),
  selar_product_id TEXT,
  payment_provider TEXT DEFAULT 'SELAR',
  payment_status payment_status DEFAULT 'PENDING',
  transaction_reference TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENTITLEMENTS (Access rights)
CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  status entitlement_status DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE selar_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Allow public to read active services
CREATE POLICY "Public can view active services" 
  ON services FOR SELECT 
  USING (is_active = true);

-- Allow admins full access
-- We can add a function to check if the current user is an admin.
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SUPER_ADMIN', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins have full access to services" 
  ON services FOR ALL 
  USING (is_admin());

CREATE POLICY "Admins have full access to selar_products" 
  ON selar_products FOR ALL 
  USING (is_admin());

-- Customers can see their own orders
CREATE POLICY "Users can view own orders" 
  ON orders FOR SELECT 
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can view own entitlements" 
  ON entitlements FOR SELECT 
  USING (auth.uid() = customer_id);

-- Setup trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', 'CUSTOMER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
