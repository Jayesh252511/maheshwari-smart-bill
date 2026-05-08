import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/contexts/LocalizationContext';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import ItemsManager from '@/components/ItemsManager';
import CustomersManager from '@/components/CustomersManager';
import BillingSystem from '@/components/BillingSystem';
import BillsHistory from '@/components/BillsHistory';
import Reports from '@/components/Reports';
import AICustomerSupport from '@/components/AICustomerSupport';
import SettingsManager from '@/components/SettingsManager';
import UpgradePage from '@/components/UpgradePage';
import FreeTierBanner from '@/components/FreeTierBanner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--comic-beige))]">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-[hsl(var(--comic-yellow))] border-4 border-black shadow-[6px_6px_0px_0px_#000] flex items-center justify-center mx-auto animate-bounce">
            <span className="font-black text-4xl italic">D</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-black tracking-tighter uppercase italic comic-text-stroke leading-none">DUKANPAY</h1>
            <p className="text-[10px] font-black uppercase text-black/40 tracking-widest italic animate-pulse">{t('loading')}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'items':
        return <ItemsManager />;
      case 'customers':
        return <CustomersManager />;
      case 'billing':
        return <BillingSystem />;
      case 'bills':
        return <BillsHistory />;
      case 'reports':
        return <Reports />;
      case 'ai-support':
        return <AICustomerSupport />;
      case 'settings':
        return <SettingsManager />;
      case 'upgrade':
        return <UpgradePage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'items':
        return t('itemsManagement');
      case 'customers':
        return t('customerManagement');
      case 'billing':
        return t('createBill');
      case 'bills':
        return t('billsAndReports');
      case 'settings':
        return t('settings');
      default:
        return t('maheshwariAgencies');
    }
  };

  const showBackButton = ['billing', 'reports', 'ai-support', 'settings'].includes(currentPage);

  return (
    <Layout title={getPageTitle()} currentPage={currentPage} onNavigate={setCurrentPage}>
      {showBackButton && (
        <div className="mb-3">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-2 text-sm -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
        </div>
      )}
      {currentPage !== 'upgrade' && currentPage !== 'dashboard' && (
        <FreeTierBanner onUpgrade={() => setCurrentPage('upgrade')} />
      )}
      {renderPage()}
    </Layout>
  );
};

export default Index;
