import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSelector from '@/components/LanguageSelector';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
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
    <div className="min-h-screen bg-gradient-warm">
      {/* Traditional Header */}
      <header className="bg-card/95 backdrop-blur-sm border-b-2 border-accent/20 shadow-traditional sticky top-0 z-50">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-primary rounded-xl p-3 shadow-warm">
              <Calculator className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-wide">{title}</h1>
              <p className="text-sm text-muted-foreground font-medium">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Traditional Main Content */}
      <main className="p-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;