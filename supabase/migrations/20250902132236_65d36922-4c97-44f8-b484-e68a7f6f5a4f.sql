-- Fix admin authentication and subscription fetch errors
-- Add missing RLS policies and improve WhatsApp payment system

-- Add any missing RLS policies for subscriptions table
CREATE POLICY "Enable read access for authenticated users" ON public.subscriptions
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add policy for purchase_intents
CREATE POLICY "Enable read access for authenticated users" ON public.purchase_intents
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can read all purchase intents" ON public.purchase_intents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
);

-- Create WhatsApp message templates table for better payment flow
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on whatsapp_templates
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for whatsapp_templates (public read)
CREATE POLICY "Everyone can read WhatsApp templates" ON public.whatsapp_templates
FOR SELECT USING (true);

-- Create policy for admins to manage templates
CREATE POLICY "Admins can manage WhatsApp templates" ON public.whatsapp_templates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
);

-- Insert default WhatsApp message templates
INSERT INTO public.whatsapp_templates (name, message_template) VALUES 
('payment_confirmation', 'Hi! Your payment of {amount} for {plan_name} has been received. Your billing system will be activated within 24 hours. UPI Transaction ID: {transaction_id}'),
('payment_instructions', 'Complete your payment for {plan_name} ({amount}) using UPI ID: jayeshneo07@oksbi. Send screenshot after payment for quick activation.'),
('plan_activated', 'Congratulations! Your {plan_name} plan is now active. You have unlimited access until {end_date}. Start billing now!'),
('payment_reminder', 'Your demo period expires soon. Upgrade to {plan_name} for unlimited access. Pay {amount} to UPI: jayeshneo07@oksbi');

-- Add payment tracking columns to purchase_intents
ALTER TABLE public.purchase_intents ADD COLUMN IF NOT EXISTS payment_screenshot TEXT;
ALTER TABLE public.purchase_intents ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;  
ALTER TABLE public.purchase_intents ADD COLUMN IF NOT EXISTS transaction_id TEXT;