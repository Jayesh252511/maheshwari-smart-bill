import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, Zap } from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  plan_code: string | null;
  start_date: string | null;
  end_date: string | null;
  action_count: number;
  max_actions: number;
}

export const SubscriptionStatus = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSubscription(data);
        if (data.end_date) {
          const endDate = new Date(data.end_date);
          const now = new Date();
          const diffTime = endDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysLeft(Math.max(0, diffDays));
        }
      }
    };

    fetchSubscription();
  }, [user]);

  if (!subscription) return null;

  const getPlanName = (planCode: string | null) => {
    switch (planCode) {
      case '199_1m': return '₹199 Monthly';
      case '299_3m': return '₹299 Quarterly';
      case '499_8m': return '₹499 8-Month';
      case '599_12m': return '₹599 Yearly 💥';
      default: return 'Demo Trial';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'demo': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(subscription.status)}>
              {subscription.status === 'demo' ? 'Free Trial' : subscription.status.toUpperCase()}
            </Badge>
            <span className="font-medium">{getPlanName(subscription.plan_code)}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4" />
              <span>{subscription.action_count}/{subscription.max_actions} actions used</span>
            </div>
            {subscription.status === 'demo' && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{daysLeft} days left</span>
              </div>
            )}
            {subscription.status === 'active' && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{daysLeft} days remaining</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};