import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Package, Users, Receipt, TrendingUp, Search, FileText, Settings, ChevronRight, Printer, Share2, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { downloadPDF, sharePDF } from '@/utils/pdfGenerator';
import { Bill } from '@/types/bill';
import { useLocalization } from '@/contexts/LocalizationContext';

interface DashboardStats {
  items: number;
  customers: number;
  bills: number;
  revenue: number;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({ items: 0, customers: 0, bills: 0, revenue: 0 });
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'parties'>('transactions');
  const { user } = useAuth();
  const { t } = useLocalization();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [itemsRes, customersRes, billsRes] = await Promise.all([
        supabase.from('items').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('customers').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('bills').select(`*, customers (name, phone, address), bill_items (*, items (name, unit))`).eq('user_id', user?.id).order('created_at', { ascending: false }).limit(20)
      ]);

      const revenue = billsRes.data?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;

      setStats({
        items: itemsRes.count || 0,
        customers: customersRes.count || 0,
        bills: billsRes.data?.length || 0,
        revenue
      });

      const transformed: Bill[] = billsRes.data?.map(bill => ({
        id: bill.id,
        bill_number: bill.bill_number,
        customer_id: bill.customer_id,
        customer_name: bill.customers?.name || 'Cash',
        customer_phone: bill.customers?.phone,
        customer_address: bill.customers?.address,
        items: bill.bill_items?.map((bi: any) => ({
          id: bi.id,
          item_id: bi.item_id,
          item_name: bi.items?.name || 'Unknown',
          quantity: bi.quantity,
          unit_price: Number(bi.unit_price),
          total_price: Number(bi.total_price),
          unit: bi.items?.unit || 'pcs'
        })) || [],
        subtotal: Number(bill.subtotal),
        tax_amount: Number(bill.tax_amount),
        total_amount: Number(bill.total_amount),
        status: bill.status,
        created_at: bill.created_at
      })) || [];

      setRecentBills(transformed);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (bill: Bill) => {
    try {
      const { bluetoothPrinter } = await import('@/utils/bluetoothPrinter');
      if (!bluetoothPrinter.isConnected()) {
        const devices = await bluetoothPrinter.scanForPrinters();
        if (devices.length > 0) await bluetoothPrinter.connectToPrinter(devices[0]);
      }
      await bluetoothPrinter.printReceipt(bill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' });
      toast.success(t('printed'));
    } catch (e) {
      toast.error(t('printFailed'));
    }
  };

  const handleShare = async (bill: Bill) => {
    try {
      await sharePDF(bill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' });
    } catch (e) {
      toast.error(t('shareFailed'));
    }
  };

  const filteredBills = recentBills.filter(bill =>
    bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}, ${d.getFullYear().toString().slice(2)}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded-lg animate-pulse" />
        <div className="section-card p-4 space-y-3">
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        </div>
        {[1,2,3].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-0 bg-muted rounded-full p-1">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'transactions' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          {t('transactionDetails')}
        </button>
        <button
          onClick={() => setActiveTab('parties')}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'parties' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          {t('partyDetails')}
        </button>
      </div>

      {activeTab === 'transactions' && (
        <>
          {/* Quick Links */}
          <div className="section-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('quickLinks')}</h3>
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => onNavigate('billing')} className="quick-link-card">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-accent" />
                </div>
                <span className="text-xs font-medium text-foreground">{t('addTransaction')}</span>
              </button>
              <button onClick={() => onNavigate('reports')} className="quick-link-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">{t('saleReport')}</span>
              </button>
              <button onClick={() => onNavigate('items')} className="quick-link-card">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-warning" />
                </div>
                <span className="text-xs font-medium text-foreground">{t('settings')}</span>
              </button>
              <button onClick={() => onNavigate('bills')} className="quick-link-card">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-foreground">{t('showAll')}</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="section-card flex items-center gap-3 px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder={t('searchForTransaction')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-0 text-sm"
            />
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {filteredBills.length === 0 ? (
              <div className="section-card flex flex-col items-center justify-center py-12">
                <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">{t('noTransactionsYet')}</p>
                <Button onClick={() => onNavigate('billing')} className="mt-3" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> {t('addTransactionFull')}
                </Button>
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill.id} className="transaction-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{bill.customer_name}</p>
                      <span className="sale-badge mt-1">{t('sale')}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">#{bill.bill_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(bill.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('total')}</p>
                        <p className="font-semibold text-foreground">₹ {bill.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('balance')}</p>
                        <p className="font-semibold text-foreground">₹ {bill.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handlePrint(bill)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Printer className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleShare(bill)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => onNavigate('bills')} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'parties' && (
        <div className="space-y-3">
          <div className="section-card flex items-center gap-3 px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder={t('searchForParty')}
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-0 text-sm"
            />
          </div>
          <Button onClick={() => onNavigate('customers')} className="w-full" variant="outline">
            <Users className="h-4 w-4 mr-2" /> {t('viewAllCustomers')}
          </Button>
        </div>
      )}

      {/* Floating Add New Sale Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => onNavigate('billing')}
          className="rounded-full shadow-lg px-6 h-12 bg-accent hover:bg-accent/90 text-accent-foreground"
          size="mobile"
        >
          <Receipt className="h-5 w-5 mr-2" />
          {t('addNewSale')}
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
