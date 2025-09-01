import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSelector from '@/components/LanguageSelector';

import { HelpCircle, CreditCard } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onNavigate?: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'Maheshwari Agency' }) => {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm animate-fade-in">
      {/* Creative Traditional Header */}
      <header className="bg-card/95 backdrop-blur-sm border-b-2 border-accent/20 shadow-traditional sticky top-0 z-50 animate-slide-in-right">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-primary rounded-xl p-3 shadow-warm hover-glow animate-bounce-gentle">
              <Calculator className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="animate-scale-in">
              <h1 className="text-2xl traditional-heading gradient-text">{title}</h1>
              <p className="text-sm elegant-text font-medium">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 animate-fade-in">
            <LanguageSelector />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://wa.me/918605601801", "_blank")}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/pricing'}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Plans
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover-glow transition-all duration-300"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Decorative line */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
      </header>

      {/* Enhanced Main Content */}
      <main className="p-6 pb-24 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      {/* Floating decorative elements */}
      <div className="fixed top-20 right-10 w-20 h-20 bg-accent/10 rounded-full blur-xl animate-glow pointer-events-none"></div>
      <div className="fixed bottom-20 left-10 w-16 h-16 bg-primary/10 rounded-full blur-lg animate-bounce-gentle pointer-events-none"></div>
    </div>
  );
};
export default Layout;