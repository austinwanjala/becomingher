-- alter_tables.sql

-- Add column for the global blank template (on the service level)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS questionnaire_template_url TEXT;

-- Add column for the customer's uploaded filled questionnaire (on the entitlement level)
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS questionnaire_url TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
