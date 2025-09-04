import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, Users, Receipt, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CurrentPlan from './CurrentPlan';

interface DashboardStats {
  items: number;
  customers: number;
  bills: number;
  revenue: number;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    items: 0,
    customers: 0,
    bills: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [itemsRes, customersRes, billsRes] = await Promise.all([
        supabase.from('items').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('customers').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('bills').select('total_amount').eq('user_id', user?.id)
      ]);

      const revenue = billsRes.data?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;

      setStats({
        items: itemsRes.count || 0,
        customers: customersRes.count || 0,
        bills: billsRes.data?.length || 0,
        revenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'New Bill',
      description: 'Create a new invoice',
      icon: Receipt,
      action: () => onNavigate('billing'),
      variant: 'default' as const,
      color: 'bg-primary'
    },
    {
      title: 'Add Item',
      description: 'Add inventory item',
      icon: Package,
      action: () => onNavigate('items'),
      variant: 'outline' as const,
      color: 'bg-accent'
    },
    {
      title: 'Add Customer',
      description: 'Add new customer',
      icon: Users,
      action: () => onNavigate('customers'),
      variant: 'outline' as const,
      color: 'bg-accent'
    }
  ];

  const statCards = [
    {
      title: 'Total Items',
      value: stats.items,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Total Customers',
      value: stats.customers,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Total Bills',
      value: stats.bills,
      icon: Receipt,
      color: 'text-purple-600'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.revenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <CurrentPlan />
      
      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4" onClick={action.action}>
                <div className="flex items-center gap-4">
                  <div className={`${action.color} rounded-lg p-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Manage</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="mobile"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('items')}
          >
            <Package className="h-6 w-6" />
            <span>Items</span>
          </Button>
          <Button
            variant="outline"
            size="mobile"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('customers')}
          >
            <Users className="h-6 w-6" />
            <span>Customers</span>
          </Button>
          <Button
            variant="outline"
            size="mobile"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('billing')}
          >
            <Receipt className="h-6 w-6" />
            <span>Billing</span>
          </Button>
          <Button
            variant="outline"
            size="mobile"
            className="h-20 flex-col gap-2"
            onClick={() => onNavigate('bills')}
          >
            <TrendingUp className="h-6 w-6" />
            <span>Reports</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;