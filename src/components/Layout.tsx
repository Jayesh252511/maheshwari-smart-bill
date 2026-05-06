import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Settings, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Home, BarChart3, Package, Menu } from 'lucide-react';
import { useLocalization } from '@/contexts/LocalizationContext';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, currentPage = 'dashboard', onNavigate }) => {
  const { signOut, user } = useAuth();
  const { t } = useLocalization();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('signedOutSuccess'));
    } catch (error) {
      toast.error(t('errorSigningOut'));
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'home', icon: Home },
    { id: 'bills', label: 'dashboard', icon: BarChart3 },
    { id: 'items', label: 'items', icon: Package },
    { id: 'menu', label: 'menu', icon: Menu },
  ];

  const displayTitle = title || t('maheshwariAgencies');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-[hsl(var(--comic-beige))] border-b-2 border-black px-4 py-2.5">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[hsl(var(--comic-yellow))] border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] flex items-center justify-center">
              <span className="font-black text-base italic">D</span>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase italic comic-text-stroke leading-none">DUKANPAY</h1>
              <span className="text-[8px] font-black uppercase text-black/40 tracking-widest">SMART BILL</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate && onNavigate('settings')}
              className="h-9 w-9 border-2 border-black bg-[hsl(var(--comic-cyan))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Settings className="h-4 w-4 text-black" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-9 w-9 border-2 border-black bg-[hsl(var(--comic-pink))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <LogOut className="h-4 w-4 text-black" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pb-20">
          {children}
        </div>
      </main>

      {onNavigate && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
          <div className="border-2 border-black shadow-[3px_3px_0px_0px_#000] bg-[hsl(var(--comic-beige))] max-w-lg mx-auto flex items-center justify-around py-2 px-1">
            {navItems.map((item, index) => {
              const isActive = currentPage === item.id || 
                (item.id === 'dashboard' && currentPage === 'dashboard') ||
                (item.id === 'menu' && ['customers', 'reports', 'ai-support', 'billing'].includes(currentPage));
              
              const colors = ['bg-[hsl(var(--comic-yellow))]', 'bg-[hsl(var(--comic-cyan))]', 'bg-[hsl(var(--comic-pink))]', 'bg-[hsl(var(--comic-green))]'];
              const bgColor = colors[index % colors.length];

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
                  className={`flex-1 flex flex-col items-center gap-0.5 transition-all ${isActive ? 'translate-x-0.5 translate-y-0.5 scale-105' : 'hover:-translate-x-0.5 hover:-translate-y-0.5'}`}
                >
                  <div className={`p-1.5 border-2 border-black transition-all ${isActive ? `${bgColor} shadow-[1.5px_1.5px_0px_0px_#000]` : 'bg-transparent text-black'}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-black' : 'text-black/30'}`} />
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-black' : 'text-black/20'}`}>
                    {t(item.label)}
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
