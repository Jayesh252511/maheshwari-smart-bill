import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OfflineBill {
  id: string;
  user_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  bill_number: string;
  items: {
    item_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    unit: string;
  }[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  synced: boolean;
}

const OFFLINE_BILLS_KEY = 'offline_bills';
const OFFLINE_CUSTOMERS_KEY = 'offline_customers_cache';
const OFFLINE_ITEMS_KEY = 'offline_items_cache';

// ── Offline bill queue ──

export const saveOfflineBill = (bill: OfflineBill) => {
  const bills = getOfflineBills();
  bills.push(bill);
  localStorage.setItem(OFFLINE_BILLS_KEY, JSON.stringify(bills));
};

export const getOfflineBills = (): OfflineBill[] => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_BILLS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getPendingBills = (): OfflineBill[] => {
  return getOfflineBills().filter(b => !b.synced);
};

export const markBillSynced = (id: string) => {
  const bills = getOfflineBills().map(b =>
    b.id === id ? { ...b, synced: true } : b
  );
  localStorage.setItem(OFFLINE_BILLS_KEY, JSON.stringify(bills));
};

export const removeSyncedBills = () => {
  const bills = getOfflineBills().filter(b => !b.synced);
  localStorage.setItem(OFFLINE_BILLS_KEY, JSON.stringify(bills));
};

// ── Cache customers & items for offline use ──

export const cacheCustomers = (customers: any[]) => {
  localStorage.setItem(OFFLINE_CUSTOMERS_KEY, JSON.stringify(customers));
};

export const getCachedCustomers = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_CUSTOMERS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const cacheItems = (items: any[]) => {
  localStorage.setItem(OFFLINE_ITEMS_KEY, JSON.stringify(items));
};

export const getCachedItems = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_ITEMS_KEY) || '[]');
  } catch {
    return [];
  }
};

// ── Sync engine ──

export const syncPendingBills = async (): Promise<number> => {
  const pending = getPendingBills();
  if (pending.length === 0) return 0;

  let syncedCount = 0;

  for (const bill of pending) {
    try {
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert([{
          user_id: bill.user_id,
          customer_id: bill.customer_id,
          bill_number: bill.bill_number,
          subtotal: bill.subtotal,
          tax_amount: bill.tax_amount,
          total_amount: bill.total_amount,
          status: bill.status,
        }])
        .select()
        .single();

      if (billError) throw billError;

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(bill.items.map(item => ({
          bill_id: billData.id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })));

      if (itemsError) throw itemsError;

      markBillSynced(bill.id);
      syncedCount++;
    } catch (err) {
      console.error('Failed to sync bill:', bill.id, err);
    }
  }

  if (syncedCount > 0) {
    removeSyncedBills();
  }

  return syncedCount;
};

// ── Online/Offline detection ──

export const isOnline = () => navigator.onLine;
