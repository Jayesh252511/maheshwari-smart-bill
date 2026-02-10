
-- Drop the overly broad read policy on subscriptions
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.subscriptions;
