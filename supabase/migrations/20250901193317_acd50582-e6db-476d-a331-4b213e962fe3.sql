-- Fix the remaining function search path issue
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate handle_new_user function with proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, business_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'));
  RETURN NEW;
END;
$$;