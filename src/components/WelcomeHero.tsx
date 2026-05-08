import React from 'react';
import { Sparkles, Package, Users, Receipt, ArrowRight, Crown, TrendingUp, Zap, Mic, Bluetooth } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreeTierStatus, FREE_BILL_LIMIT } from '@/hooks/useFreeTierStatus';

interface Props {
  onNavigate: (page: string) => void;
  stats: { items: number; customers: number; bills: number; revenue: number };
}

const WelcomeHero: React.FC<Props> = ({ onNavigate, stats }) => {
  const { user } = useAuth();
  const { isPro, billsRemaining, daysRemaining, billCount } = useFreeTierStatus();

  if (isPro) return null;

  const isNewUser = stats.bills === 0;
  const businessGreeting =
    (user?.user_metadata?.business_name as string) ||
    (user?.email?.split('@')[0] ?? 'there');

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const steps = [
    { id: 'items', icon: Package, label: 'Add your items', done: stats.items > 0, color: 'bg-[hsl(var(--comic-yellow))]' },
    { id: 'customers', icon: Users, label: 'Add customers', done: stats.customers > 0, color: 'bg-[hsl(var(--comic-cyan))]' },
    { id: 'billing', icon: Receipt, label: 'Create first bill', done: stats.bills > 0, color: 'bg-[hsl(var(--comic-pink))]' },
  ];
  const completed = steps.filter((s) => s.done).length;
  const progressPct = (completed / steps.length) * 100;

  return (
    <div className="space-y-3 mb-4 animate-fade-in">
      {/* Greeting + upgrade card */}
      <div className="border-4 border-black bg-gradient-to-br from-[hsl(var(--comic-yellow))] to-[hsl(var(--comic-pink))] shadow-[5px_5px_0px_0px_#000] p-4 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-20 h-20 border-4 border-black bg-[hsl(var(--comic-cyan))] rotate-12 opacity-40" />
        <div className="absolute -right-8 -bottom-6 w-16 h-16 border-4 border-black bg-[hsl(var(--comic-green))] -rotate-12 opacity-40" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-widest text-black/70">{greet}</p>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter comic-text-stroke leading-tight truncate pr-12">
            {businessGreeting}!
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-1">
            {isNewUser ? 'Welcome to DUKANPAY' : "Let's make today profitable"}
          </p>

          {/* Free tier mini-card */}
          <div className="mt-3 flex items-center gap-2 p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
            <div className="w-8 h-8 border-2 border-black bg-black flex items-center justify-center shrink-0">
              <Crown className="h-4 w-4 text-[hsl(var(--comic-yellow))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest leading-none">
                Free • {billsRemaining}/{FREE_BILL_LIMIT} bills • {daysRemaining}d left
              </p>
              <div className="mt-1 h-1 border border-black bg-[hsl(var(--comic-beige))]">
                <div
                  className="h-full bg-black transition-all"
                  style={{ width: `${Math.min(100, (billCount / FREE_BILL_LIMIT) * 100)}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => onNavigate('upgrade')}
              className="px-2.5 py-1.5 border-2 border-black bg-[hsl(var(--comic-green))] text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding checklist - only when not all done */}
      {completed < steps.length && (
        <div className="border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[3px_3px_0px_0px_#000] p-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Quick Setup</p>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-black/50">
              {completed}/{steps.length} done
            </p>
          </div>
          <div className="h-1.5 border border-black bg-white mb-3">
            <div
              className="h-full bg-[hsl(var(--comic-green))] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => onNavigate(s.id)}
                className={`group flex flex-col items-center gap-1.5 p-2 border-2 border-black transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 ${
                  s.done ? 'bg-[hsl(var(--comic-green))] opacity-70' : `${s.color} shadow-[2px_2px_0px_0px_#000]`
                }`}
              >
                <div className="w-9 h-9 border-2 border-black bg-white flex items-center justify-center">
                  {s.done ? (
                    <span className="text-base font-black">✓</span>
                  ) : (
                    <s.icon className="h-4 w-4 text-black" />
                  )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Bills', value: stats.bills, icon: Receipt, color: 'bg-[hsl(var(--comic-pink))]' },
          { label: 'Items', value: stats.items, icon: Package, color: 'bg-[hsl(var(--comic-yellow))]' },
          { label: 'Revenue', value: `₹${stats.revenue.toFixed(0)}`, icon: TrendingUp, color: 'bg-[hsl(var(--comic-green))]' },
        ].map((s, i) => (
          <div
            key={i}
            className={`border-2 border-black ${s.color} shadow-[2px_2px_0px_0px_#000] p-2.5 hover-scale cursor-default`}
          >
            <s.icon className="h-3.5 w-3.5 mb-1" />
            <p className="text-base font-black italic leading-none truncate">{s.value}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-black/60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pro feature teasers */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onNavigate('billing')}
          className="border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] p-2.5 flex items-center gap-2 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <div className="w-8 h-8 border-2 border-black bg-[hsl(var(--comic-cyan))] flex items-center justify-center shrink-0">
            <Mic className="h-4 w-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest leading-none">Voice Bill</p>
            <p className="text-[8px] font-black uppercase text-black/40 mt-0.5">Speak to bill</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className="border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] p-2.5 flex items-center gap-2 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <div className="w-8 h-8 border-2 border-black bg-[hsl(var(--comic-purple))] flex items-center justify-center shrink-0">
            <Bluetooth className="h-4 w-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest leading-none">Printer</p>
            <p className="text-[8px] font-black uppercase text-black/40 mt-0.5">Connect now</p>
          </div>
        </button>
      </div>

      {/* CTA banner for new users */}
      {isNewUser && (
        <button
          onClick={() => onNavigate('billing')}
          className="w-full border-4 border-black bg-black text-white shadow-[4px_4px_0px_0px_hsl(var(--comic-pink))] p-3 flex items-center justify-between hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_hsl(var(--comic-pink))] transition-all animate-fade-in"
        >
          <div className="text-left">
            <p className="text-xs font-black uppercase italic tracking-tighter">Create your first bill</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mt-0.5">
              Takes 30 seconds
            </p>
          </div>
          <div className="w-9 h-9 border-2 border-white bg-[hsl(var(--comic-yellow))] flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-black" />
          </div>
        </button>
      )}
    </div>
  );
};

export default WelcomeHero;
