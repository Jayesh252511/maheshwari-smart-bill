-- Remove the foreign key constraint on admins table to allow localStorage admin
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_user_id_fkey;

-- Create a simple admin_activate_plan function that works without strict auth
CREATE OR REPLACE FUNCTION public.admin_activate_plan_simple(target_user_id uuid, plan_code_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  plan_duration INTERVAL;
BEGIN
  -- Set plan duration based on plan code
  CASE plan_code_param
    WHEN '199_1m' THEN plan_duration := interval '1 month';
    WHEN '299_3m' THEN plan_duration := interval '3 months';
    WHEN '499_8m' THEN plan_duration := interval '8 months';
    WHEN '599_12m' THEN plan_duration := interval '12 months';
    ELSE 
      RETURN json_build_object('success', false, 'error', 'Invalid plan code: ' || plan_code_param);
  END CASE;
  
  -- Update or insert subscription
  INSERT INTO public.subscriptions (user_id, status, plan_code, start_date, end_date, action_count, max_actions)
  VALUES (target_user_id, 'active', plan_code_param, now(), now() + plan_duration, 0, 999999)
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'active',
    plan_code = plan_code_param,
    start_date = now(),
    end_date = now() + plan_duration,
    action_count = 0,
    max_actions = 999999,
    updated_at = now();
  
  RETURN json_build_object('success', true, 'message', 'Plan activated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;