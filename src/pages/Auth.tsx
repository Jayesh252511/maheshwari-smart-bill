import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Receipt, Users, Package, ArrowRight } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { t } = useLocalization();
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
    <div className="min-h-screen bg-[hsl(var(--comic-beige))] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Language Selector */}
        <div className="flex justify-end">
          <div className="border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000]">
            <LanguageSelector />
          </div>
        </div>

        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-[hsl(var(--comic-yellow))] border-4 border-black shadow-[6px_6px_0px_0px_#000] flex items-center justify-center mx-auto mb-2">
            <span className="font-black text-4xl italic">D</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-black tracking-tighter uppercase italic comic-text-stroke leading-none">DUKANPAY</h1>
            <p className="text-[10px] font-black uppercase text-black/40 tracking-widest mt-3 italic">{t('smartBillingSolution')}</p>
          </div>
        </div>

        {/* Features - Comic Style */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border-2 border-black bg-[hsl(var(--comic-cyan))] p-3 shadow-[3px_3px_0px_0px_#000] text-center">
            <Package className="h-5 w-5 text-black mx-auto mb-1 stroke-[3px]" />
            <p className="text-[8px] font-black uppercase italic leading-none">{t('inventory')}</p>
          </div>
          <div className="border-2 border-black bg-[hsl(var(--comic-green))] p-3 shadow-[3px_3px_0px_0px_#000] text-center">
            <Users className="h-5 w-5 text-black mx-auto mb-1 stroke-[3px]" />
            <p className="text-[8px] font-black uppercase italic leading-none">{t('customers')}</p>
          </div>
          <div className="border-2 border-black bg-[hsl(var(--comic-pink))] p-3 shadow-[3px_3px_0px_0px_#000] text-center">
            <Receipt className="h-5 w-5 text-black mx-auto mb-1 stroke-[3px]" />
            <p className="text-[8px] font-black uppercase italic leading-none">{t('billing')}</p>
          </div>
        </div>

        {/* Auth Box - Neubrutalist */}
        <div className="border-4 border-black bg-[hsl(var(--comic-beige))] shadow-[8px_8px_0px_0px_#000] overflow-hidden">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none h-14 bg-black p-0 gap-0">
              <TabsTrigger 
                value="signin" 
                className="rounded-none h-full data-[state=active]:bg-[hsl(var(--comic-yellow))] data-[state=active]:text-black text-white font-black uppercase italic tracking-widest text-xs border-r-2 border-black"
              >
                {t('signIn')}
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="rounded-none h-full data-[state=active]:bg-[hsl(var(--comic-yellow))] data-[state=active]:text-black text-white font-black uppercase italic tracking-widest text-xs"
              >
                {t('signUp')}
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-[10px] font-black uppercase tracking-widest italic">{t('email')}</Label>
                    <Input 
                      id="signin-email" 
                      type="email" 
                      placeholder={t('enterEmail')} 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] h-12 font-black text-sm focus-visible:ring-0 placeholder:text-black/20 bg-[hsl(var(--comic-beige))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-[10px] font-black uppercase tracking-widest italic">{t('password')}</Label>
                    <Input 
                      id="signin-password" 
                      type="password" 
                      placeholder={t('enterPassword')} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] h-12 font-black text-sm focus-visible:ring-0 placeholder:text-black/20 bg-[hsl(var(--comic-beige))]"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 border-2 border-black bg-[hsl(var(--comic-green))] text-black font-black uppercase text-sm italic tracking-widest shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all mt-4" 
                    disabled={loading}
                  >
                    {loading ? t('signingIn') : (
                      <span className="flex items-center gap-2">
                        {t('signIn')} <ArrowRight className="h-4 w-4 stroke-[3px]" />
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="business-name" className="text-[10px] font-black uppercase tracking-widest italic">{t('businessName')}</Label>
                    <Input 
                      id="business-name" 
                      type="text" 
                      placeholder={t('yourBusinessName')} 
                      value={businessName} 
                      onChange={(e) => setBusinessName(e.target.value)} 
                      className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] h-12 font-black text-sm focus-visible:ring-0 placeholder:text-black/20 bg-[hsl(var(--comic-beige))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[10px] font-black uppercase tracking-widest italic">{t('email')}</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder={t('enterEmail')} 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] h-12 font-black text-sm focus-visible:ring-0 placeholder:text-black/20 bg-[hsl(var(--comic-beige))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-widest italic">{t('password')}</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder={t('createPassword')} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      minLength={6} 
                      className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] h-12 font-black text-sm focus-visible:ring-0 placeholder:text-black/20 bg-[hsl(var(--comic-beige))]"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 border-2 border-black bg-[hsl(var(--comic-pink))] text-black font-black uppercase text-sm italic tracking-widest shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all mt-4" 
                    disabled={loading}
                  >
                    {loading ? t('creatingAccount') : (
                      <span className="flex items-center gap-2">
                        {t('createAccount')} <ArrowRight className="h-4 w-4 stroke-[3px]" />
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-black/30 italic">{t('securePrivateMobile')}</p>
      </div>
    </div>
  );
};

export default Auth;
