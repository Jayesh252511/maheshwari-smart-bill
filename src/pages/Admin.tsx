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
import { Shield, Users, Calendar } from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_code: string | null;
  start_date: string | null;
  end_date: string | null;
  action_count: number;
  max_actions: number;
  profiles?: {
    business_name: string | null;
  };
}

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fixed admin credentials
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin123';

  useEffect(() => {
    // Check if admin is already logged in
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession === 'true') {
      setIsLoggedIn(true);
      fetchSubscriptions();
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      localStorage.setItem('adminSession', 'true');
      toast.success('Admin login successful');
      fetchSubscriptions();
    } else {
      toast.error('Invalid admin credentials');
    }
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminSession');
    setUsername('');
    setPassword('');
    toast.success('Admin logged out');
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions' as any)
        .select(`
          *,
          profiles(business_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions((data as any) || []);
    } catch (error) {
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const activatePlan = async (userId: string, planCode: string) => {
    try {
      const { error } = await (supabase as any).rpc('admin_activate_plan', {
        target_user_id: userId,
        plan_code_param: planCode
      });

      if (error) throw error;
      toast.success('Plan activated successfully');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to activate plan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'demo': return 'bg-warning';
      default: return 'bg-muted';
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
            <Button onClick={fetchSubscriptions} variant="outline">
              Refresh Data
            </Button>
            <Button onClick={handleAdminLogout} variant="destructive">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {subscriptions.filter(s => s.status === 'active').length}
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
        </div>

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
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
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