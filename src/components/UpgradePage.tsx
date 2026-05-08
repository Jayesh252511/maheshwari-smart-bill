import React, { useState } from 'react';
import { Check, Crown, MessageCircle, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFreeTierStatus } from '@/hooks/useFreeTierStatus';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  code: string;
  months: number;
  price: number;
  label: string;
  popular?: boolean;
  save?: string;
}

const WHATSAPP_NUMBER = '918605601801';

const PLANS: Plan[] = [
  { code: '1m_50', months: 1, price: 50, label: '1 Month' },
  { code: '3m_120', months: 3, price: 120, label: '3 Months', save: 'Save ₹30' },
  { code: '6m_200', months: 6, price: 200, label: '6 Months', popular: true, save: 'Save ₹100' },
  { code: '12m_400', months: 12, price: 400, label: '12 Months', save: 'Save ₹200' },
];

const FEATURES = [
  'Unlimited bills (no 777 limit)',
  'No 6-month expiry',
  'Bluetooth thermal printing',
  'PDF download & WhatsApp share',
  'Customer & inventory management',
  'Sales reports & analytics',
  'Multi-language (EN / HI / MR)',
  'Voice billing assistant',
  'Priority support',
];

const UpgradePage: React.FC = () => {
  const { user } = useAuth();
  const { deviceId, billsRemaining, daysRemaining, isPro } = useFreeTierStatus();
  const [busy, setBusy] = useState<string | null>(null);

  const handleBuy = async (plan: Plan) => {
    setBusy(plan.code);
    let businessName = 'My Business';
    try {
      const { data } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (data?.business_name) businessName = data.business_name;
    } catch {}

    try {
      await supabase.from('purchase_intents').insert({
        user_id: user?.id,
        email: user?.email,
        business_name: businessName,
        plan_code: plan.code,
        amount: plan.price,
        device_info: { device_id: deviceId, ua: navigator.userAgent } as any,
      } as any);
    } catch {}

    const msg =
      `Hi! I want to upgrade DUKANPAY.\n\n` +
      `Plan: ${plan.label} – ₹${plan.price}\n` +
      `Email: ${user?.email}\n` +
      `Business: ${businessName}\n` +
      `Device ID: ${deviceId.slice(0, 24)}…\n\n` +
      `Please activate my plan. Thank you!`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setBusy(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      {/* Hero */}
      <div className="border-4 border-black bg-[hsl(var(--comic-yellow))] shadow-[6px_6px_0px_0px_#000] p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-3 border-4 border-black bg-[hsl(var(--comic-pink))] flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
          <Crown className="h-8 w-8 text-black" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter comic-text-stroke leading-none">
          Upgrade to PRO
        </h1>
        <p className="text-xs font-black uppercase tracking-widest mt-2 text-black/60">
          Unlimited billing • No expiry • Priority support
        </p>

        {!isPro && (
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase">
            <span className="px-3 py-1 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
              {billsRemaining} bills left
            </span>
            <span className="px-3 py-1 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
              {daysRemaining} days left
            </span>
          </div>
        )}
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const perMonth = (plan.price / plan.months).toFixed(0);
          return (
            <div
              key={plan.code}
              className={`relative border-4 border-black p-4 flex flex-col shadow-[4px_4px_0px_0px_#000] ${
                plan.popular ? 'bg-[hsl(var(--comic-green))]' : 'bg-[hsl(var(--comic-beige))]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 border-2 border-black bg-[hsl(var(--comic-pink))] text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Best Value
                </div>
              )}
              <div className="text-center mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-black/60">{plan.label}</p>
                <p className="text-4xl font-black italic mt-1">₹{plan.price}</p>
                <p className="text-[10px] font-black uppercase text-black/50 mt-1">
                  ₹{perMonth}/month
                </p>
                {plan.save && (
                  <p className="mt-2 inline-block px-2 py-0.5 border-2 border-black bg-[hsl(var(--comic-yellow))] text-[9px] font-black uppercase">
                    {plan.save}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleBuy(plan)}
                disabled={busy === plan.code}
                className="w-full h-11 border-2 border-black rounded-none font-black uppercase text-[11px] tracking-widest bg-black text-white hover:bg-black/80 shadow-[3px_3px_0px_0px_#000] active:shadow-none"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {busy === plan.code ? 'Opening…' : 'Buy on WhatsApp'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Features */}
      <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_#000] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5" />
          <h3 className="text-sm font-black uppercase tracking-widest italic">What you get</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs font-bold">
              <span className="w-5 h-5 border-2 border-black bg-[hsl(var(--comic-green))] flex items-center justify-center shrink-0">
                <Check className="h-3 w-3" />
              </span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-[10px] font-black uppercase tracking-widest text-black/40">
        After payment, your plan is activated within a few hours by our team.
      </div>
    </div>
  );
};

export default UpgradePage;
