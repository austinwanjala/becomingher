-- Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  order_reference text NOT NULL,
  customer_id text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  service_id text NOT NULL,
  service_name text NOT NULL,
  selar_product_id text,
  payment_provider text NOT NULL,
  payment_status text NOT NULL,
  transaction_reference text,
  amount numeric NOT NULL,
  currency text NOT NULL,
  discount_amount numeric DEFAULT 0,
  coupon_code text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to orders" ON public.orders FOR ALL USING (
  (auth.jwt() ->> 'role' = 'ADMIN') OR (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
);

-- Customers can view their own orders
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING (
  cast(auth.uid() as text) = cast(customer_id as text)
);

-- Note: We generally insert/update orders from the server using the service role key,
-- which bypasses RLS. So we don't strictly need insert/update policies for the public role.
