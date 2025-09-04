import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  status: string;
  plan_code: string | null;
  start_date: string | null;
  end_date: string | null;
  action_count: number;
  max_actions: number;
  is_paused: boolean;
}

const CurrentPlan = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCurrentPlan();
      
      // Set up real-time subscription for subscription changes
      const subscriptionChannel = supabase
        .channel('user-subscription-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
          () => {
            fetchCurrentPlan();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscriptionChannel);
      };
    }
  }, [user]);

  const fetchCurrentPlan = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error: any) {
      console.error('Failed to fetch current plan:', error);
      toast.error('Failed to load current plan');
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = (planCode: string | null) => {
    switch (planCode) {
      case '199_1m': return 'Starter (1 Month)';
      case '299_3m': return 'Business (3 Months)';
      case '499_8m': return 'Professional (8 Months)';
      case '599_12m': return 'Enterprise (12 Months)';
      default: return 'Demo';
    }
  };

  const getStatusColor = (status: string, isPaused: boolean = false) => {
    if (isPaused) return 'bg-orange-500 text-white';
    switch (status) {
      case 'active': return 'bg-success text-white';
      case 'demo': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string, isPaused: boolean = false) => {
    if (isPaused) return 'Paused';
    switch (status) {
      case 'active': return 'Active';
      case 'demo': return 'Demo';
      default: return 'Inactive';
    }
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUsagePercentage = () => {
    if (!subscription || subscription.max_actions === 0) return 0;
    return Math.min((subscription.action_count / subscription.max_actions) * 100, 100);
  };

  if (loading) {
    return (
      <Card className="creative-card">
        <CardContent className="p-6">
          <div className="text-center">Loading current plan...</div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="creative-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            No Active Plan
          </CardTitle>
          <CardDescription>
            You don't have an active subscription yet. Choose a plan to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/pricing'} className="w-full">
            Choose a Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = getDaysRemaining(subscription.end_date);
  const expired = isExpired(subscription.end_date);
  const usagePercentage = getUsagePercentage();

  return (
    <Card className="creative-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-accent" />
          Current Plan
        </CardTitle>
        <CardDescription>
          Your subscription status and usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{getPlanName(subscription.plan_code)}</h3>
            <p className="text-sm text-muted-foreground">
              {subscription.plan_code ? `Plan Code: ${subscription.plan_code}` : 'Demo Plan'}
            </p>
          </div>
          <Badge className={getStatusColor(subscription.status, subscription.is_paused)}>
            {getStatusText(subscription.status, subscription.is_paused)}
          </Badge>
        </div>

        {subscription.status === 'active' && subscription.end_date && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {expired ? 'Expired on' : 'Valid until'}: {new Date(subscription.end_date).toLocaleDateString()}
              </span>
            </div>
            
            {daysRemaining !== null && (
              <div className={`text-sm ${
                expired ? 'text-destructive' : 
                daysRemaining <= 7 ? 'text-warning' : 'text-success'
              }`}>
                {expired ? (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Plan has expired
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {daysRemaining} days remaining
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {subscription.status === 'demo' && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Usage: {subscription.action_count} / {subscription.max_actions} actions
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  usagePercentage >= 90 ? 'bg-destructive' : 
                  usagePercentage >= 70 ? 'bg-warning' : 'bg-success'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            {usagePercentage >= 90 && (
              <div className="text-sm text-destructive">
                ⚠️ You're running low on demo actions. Consider upgrading to continue.
              </div>
            )}
          </div>
        )}

        {subscription.is_paused && (
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Plan is temporarily paused</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Contact support to resume your subscription.
            </p>
          </div>
        )}

        {(subscription.status === 'demo' || expired) && (
          <Button 
            onClick={() => window.location.href = '/pricing'} 
            className="w-full"
            variant="traditional"
          >
            {subscription.status === 'demo' ? 'Upgrade Plan' : 'Renew Plan'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentPlan;