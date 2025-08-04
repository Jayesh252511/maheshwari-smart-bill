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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-2">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
          <div>
            <h1 className="font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">
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
            className="text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;