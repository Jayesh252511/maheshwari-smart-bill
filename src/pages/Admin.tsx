import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, Calendar, Bell, Play, Pause } from 'lucide-react';

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

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
  const [loading, setLoading] = useState(false);
  const [newIntentsCount, setNewIntentsCount] = useState(0);
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

    console.log('Setting up real-time subscriptions for admin...');

    // Real-time subscription for purchase intents - using unique channel names
    const purchaseIntentsChannel = supabase
      .channel(`admin-purchase-intents-${Date.now()}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'purchase_intents' },
        (payload) => {
          console.log('Real-time: New purchase intent received:', payload);
          const newIntent = payload.new as PurchaseIntent;
          setPurchaseIntents(prev => {
            // Avoid duplicates
            const exists = prev.some(intent => intent.id === newIntent.id);
            if (exists) return prev;
            return [newIntent, ...prev];
          });
          setNewIntentsCount(prev => prev + 1);
          toast.success('🔔 New purchase request received!', {
            description: `${newIntent.business_name || 'Unknown'} - Plan: ${newIntent.plan_code} - ₹${newIntent.amount}`,
            duration: 5000,
          });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'purchase_intents' },
        () => {
          console.log('Real-time: Purchase intent updated');
          fetchPurchaseIntents();
        }
      )
      .subscribe((status) => {
        console.log('Purchase intents channel status:', status);
      });

    // Real-time subscription for subscription changes
    const subscriptionsChannel = supabase
      .channel(`admin-subscriptions-${Date.now()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        (payload) => {
          console.log('Real-time: Subscription changed:', payload);
          fetchSubscriptions();
        }
      )
      .subscribe((status) => {
        console.log('Subscriptions channel status:', status);
      });

    // Also listen for profile changes to get updated business names
    const profilesChannel = supabase
      .channel(`admin-profiles-${Date.now()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          console.log('Real-time: Profile updated');
          fetchSubscriptions();
        }
      )
      .subscribe((status) => {
        console.log('Profiles channel status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(purchaseIntentsChannel);
      supabase.removeChannel(subscriptionsChannel);
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
    await Promise.all([fetchSubscriptions(), fetchPurchaseIntents()]);
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
            }} variant="outline" className="relative">
              {newIntentsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1">
                  {newIntentsCount}
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <CardTitle className="text-sm font-medium">New Requests</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
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
        </div>

        {/* Purchase Intents Section */}
        {purchaseIntents.length > 0 && (
          <Card className="creative-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
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

        <Card className="creative-card">
          <CardHeader>
            <CardTitle>User Subscriptions</CardTitle>
            <CardDescription>
              Approve users for unlimited access after payment verification
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
      </div>
    </div>
  );
};

export default Admin;