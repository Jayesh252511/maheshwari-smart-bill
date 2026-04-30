
CREATE OR REPLACE FUNCTION public.can_perform_bill_action(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sub_record RECORD;
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;

  IF user_email = 'devesh9130@gmail.com' THEN
    INSERT INTO public.subscriptions (user_id, status, plan_code, start_date, end_date, action_count, max_actions)
    VALUES (user_uuid, 'active', NULL, now(), now() + interval '100 years', 0, 999999999)
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      end_date = now() + interval '100 years',
      max_actions = 999999999,
      is_paused = false,
      updated_at = now();
    RETURN TRUE;
  END IF;

  SELECT * INTO sub_record FROM public.subscriptions WHERE user_id = user_uuid;

  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (user_id, status, start_date, end_date, max_actions)
    VALUES (user_uuid, 'demo', now(), now() + interval '5 months', 999999)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN TRUE;
  END IF;

  IF COALESCE(sub_record.is_paused, false) THEN
    RETURN FALSE;
  END IF;

  IF sub_record.status = 'demo' THEN
    RETURN sub_record.end_date > now();
  END IF;

  IF sub_record.status = 'active' THEN
    RETURN sub_record.end_date > now();
  END IF;

  RETURN FALSE;
END;
$function$;

DO $$
DECLARE
  devesh_id uuid;
BEGIN
  SELECT id INTO devesh_id FROM auth.users WHERE email = 'devesh9130@gmail.com';
  IF devesh_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, status, plan_code, start_date, end_date, action_count, max_actions)
    VALUES (devesh_id, 'active', NULL, now(), now() + interval '100 years', 0, 999999999)
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      end_date = now() + interval '100 years',
      max_actions = 999999999,
      is_paused = false,
      updated_at = now();
  END IF;
END $$;

UPDATE public.subscriptions
SET end_date = GREATEST(end_date, COALESCE(start_date, created_at) + interval '5 months'),
    max_actions = GREATEST(max_actions, 999999),
    updated_at = now()
WHERE status = 'demo';

DROP POLICY IF EXISTS "Users can insert own demo subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own demo subscription"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'demo');
