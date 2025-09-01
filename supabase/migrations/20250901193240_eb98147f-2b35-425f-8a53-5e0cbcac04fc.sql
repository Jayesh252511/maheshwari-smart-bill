-- Fix search path security warnings for functions
DROP FUNCTION IF EXISTS public.can_perform_bill_action(UUID);
DROP FUNCTION IF EXISTS public.record_bill_action(UUID, UUID, TEXT, TEXT);  
DROP FUNCTION IF EXISTS public.admin_activate_plan(UUID, TEXT);

-- Recreate functions with proper search path
CREATE OR REPLACE FUNCTION public.can_perform_bill_action(user_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT * INTO sub_record 
  FROM public.subscriptions 
  WHERE user_id = user_uuid;
  
  -- If no subscription exists, create demo subscription
  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (user_id, status, start_date, end_date)
    VALUES (user_uuid, 'demo', now(), now() + interval '7 days')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN TRUE;
  END IF;
  
  -- Check demo limits
  IF sub_record.status = 'demo' THEN
    RETURN sub_record.action_count < sub_record.max_actions 
           AND sub_record.end_date > now();
  END IF;
  
  -- Check active subscription
  IF sub_record.status = 'active' THEN
    RETURN sub_record.end_date > now();
  END IF;
  
  -- Expired or other status
  RETURN FALSE;
END;
$$;

-- Recreate record function with proper search path
CREATE OR REPLACE FUNCTION public.record_bill_action(
  user_uuid UUID,
  bill_uuid UUID,
  action_type_param TEXT,
  description_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the action
  INSERT INTO public.billing_actions (user_id, bill_id, action_type, description)
  VALUES (user_uuid, bill_uuid, action_type_param, description_param);
  
  -- Increment action count
  UPDATE public.subscriptions 
  SET action_count = action_count + 1,
      updated_at = now()
  WHERE user_id = user_uuid;
  
  RETURN TRUE;
END;
$$;

-- Recreate admin function with proper search path
CREATE OR REPLACE FUNCTION public.admin_activate_plan(
  target_user_id UUID,
  plan_code_param TEXT
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_duration INTERVAL;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Set plan duration based on plan code
  CASE plan_code_param
    WHEN '199_1m' THEN plan_duration := interval '1 month';
    WHEN '299_3m' THEN plan_duration := interval '3 months';
    WHEN '499_8m' THEN plan_duration := interval '8 months';
    WHEN '599_12m' THEN plan_duration := interval '12 months';
    ELSE RAISE EXCEPTION 'Invalid plan code';
  END CASE;
  
  -- Update or insert subscription
  INSERT INTO public.subscriptions (user_id, status, plan_code, start_date, end_date, action_count, max_actions)
  VALUES (target_user_id, 'active', plan_code_param, now(), now() + plan_duration, 0, 999999)
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'active',
    plan_code = plan_code_param,
    start_date = now(),
    end_date = now() + plan_duration,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;