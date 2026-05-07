-- subscriptions: explicit restrictive deny for non-admin UPDATE/DELETE
CREATE POLICY "Only admins can update subscriptions"
ON public.subscriptions
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Only admins can delete subscriptions"
ON public.subscriptions
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- purchase_intents: restrictive deny for non-admin UPDATE/DELETE
CREATE POLICY "Only admins can update purchase intents"
ON public.purchase_intents
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Only admins can delete purchase intents"
ON public.purchase_intents
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- billing_actions: restrictive deny for non-admin UPDATE/DELETE (audit integrity)
CREATE POLICY "Only admins can update billing actions"
ON public.billing_actions
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Only admins can delete billing actions"
ON public.billing_actions
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));