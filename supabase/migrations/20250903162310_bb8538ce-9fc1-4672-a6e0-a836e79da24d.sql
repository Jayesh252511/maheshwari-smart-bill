-- Fix admin functionality and ensure proper relationships

-- First, ensure admin table exists and has proper data
INSERT INTO public.admins (user_id, email) 
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET email = 'admin@gmail.com';

-- Drop existing policy if it exists and recreate it
DROP POLICY IF EXISTS "Admins can view subscriptions with profiles" ON public.subscriptions;

-- Create policy to allow admin to view subscriptions with profiles
CREATE POLICY "Admins can view subscriptions with profiles" 
ON public.subscriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
  OR auth.uid() = user_id
);