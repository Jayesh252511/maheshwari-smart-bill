-- Fix: Remove broad read access policy on profiles table
-- Keep owner-only and admin-only access
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;