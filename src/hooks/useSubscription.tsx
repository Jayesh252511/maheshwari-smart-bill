import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Subscription {
  id: string;
  status: string;
  plan_code: string | null;
  start_date: string | null;
  end_date: string | null;
  action_count: number;
  max_actions: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPerformAction, setCanPerformAction] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      // Check if user can perform action
      const { data: canPerform } = await supabase.rpc('can_perform_bill_action', {
        user_uuid: user.id
      });

      setCanPerformAction(canPerform || false);

      // Fetch subscription details
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordAction = async (billId: string, actionType: 'create_bill' | 'update_items', description?: string) => {
    if (!user) return false;

    try {
      const { data } = await supabase.rpc('record_bill_action', {
        user_uuid: user.id,
        bill_uuid: billId,
        action_type_param: actionType,
        description_param: description
      });

      // Refresh subscription after recording action
      await fetchSubscription();
      
      return data || false;
    } catch (error) {
      console.error('Error recording action:', error);
      return false;
    }
  };

  const getDaysLeft = () => {
    if (!subscription?.end_date) return 0;
    
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const getActionsLeft = () => {
    if (!subscription) return 0;
    return Math.max(0, subscription.max_actions - subscription.action_count);
  };

  const isDemo = () => subscription?.status === 'demo';
  const isActive = () => subscription?.status === 'active';
  const isExpired = () => subscription?.status === 'expired' || (!isDemo() && !isActive());

  return {
    subscription,
    loading,
    canPerformAction,
    recordAction,
    fetchSubscription,
    getDaysLeft,
    getActionsLeft,
    isDemo,
    isActive,
    isExpired
  };
};