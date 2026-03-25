import { useState, useEffect, useCallback } from 'react';
import { syncPendingBills, getPendingBills } from '@/utils/offlineStorage';
import { toast } from 'sonner';

export const useOnlineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getPendingBills().length);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingBills().length);
  }, []);

  const doSync = useCallback(async () => {
    const pending = getPendingBills();
    if (pending.length === 0) return;

    setSyncing(true);
    try {
      const count = await syncPendingBills();
      if (count > 0) {
        toast.success(`${count} offline bill(s) synced!`);
      }
    } catch {
      toast.error('Failed to sync some bills');
    } finally {
      setSyncing(false);
      refreshPendingCount();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.success('Back online!');
      doSync();
    };
    const handleOffline = () => {
      setOnline(false);
      toast.warning('You are offline. Bills will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [doSync]);

  // Sync on mount if online
  useEffect(() => {
    if (online) doSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { online, pendingCount, syncing, refreshPendingCount, doSync };
};
