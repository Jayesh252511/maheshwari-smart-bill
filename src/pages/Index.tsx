import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import ItemsManager from '@/components/ItemsManager';
import CustomersManager from '@/components/CustomersManager';
import BillingSystem from '@/components/BillingSystem';
import BillsHistory from '@/components/BillsHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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
          <p className="text-muted-foreground">Loading...</p>
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
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'items':
        return 'Items Management';
      case 'customers':
        return 'Customer Management';
      case 'billing':
        return 'Create Bill';
      case 'bills':
        return 'Bills & Reports';
      default:
        return 'Maheshwari Agency';
    }
  };

  return (
    <Layout title={getPageTitle()}>
      {currentPage !== 'dashboard' && (
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      )}
      {renderPage()}
    </Layout>
  );
};

export default Index;
