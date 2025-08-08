import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calculator, Receipt, Users, Package } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Signed in successfully!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signUp(email, password, businessName);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          toast.error('Password should be at least 6 characters long.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created! Please check your email for verification.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-8">
        {/* Creative Logo/Brand Section */}
        <div className="text-center space-y-4 animate-scale-in">
          <div className="flex justify-center">
            <div className="bg-gradient-primary rounded-2xl p-4 shadow-warm hover-glow animate-bounce-gentle">
              <Calculator className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl traditional-heading gradient-text">Maheshwari Agency</h1>
            <p className="elegant-text text-lg">Smart Billing Solution</p>
          </div>
        </div>

        {/* Enhanced Features Preview */}
        <div className="grid grid-cols-3 gap-6 py-6 animate-fade-in">
          <div className="text-center group">
            <div className="creative-card p-4 mb-3 group-hover:animate-bounce-gentle">
              <Package className="h-7 w-7 text-accent mx-auto" />
            </div>
            <p className="text-sm elegant-text font-medium">Inventory</p>
          </div>
          <div className="text-center group">
            <div className="creative-card p-4 mb-3 group-hover:animate-bounce-gentle">
              <Users className="h-7 w-7 text-accent mx-auto" />
            </div>
            <p className="text-sm elegant-text font-medium">Customers</p>
          </div>
          <div className="text-center group">
            <div className="creative-card p-4 mb-3 group-hover:animate-bounce-gentle">
              <Receipt className="h-7 w-7 text-accent mx-auto" />
            </div>
            <p className="text-sm elegant-text font-medium">Billing</p>
          </div>
        </div>

        {/* Enhanced Auth Card */}
        <Card className="creative-card animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-xl traditional-heading">Welcome Back</CardTitle>
            <CardDescription className="elegant-text">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                <TabsTrigger value="signin" className="font-medium">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="font-medium">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="animate-fade-in">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="signin-email" className="font-cormorant font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-2 border-accent/20 focus:border-accent hover-glow transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signin-password" className="font-cormorant font-medium">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-2 border-accent/20 focus:border-accent hover-glow transition-all"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full font-semibold tracking-wide" 
                    size="mobile"
                    variant="traditional"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="animate-fade-in">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="business-name" className="font-cormorant font-medium">Business Name</Label>
                    <Input
                      id="business-name"
                      type="text"
                      placeholder="Your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="border-2 border-accent/20 focus:border-accent hover-glow transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="font-cormorant font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-2 border-accent/20 focus:border-accent hover-glow transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="font-cormorant font-medium">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-2 border-accent/20 focus:border-accent hover-glow transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full font-semibold tracking-wide" 
                    size="mobile"
                    variant="traditional"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center elegant-text animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="w-2 h-2 bg-success rounded-full animate-glow"></span>
            Secure • Private • Mobile-First
            <span className="w-2 h-2 bg-success rounded-full animate-glow"></span>
          </div>
        </div>
        
        {/* Floating decorative elements */}
        <div className="fixed top-10 left-10 w-16 h-16 bg-accent/5 rounded-full blur-lg animate-bounce-gentle pointer-events-none"></div>
        <div className="fixed bottom-10 right-10 w-12 h-12 bg-primary/5 rounded-full blur-md animate-glow pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Auth;