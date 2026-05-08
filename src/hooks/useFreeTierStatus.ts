import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceId } from '@/utils/deviceId';

export const FREE_BILL_LIMIT = 777;
export const FREE_DURATION_DAYS = 180; // 6 months
export const PRO_EMAIL = 'devesh9130@gmail.com';

export interface FreeTierStatus {
  loading: boolean;
  isPro: boolean;
  deviceId: string;
  billCount: number;
  billsRemaining: number;
  daysRemaining: number;
  firstSeen: Date | null;
  expired: boolean;
  refresh: () => Promise<void>;
  recordBill: () => Promise<{ ok: boolean; expired: boolean }>;
}

export function useFreeTierStatus(): FreeTierStatus {
  const { user } = useAuth();
  const deviceId = getDeviceId();
  const isPro = user?.email?.toLowerCase() === PRO_EMAIL;

  const [loading, setLoading] = useState(true);
  const [billCount, setBillCount] = useState(0);
  const [firstSeen, setFirstSeen] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('device_usage')
      .select('bill_count, first_seen')
      .eq('device_id', deviceId)
      .maybeSingle();
    if (data) {
      setBillCount(data.bill_count || 0);
      setFirstSeen(data.first_seen ? new Date(data.first_seen) : null);
    } else {
      // Seed row so first_seen starts now
      await supabase.from('device_usage').insert({
        device_id: deviceId,
        bill_count: 0,
        last_user_id: user.id,
        last_email: user.email,
      } as any);
      setBillCount(0);
      setFirstSeen(new Date());
    }
    setLoading(false);
  }, [user, deviceId]);

  useEffect(() => { load(); }, [load]);

  const recordBill = useCallback(async () => {
    if (isPro) return { ok: true, expired: false };
    const { data, error } = await supabase.rpc('increment_device_bill_count' as any, {
      _device_id: deviceId,
      _email: user?.email ?? null,
      _user_id: user?.id ?? null,
    });
    if (!error && data) {
      const row: any = Array.isArray(data) ? data[0] : data;
      setBillCount(row.bill_count);
      if (row.first_seen) setFirstSeen(new Date(row.first_seen));
    }
    return { ok: true, expired: false };
  }, [isPro, deviceId, user]);

  const daysSince = firstSeen ? Math.floor((Date.now() - firstSeen.getTime()) / 86400000) : 0;
  const daysRemaining = Math.max(0, FREE_DURATION_DAYS - daysSince);
  const billsRemaining = Math.max(0, FREE_BILL_LIMIT - billCount);
  const expired = !isPro && (billsRemaining <= 0 || daysRemaining <= 0);

  return {
    loading,
    isPro,
    deviceId,
    billCount,
    billsRemaining,
    daysRemaining,
    firstSeen,
    expired,
    refresh: load,
    recordBill,
  };
}
