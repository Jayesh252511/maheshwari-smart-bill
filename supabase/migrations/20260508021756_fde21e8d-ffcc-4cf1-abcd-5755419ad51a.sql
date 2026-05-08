-- Track per-device free-tier usage (shared across accounts on same device)
CREATE TABLE IF NOT EXISTS public.device_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL UNIQUE,
  bill_count integer NOT NULL DEFAULT 0,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  last_user_id uuid,
  last_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_usage_device_id ON public.device_usage(device_id);

ALTER TABLE public.device_usage ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may read & upsert device usage rows (device is shared across accounts)
CREATE POLICY "Authenticated can view device usage"
  ON public.device_usage FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert device usage"
  ON public.device_usage FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update device usage"
  ON public.device_usage FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Admin full access (already has via separate pattern, but explicit delete for cleanup)
CREATE POLICY "Admins can delete device usage"
  ON public.device_usage FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- Atomic increment helper
CREATE OR REPLACE FUNCTION public.increment_device_bill_count(_device_id text, _email text, _user_id uuid)
RETURNS public.device_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.device_usage;
BEGIN
  INSERT INTO public.device_usage (device_id, bill_count, last_user_id, last_email, last_seen)
  VALUES (_device_id, 1, _user_id, _email, now())
  ON CONFLICT (device_id) DO UPDATE SET
    bill_count = public.device_usage.bill_count + 1,
    last_user_id = _user_id,
    last_email = _email,
    last_seen = now(),
    updated_at = now()
  RETURNING * INTO rec;
  RETURN rec;
END;
$$;

CREATE TRIGGER trg_device_usage_updated_at
BEFORE UPDATE ON public.device_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();