import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, Calendar, Bell, Play, Pause, Activity, CreditCard, FileText, TrendingUp } from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_code: string | null;
  start_date: string | null;
  end_date: string | null;
  action_count: number;
  max_actions: number;
  is_paused: boolean;
  profiles?: {
    business_name: string | null;
  };
}

interface PurchaseIntent {
  id: string;
  user_id: string;
  plan_code: string;
  amount: number;
  status: string;
  whatsapp_number: string | null;
  transaction_id: string | null;
  business_name: string | null;
  created_at: string;
}

interface BillingAction {
  id: string;
  user_id: string;
  bill_id: string | null;
  action_type: string;
  description: string | null;
  created_at: string;
  profiles?: {
    business_name: string | null;
  };
}

interface Bill {
  id: string;
  user_id: string;
  bill_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  profiles?: {
    business_name: string | null;
  };
}

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
  const [billingActions, setBillingActions] = useState<BillingAction[]>([]);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [newIntentsCount, setNewIntentsCount] = useState(0);
  const [newBillsCount, setNewBillsCount] = useState(0);
  const [newActionsCount, setNewActionsCount] = useState(0);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  // Check both localStorage admin session and Supabase admin auth
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession === 'true') {
      setIsLoggedIn(true);
      fetchData();
    } else if (user?.email === 'admin@gmail.com') {
      setIsLoggedIn(true);
      fetchData();
    }
  }, [user]);

  // Set up real-time subscriptions when admin is logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    // Real-time subscription for purchase intents
    const purchaseIntentsChannel = supabase
      .channel('purchase-intents-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'purchase_intents' },
        (payload) => {
          console.log('New purchase intent:', payload);
          setPurchaseIntents(prev => [payload.new as PurchaseIntent, ...prev]);
          setNewIntentsCount(prev => prev + 1);
          toast.success('New purchase request received!', {
            description: `Plan: ${payload.new.plan_code} - Amount: ₹${payload.new.amount}`
          });
        }
      )
      .subscribe();

    // Real-time subscription for subscription changes
    const subscriptionsChannel = supabase
      .channel('subscriptions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          fetchSubscriptions();
        }
      )
      .subscribe();

    // Real-time subscription for billing actions
    const billingActionsChannel = supabase
      .channel('billing-actions-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'billing_actions' },
        (payload) => {
          console.log('New billing action:', payload);
          fetchBillingActions();
          setNewActionsCount(prev => prev + 1);
          toast.info(`New action: ${payload.new.action_type}`, {
            description: payload.new.description || 'User performed an action'
          });
        }
      )
      .subscribe();

    // Real-time subscription for bills
    const billsChannel = supabase
      .channel('bills-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bills' },
        (payload) => {
          console.log('New bill created:', payload);
          fetchRecentBills();
          setNewBillsCount(prev => prev + 1);
          toast.success('New bill created!', {
            description: `Bill #${payload.new.bill_number} - ₹${payload.new.total_amount}`
          });
        }
      )
      .subscribe();

    // Real-time subscription for profile updates
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          // Refresh all data when profiles change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(purchaseIntentsChannel);
      supabase.removeChannel(subscriptionsChannel);
      supabase.removeChannel(billingActionsChannel);
      supabase.removeChannel(billsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [isLoggedIn]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Try Supabase authentication first
    if (email === 'admin@gmail.com') {
      try {
        const { error } = await signIn(email, password);
        if (!error) {
          setIsLoggedIn(true);
          toast.success('Admin login successful');
          fetchData();
          return;
        }
      } catch (error) {
        // If Supabase auth fails, fall back to localStorage method
      }
    }
    
    // Fallback to localStorage method
    if (email === 'admin@gmail.com' && password === 'admin123') {
      setIsLoggedIn(true);
      localStorage.setItem('adminSession', 'true');
      toast.success('Admin login successful');
      fetchData();
    } else {
      toast.error('Invalid admin credentials. Use admin@gmail.com / admin123');
    }
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminSession');
    setEmail('');
    setPassword('');
    toast.success('Admin logged out');
  };

  const fetchData = async () => {
    await Promise.all([
      fetchSubscriptions(), 
      fetchPurchaseIntents(), 
      fetchBillingActions(), 
      fetchRecentBills()
    ]);
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // First get all subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        console.error('Subscription fetch error:', subscriptionsError);
        throw subscriptionsError;
      }

      // Then get profiles for those users
      const userIds = subscriptionsData?.map(sub => sub.user_id) || [];
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, business_name')
          .in('user_id', userIds);

        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      // Combine the data
      const combinedData = subscriptionsData?.map(subscription => {
        const profile = profilesData.find(p => p.user_id === subscription.user_id);
        return {
          ...subscription,
          profiles: profile ? { business_name: profile.business_name } : null
        };
      }) || [];

      setSubscriptions(combinedData);
    } catch (error: any) {
      console.error('Failed to fetch subscriptions:', error);
      toast.error(`Failed to fetch subscriptions: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const activatePlan = async (userId: string, planCode: string) => {
    try {
      console.log('Activating plan:', { userId, planCode });
      
      const { data, error } = await supabase.rpc('admin_activate_plan_simple', {
        target_user_id: userId,
        plan_code_param: planCode
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      console.log('RPC Response:', data);

      // Check if data is an object with success property
      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; error?: string };
        if (!result.success) {
          throw new Error(result.error || 'Unknown error occurred');
        }
      }

      toast.success('Plan activated successfully');
      fetchData();
    } catch (error: any) {
      console.error('Failed to activate plan:', error);
      toast.error(`Failed to activate plan: ${error.message || 'Unknown error'}`);
    }
  };

  const fetchPurchaseIntents = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_intents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPurchaseIntents(data || []);
    } catch (error: any) {
      console.error('Failed to fetch purchase intents:', error);
    }
  };

  const getStatusColor = (status: string, isPaused: boolean = false) => {
    if (isPaused) return 'bg-orange-500';
    switch (status) {
      case 'active': return 'bg-success';
      case 'demo': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string, isPaused: boolean = false) => {
    if (isPaused) return 'Paused';
    return status;
  };

  const toggleSubscription = async (userId: string, action: 'pause' | 'resume') => {
    try {
      const { data, error } = await supabase.rpc('admin_toggle_subscription', {
        target_user_id: userId,
        action_type: action
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; message?: string; error?: string };
        if (!result.success) {
          throw new Error(result.error || 'Unknown error');
        }
        toast.success(result.message || `Subscription ${action}d successfully`);
      }

      fetchData();
    } catch (error: any) {
      toast.error(`Failed to ${action} subscription: ${error.message}`);
    }
  };

  const fetchBillingActions = async () => {
    try {
      const { data: actionsData, error: actionsError } = await supabase
        .from('billing_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (actionsError) throw actionsError;

      // Get profiles for those users
      const userIds = actionsData?.map(action => action.user_id) || [];
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, business_name')
          .in('user_id', userIds);

        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      // Combine the data
      const combinedData = actionsData?.map(action => {
        const profile = profilesData.find(p => p.user_id === action.user_id);
        return {
          ...action,
          profiles: profile ? { business_name: profile.business_name } : null
        };
      }) || [];

      setBillingActions(combinedData);
    } catch (error: any) {
      console.error('Failed to fetch billing actions:', error);
    }
  };

  const fetchRecentBills = async () => {
    try {
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (billsError) throw billsError;

      // Get profiles for those users
      const userIds = billsData?.map(bill => bill.user_id) || [];
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, business_name')
          .in('user_id', userIds);

        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      // Combine the data
      const combinedData = billsData?.map(bill => {
        const profile = profilesData.find(p => p.user_id === bill.user_id);
        return {
          ...bill,
          profiles: profile ? { business_name: profile.business_name } : null
        };
      }) || [];

      setRecentBills(combinedData);
    } catch (error: any) {
      console.error('Failed to fetch recent bills:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <Card className="w-full max-w-md creative-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-primary rounded-2xl p-4 shadow-warm">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl traditional-heading">Admin Login</CardTitle>
            <CardDescription className="elegant-text">
              Enter admin credentials to access system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" variant="traditional">
                Login as Admin
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl traditional-heading">Admin Panel</h1>
            <p className="elegant-text">Manage user subscriptions and approvals</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => {
              fetchData();
              setNewIntentsCount(0);
              setNewBillsCount(0);
              setNewActionsCount(0);
            }} variant="outline" className="relative">
              {(newIntentsCount + newBillsCount + newActionsCount) > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1">
                  {newIntentsCount + newBillsCount + newActionsCount}
                </Badge>
              )}
              <Bell className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={handleAdminLogout} variant="destructive">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="creative-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
            </CardContent>
          </Card>

          <Card className="creative-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptions.filter(s => s.status === 'active' && !s.is_paused).length}
              </div>
            </CardContent>
          </Card>

          <Card className="creative-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demo Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptions.filter(s => s.status === 'demo').length}
              </div>
            </CardContent>
          </Card>

          <Card className="creative-card relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Requests</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseIntents.length}</div>
              {newIntentsCount > 0 && (
                <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                  {newIntentsCount}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="creative-card relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bills</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentBills.filter(bill => 
                  new Date(bill.created_at).toDateString() === new Date().toDateString()
                ).length}
              </div>
              {newBillsCount > 0 && (
                <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                  {newBillsCount}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments" className="relative">
              Payments
              {newIntentsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-4 w-4 p-0 flex items-center justify-center">
                  {newIntentsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="activity" className="relative">
              Activity
              {newActionsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs h-4 w-4 p-0 flex items-center justify-center">
                  {newActionsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bills" className="relative">
              Bills
              {newBillsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs h-4 w-4 p-0 flex items-center justify-center">
                  {newBillsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Overview */}
            <Card className="creative-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{purchaseIntents.reduce((sum, intent) => sum + intent.amount, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Pending</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {subscriptions.filter(s => s.status === 'active').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{recentBills.reduce((sum, bill) => sum + bill.total_amount, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Bills Generated</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="creative-card">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Bills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentBills.slice(0, 5).map((bill) => (
                      <div key={bill.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <div>
                          <div className="font-medium">#{bill.bill_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {bill.profiles?.business_name || 'Unknown Business'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₹{bill.total_amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(bill.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="creative-card">
                <CardHeader>
                  <CardTitle className="text-lg">Recent User Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {billingActions.slice(0, 5).map((action) => (
                      <div key={action.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <div>
                          <div className="font-medium">{action.action_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {action.profiles?.business_name || 'Unknown Business'}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(action.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            {/* Purchase Intents Section */}
        {purchaseIntents.length > 0 && (
          <Card className="creative-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Purchase Requests
                {newIntentsCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {newIntentsCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Users who have submitted payment and are waiting for plan activation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseIntents.map((intent) => (
                    <TableRow key={intent.id}>
                      <TableCell>{intent.business_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{intent.plan_code}</Badge>
                      </TableCell>
                      <TableCell>₹{intent.amount}</TableCell>
                      <TableCell>{intent.whatsapp_number}</TableCell>
                      <TableCell className="font-mono text-sm">{intent.transaction_id}</TableCell>
                      <TableCell>{new Date(intent.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => activatePlan(intent.user_id, intent.plan_code)}
                        >
                          Activate Plan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card className="creative-card">
              <CardHeader>
                <CardTitle>User Subscriptions</CardTitle>
                <CardDescription>
                  Manage user plans and subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading subscriptions...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Actions Used</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell className="font-medium">
                            {subscription.profiles?.business_name || 'Unknown Business'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(subscription.status, subscription.is_paused)}>
                              {getStatusText(subscription.status, subscription.is_paused)}
                            </Badge>
                          </TableCell>
                          <TableCell>{subscription.plan_code || 'Demo'}</TableCell>
                          <TableCell>
                            {subscription.action_count} / {subscription.max_actions}
                          </TableCell>
                          <TableCell>
                            {subscription.end_date 
                              ? new Date(subscription.end_date).toLocaleDateString()
                              : 'No limit'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {subscription.status === 'active' && subscription.plan_code ? (
                                // Show pause/resume for active plans
                                <Button
                                  size="sm"
                                  variant={subscription.is_paused ? "default" : "destructive"}
                                  onClick={() => toggleSubscription(
                                    subscription.user_id, 
                                    subscription.is_paused ? 'resume' : 'pause'
                                  )}
                                >
                                  {subscription.is_paused ? (
                                    <>
                                      <Play className="h-4 w-4 mr-1" />
                                      Resume
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="h-4 w-4 mr-1" />
                                      Pause
                                    </>
                                  )}
                                </Button>
                              ) : (
                                // Show plan activation buttons for non-active users
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => activatePlan(subscription.user_id, '199_1m')}
                                  >
                                    1M Plan
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => activatePlan(subscription.user_id, '299_3m')}
                                  >
                                    3M Plan
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => activatePlan(subscription.user_id, '599_12m')}
                                  >
                                    12M Plan
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="creative-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  User Activity Log
                  {newActionsCount > 0 && (
                    <Badge className="bg-blue-500 text-white">
                      {newActionsCount} new
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Real-time log of all user actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Action Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingActions.map((action) => (
                      <TableRow key={action.id}>
                        <TableCell className="font-medium">
                          {action.profiles?.business_name || 'Unknown Business'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{action.action_type}</Badge>
                        </TableCell>
                        <TableCell>{action.description || 'No description'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(action.created_at).toLocaleString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills">
            <Card className="creative-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Bills
                  {newBillsCount > 0 && (
                    <Badge className="bg-green-500 text-white">
                      {newBillsCount} new
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  All bills generated by users in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-mono">#{bill.bill_number}</TableCell>
                        <TableCell className="font-medium">
                          {bill.profiles?.business_name || 'Unknown Business'}
                        </TableCell>
                        <TableCell className="font-bold">₹{bill.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={bill.status === 'completed' ? 'bg-success' : 'bg-warning'}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(bill.created_at).toLocaleString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;