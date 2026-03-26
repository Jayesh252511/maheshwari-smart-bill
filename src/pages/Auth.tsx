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
import { useLocalization } from '@/contexts/LocalizationContext';
import LanguageSelector from '@/components/LanguageSelector';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLocalization();

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
          toast.error(t('invalidCredentials'));
        } else if (error.message.includes('Email not confirmed')) {
          toast.error(t('emailNotConfirmed'));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(t('signedInSuccess'));
      }
    } catch (error) {
      toast.error(t('unexpectedError'));
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
          toast.error(t('userAlreadyExists'));
        } else if (error.message.includes('Password should be at least 6 characters')) {
          toast.error(t('passwordTooShort'));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(t('accountCreated'));
      }
    } catch (error) {
      toast.error(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Language Selector */}
        <div className="flex justify-end">
          <LanguageSelector />
        </div>

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('maheshwariAgency')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('smartBillingSolution')}</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{t('inventory')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-success" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{t('customers')}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <Receipt className="h-5 w-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{t('billing')}</p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">{t('welcomeBack')}</CardTitle>
            <CardDescription>{t('signInOrCreate')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">{t('signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('email')}</Label>
                    <Input id="signin-email" type="email" placeholder={t('enterEmail')} value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('password')}</Label>
                    <Input id="signin-password" type="password" placeholder={t('enterPassword')} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" size="mobile" disabled={loading}>
                    {loading ? t('signingIn') : t('signIn')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">{t('businessName')}</Label>
                    <Input id="business-name" type="text" placeholder={t('enterBusinessName')} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('email')}</Label>
                    <Input id="signup-email" type="email" placeholder={t('enterEmail')} value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('password')}</Label>
                    <Input id="signup-password" type="password" placeholder={t('createPassword')} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" size="mobile" disabled={loading}>
                    {loading ? t('creatingAccount') : t('createAccount')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">{t('securePrivateMobile')}</p>
      </div>
    </div>
  );
};

export default Auth;
