
-- Fix 1: Remove overly permissive read policy on purchase_intents
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.purchase_intents;

-- Fix 2: Add restrictive INSERT policy on admins table to prevent self-insertion
CREATE POLICY "No direct insert to admins" ON public.admins FOR INSERT TO public WITH CHECK (false);
