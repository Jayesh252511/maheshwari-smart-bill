import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import ItemsManager from '@/components/ItemsManager';
import CustomersManager from '@/components/CustomersManager';
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
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Billing System</h2>
            <p className="text-muted-foreground">Coming soon in the next update!</p>
          </div>
        );
      case 'bills':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Bills & Reports</h2>
            <p className="text-muted-foreground">Coming soon in the next update!</p>
          </div>
        );
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
