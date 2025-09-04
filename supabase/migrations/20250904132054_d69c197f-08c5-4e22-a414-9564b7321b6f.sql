-- Enable real-time for purchase_intents table
ALTER TABLE public.purchase_intents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_intents;

-- Enable real-time for subscriptions table  
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- Add pause/resume functionality to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;

-- Create function to pause/resume subscription
CREATE OR REPLACE FUNCTION public.admin_toggle_subscription(target_user_id uuid, action_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF action_type = 'pause' THEN
    UPDATE public.subscriptions 
    SET is_paused = TRUE, updated_at = now()
    WHERE user_id = target_user_id;
    
    RETURN json_build_object('success', true, 'message', 'Subscription paused successfully');
  ELSIF action_type = 'resume' THEN
    UPDATE public.subscriptions 
    SET is_paused = FALSE, updated_at = now()
    WHERE user_id = target_user_id;
    
    RETURN json_build_object('success', true, 'message', 'Subscription resumed successfully');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid action type');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;