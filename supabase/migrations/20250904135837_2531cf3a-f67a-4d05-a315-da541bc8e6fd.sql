-- Enable real-time for admin dashboard
-- This ensures real-time updates work across different sessions

-- Enable realtime for purchase_intents table
ALTER TABLE public.purchase_intents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_intents;

-- Enable realtime for subscriptions table
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- Enable realtime for profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Ensure admin has proper access to all data regardless of session
-- Create admin policies that work across different login sessions

-- Drop existing admin policies if they exist and recreate them
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all intents" ON public.purchase_intents;

-- Create better admin policies for subscriptions
CREATE POLICY "Admin users can manage all subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (
  -- Allow access if user is admin by email OR if admin session exists
  auth.jwt() ->> 'email' = 'admin@gmail.com'
  OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- Create better admin policies for purchase intents
CREATE POLICY "Admin users can manage all purchase intents"
ON public.purchase_intents
FOR ALL  
TO authenticated
USING (
  -- Allow access if user is admin by email OR if admin session exists
  auth.jwt() ->> 'email' = 'admin@gmail.com'
  OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- Also ensure admin can read all profiles
CREATE POLICY "Admin users can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Allow access if user is admin by email OR if admin session exists
  auth.jwt() ->> 'email' = 'admin@gmail.com'
  OR EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
);