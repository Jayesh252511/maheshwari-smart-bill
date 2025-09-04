-- Fix admin RLS policies to work across different sessions
-- The previous migration failed because tables were already in realtime

-- Drop existing conflicting admin policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all intents" ON public.purchase_intents;
DROP POLICY IF EXISTS "Admins can read all purchase intents" ON public.purchase_intents;

-- Create comprehensive admin policies for subscriptions that work across sessions
CREATE POLICY "Admin access to all subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (
  -- Allow if admin email or admin exists in admins table
  (auth.jwt() ->> 'email' = 'admin@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- Create comprehensive admin policies for purchase intents that work across sessions  
CREATE POLICY "Admin access to all purchase intents"
ON public.purchase_intents
FOR ALL
TO authenticated
USING (
  -- Allow if admin email or admin exists in admins table
  (auth.jwt() ->> 'email' = 'admin@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- Ensure profiles table has admin read access
DROP POLICY IF EXISTS "Admin users can read all profiles" ON public.profiles;
CREATE POLICY "Admin read access to all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Allow if admin email or admin exists in admins table
  (auth.jwt() ->> 'email' = 'admin@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
);