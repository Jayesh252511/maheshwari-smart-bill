import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Settings, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Home, BarChart3, Package, Menu } from 'lucide-react';
import { useLocalization } from '@/contexts/LocalizationContext';
import LanguageSelector from '@/components/LanguageSelector';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, currentPage = 'dashboard', onNavigate }) => {
  const { signOut, user } = useAuth();
  const { t } = useLocalization();

  const displayTitle = title || t('maheshwariAgencies');

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('signedOutSuccess'));
    } catch (error) {
      toast.error(t('errorSigningOut'));
    }
  };

  const navItems = [
    { id: 'dashboard', label: t('home'), icon: Home },
    { id: 'bills', label: t('dashboard'), icon: BarChart3 },
    { id: 'items', label: t('items'), icon: Package },
    { id: 'menu', label: t('menu'), icon: Menu },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Clean Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">M</span>
            </div>
            <h1 className="text-lg font-bold text-foreground tracking-tight truncate max-w-[200px] sm:max-w-none">
              {displayTitle}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSelector />
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-9 w-9 text-muted-foreground"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      {onNavigate && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 bottom-nav">
          <div className="flex items-center justify-around py-2 px-2 max-w-4xl mx-auto">
            {navItems.map((item) => {
              const isActive = currentPage === item.id || 
                (item.id === 'dashboard' && currentPage === 'dashboard') ||
                (item.id === 'menu' && ['customers', 'reports', 'ai-support', 'billing'].includes(currentPage));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'menu') {
                      onNavigate('customers');
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  className={`bottom-nav-item flex-1 py-1.5 ${isActive ? 'active' : ''}`}
                >
                  <item.icon className={`h-5 w-5 mx-auto ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
