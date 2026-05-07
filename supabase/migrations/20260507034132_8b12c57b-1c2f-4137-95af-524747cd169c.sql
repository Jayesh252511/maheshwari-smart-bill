-- 1. Restrict whatsapp_templates SELECT to authenticated users only
DROP POLICY IF EXISTS "Everyone can read WhatsApp templates" ON public.whatsapp_templates;
CREATE POLICY "Authenticated users can read WhatsApp templates"
ON public.whatsapp_templates
FOR SELECT
TO authenticated
USING (true);

-- 2. Remove hardcoded admin@gmail.com bypass on profiles
DROP POLICY IF EXISTS "Admin read access to all profiles" ON public.profiles;
CREATE POLICY "Admin read access to all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- 3. Remove hardcoded admin@gmail.com bypass on purchase_intents
DROP POLICY IF EXISTS "Admin access to all purchase intents" ON public.purchase_intents;
CREATE POLICY "Admin access to all purchase intents"
ON public.purchase_intents
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- 4. Remove hardcoded admin@gmail.com bypass on subscriptions
DROP POLICY IF EXISTS "Admin access to all subscriptions" ON public.subscriptions;
CREATE POLICY "Admin access to all subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- 5. Block regular users from updating/deleting their own subscription rows
-- (Only admins via the policy above can modify; SECURITY DEFINER functions still work.)
-- No additional permissive UPDATE/DELETE policy is created for users, so RLS denies by default.