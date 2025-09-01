-- Create subscriptions table to track user plans
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'demo' CHECK (status IN ('demo', 'active', 'expired')),
  plan_code TEXT CHECK (plan_code IN ('199_1m', '299_3m', '499_8m', '599_12m')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  action_count INTEGER NOT NULL DEFAULT 0,
  max_actions INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create billing_actions table to log counted actions
CREATE TABLE public.billing_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create_bill', 'update_items')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create purchase_intents table for WhatsApp purchase requests
CREATE TABLE public.purchase_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  email TEXT,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('199_1m', '299_3m', '499_8m', '599_12m')),
  amount INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_info JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create admins table for admin users
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- RLS Policies for billing_actions
CREATE POLICY "Users can view own actions" ON public.billing_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions" ON public.billing_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all actions" ON public.billing_actions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- RLS Policies for purchase_intents
CREATE POLICY "Users can view own intents" ON public.purchase_intents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intents" ON public.purchase_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all intents" ON public.purchase_intents
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- RLS Policies for admins
CREATE POLICY "Admins can view admin table" ON public.admins
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user can perform bill action
CREATE OR REPLACE FUNCTION public.can_perform_bill_action(user_uuid UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record bill action
CREATE OR REPLACE FUNCTION public.record_bill_action(
  user_uuid UUID,
  bill_uuid UUID,
  action_type_param TEXT,
  description_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for admins to activate plan
CREATE OR REPLACE FUNCTION public.admin_activate_plan(
  target_user_id UUID,
  plan_code_param TEXT
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;