-- Fix infinite recursion in admins RLS by removing self-referencing policy
BEGIN;

-- Drop recursive policy
DROP POLICY IF EXISTS "Admins can view admin table" ON public.admins;

-- Create safe, non-recursive policies
CREATE POLICY "Users can view their own admin row"
ON public.admins
FOR SELECT
USING (auth.uid() = user_id);

-- (Optional) Allow users to verify their own existence without exposing others
-- No INSERT/UPDATE/DELETE policies are added to keep the table protected

COMMIT;