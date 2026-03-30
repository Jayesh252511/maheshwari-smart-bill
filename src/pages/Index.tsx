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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
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
      default:
        return t('maheshwariAgencies');
    }
  };

  const showBackButton = ['billing', 'reports', 'ai-support'].includes(currentPage);

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
      {renderPage()}
    </Layout>
  );
};

export default Index;
