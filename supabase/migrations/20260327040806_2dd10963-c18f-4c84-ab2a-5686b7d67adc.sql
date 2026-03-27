
-- Restrict subscription INSERT to only allow demo status with default values
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;

CREATE POLICY "Users can insert own demo subscription" ON public.subscriptions
FOR INSERT TO public
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'demo' 
  AND max_actions <= 30
);
