import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Calendar, CreditCard, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  business_name?: string;
}

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_code: string | null;
  start_date: string | null;
  end_date: string | null;
  action_count: number;
  max_actions: number;
  created_at: string;
}

interface PurchaseIntent {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  plan_code: string;
  amount: number;
  timestamp: string;
  status: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchaseIntents, setPurchaseIntents] = useState<PurchaseIntent[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkAdminStatus = async () => {
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(!!data);
      setLoading(false);

      if (data) {
        fetchData();
      }
    };

    checkAdminStatus();
  }, [user]);

  const fetchData = async () => {
    // Fetch users with profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, business_name');

    // Fetch subscriptions  
    const { data: subsData } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch purchase intents
    const { data: intentsData } = await supabase
      .from('purchase_intents')
      .select('*')
      .order('timestamp', { ascending: false });

    if (profilesData) {
      const usersList = profilesData.map(profile => ({
        id: profile.user_id,
        email: '', // Email not accessible in profiles
        business_name: profile.business_name
      }));
      setUsers(usersList);
    }

    setSubscriptions(subsData || []);
    setPurchaseIntents(intentsData || []);
  };

  const activatePlan = async (userId: string, planCode: string) => {
    try {
      const { error } = await supabase.rpc('admin_activate_plan', {
        target_user_id: userId,
        plan_code_param: planCode
      });

      if (error) throw error;

      toast({
        title: "Plan Activated",
        description: "User plan has been successfully activated.",
      });

      fetchData();
    } catch (error) {
      console.error('Error activating plan:', error);
      toast({
        title: "Error",
        description: "Failed to activate plan.",
        variant: "destructive"
      });
    }
  };

  const switchToDemo = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'demo',
          plan_code: null,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          action_count: 0,
          max_actions: 30
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Switched to Demo",
        description: "User has been switched back to demo mode.",
      });

      fetchData();
    } catch (error) {
      console.error('Error switching to demo:', error);
      toast({
        title: "Error", 
        description: "Failed to switch to demo.",
        variant: "destructive"
      });
    }
  };

  const updateIntentStatus = async (intentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('purchase_intents')
        .update({ status })
        .eq('id', intentId);

      if (error) throw error;

      toast({
        title: "Intent Updated",
        description: `Purchase intent marked as ${status}.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating intent:', error);
      toast({
        title: "Error",
        description: "Failed to update intent.",
        variant: "destructive"
      });
    }
  };

  const getPlanName = (planCode: string | null) => {
    switch (planCode) {
      case '199_1m': return '₹199 Monthly';
      case '299_3m': return '₹299 Quarterly';
      case '499_8m': return '₹499 8-Month';
      case '599_12m': return '₹599 Yearly';
      default: return 'Demo';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'demo': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">You don't have admin privileges.</p>
            <Button onClick={() => signOut()} variant="outline">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button onClick={() => signOut()} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by email or business name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
              <p className="text-sm text-muted-foreground">Active Plans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">
                {subscriptions.filter(s => s.status === 'demo').length}
              </p>
              <p className="text-sm text-muted-foreground">Demo Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">
                {purchaseIntents.filter(p => p.status === 'pending').length}
              </p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Intents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Purchase Intents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchaseIntents.map((intent) => (
                <div key={intent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{intent.business_name}</p>
                    <p className="text-sm text-muted-foreground">{intent.email}</p>
                    <p className="text-sm">{getPlanName(intent.plan_code)} - ₹{intent.amount}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(intent.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(intent.status)}>
                      {intent.status}
                    </Badge>
                    {intent.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => updateIntentStatus(intent.id, 'verified')}
                        >
                          Verify
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateIntentStatus(intent.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {purchaseIntents.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No purchase intents found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>User Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((subscription) => {
                const user = users.find(u => u.id === subscription.user_id);
                return (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user?.business_name || 'Unknown Business'}</p>
                      <p className="text-sm text-muted-foreground">ID: {subscription.user_id}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                        <span className="text-sm">{getPlanName(subscription.plan_code)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Actions: {subscription.action_count}/{subscription.max_actions}
                      </p>
                      {subscription.end_date && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(subscription.end_date).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select onValueChange={(planCode) => activatePlan(subscription.user_id, planCode)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Activate Plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="199_1m">₹199 Monthly</SelectItem>
                          <SelectItem value="299_3m">₹299 Quarterly</SelectItem>
                          <SelectItem value="499_8m">₹499 8-Month</SelectItem>
                          <SelectItem value="599_12m">₹599 Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => switchToDemo(subscription.user_id)}
                      >
                        Switch to Demo
                      </Button>
                    </div>
                  </div>
                );
              })}
              {subscriptions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No subscriptions found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;