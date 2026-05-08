import React from 'react';
import { Crown, AlertTriangle } from 'lucide-react';
import { useFreeTierStatus, FREE_BILL_LIMIT } from '@/hooks/useFreeTierStatus';

interface Props {
  onUpgrade: () => void;
}

const FreeTierBanner: React.FC<Props> = ({ onUpgrade }) => {
  const { isPro, loading, billsRemaining, daysRemaining, billCount, expired } = useFreeTierStatus();

  if (loading || isPro) return null;

  const danger = expired || billsRemaining <= 30 || daysRemaining <= 7;
  const pct = Math.min(100, Math.round((billCount / FREE_BILL_LIMIT) * 100));

  return (
    <div
      onClick={onUpgrade}
      className={`cursor-pointer border-2 border-black shadow-[2px_2px_0px_0px_#000] p-2.5 mb-3 flex items-center gap-2 ${
        danger ? 'bg-[hsl(var(--comic-pink))]' : 'bg-[hsl(var(--comic-yellow))]'
      }`}
    >
      <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center shrink-0">
        {danger ? <AlertTriangle className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">
            {expired ? 'Free trial ended' : 'Free version'}
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-black/60">
            {billsRemaining}/{FREE_BILL_LIMIT} • {daysRemaining}d
          </p>
        </div>
        <div className="mt-1.5 h-1.5 border border-black bg-white">
          <div className="h-full bg-black" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest underline shrink-0">
        Upgrade
      </span>
    </div>
  );
};

export default FreeTierBanner;
