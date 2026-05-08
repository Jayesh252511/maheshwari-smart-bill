import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Package, Users, Receipt, TrendingUp, Search, FileText, Settings, ChevronRight, Printer, Share2, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { downloadPDF, sharePDF } from '@/utils/pdfGenerator';
import { Bill } from '@/types/bill';
import WelcomeHero from '@/components/WelcomeHero';

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
      <WelcomeHero onNavigate={onNavigate} stats={stats} />
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
          {/* Quick Links Section */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'addTxn', icon: Receipt, color: 'bg-[hsl(var(--comic-pink))]', action: () => onNavigate('billing') },
              { label: 'saleReport', icon: FileText, color: 'bg-[hsl(var(--comic-green))]', action: () => onNavigate('reports') },
              { label: 'settings', icon: Settings, color: 'bg-[hsl(var(--comic-purple))]', action: () => onNavigate('settings') },
              { label: 'showAll', icon: ChevronRight, color: 'bg-[hsl(var(--comic-cyan))]', action: () => onNavigate('bills') },
            ].map((link, i) => (
              <button 
                key={i} 
                onClick={link.action}
                className="flex flex-col items-center gap-1 p-2 border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <div className={`w-8 h-8 border-2 border-black ${link.color} flex items-center justify-center shadow-[1px_1px_0px_0px_#000]`}>
                  <link.icon className="h-4 w-4 text-black" />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest text-center leading-none">
                  {t(link.label)}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 px-3 py-2 border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000] mb-4">
            <Search className="h-4 w-4 text-black/40" />
            <Input
              placeholder={t('searchTransaction')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-[10px] font-black placeholder:text-black/20 bg-transparent"
            />
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {filteredBills.length === 0 ? (
              <div className="section-card flex flex-col items-center justify-center py-12">
                <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">{t('noTransactionsYet')}</p>
                <Button onClick={() => onNavigate('billing')} className="mt-3" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> {t('addTransaction')}
                </Button>
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill.id} className="border-2 border-black p-3 bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000] relative overflow-hidden transition-all hover:bg-black/[0.02]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-black uppercase italic comic-text-stroke leading-none truncate pr-2">{bill.customer_name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-1.5 py-0.5 bg-[hsl(var(--comic-green))] border-2 border-black text-[6px] font-black uppercase italic tracking-widest text-black">
                          {t('sale')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] font-black text-black/30 uppercase tracking-widest">#{bill.bill_number}</p>
                      <p className="text-[7px] font-black text-black/40 uppercase tracking-widest mt-0.5">{formatDate(bill.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between pt-2 border-t-2 border-black border-dotted">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[6px] font-black text-black/30 uppercase tracking-wider mb-0.5">{t('total')}</p>
                        <p className="text-sm font-black text-black font-mono leading-none italic">₹{bill.total_amount.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-[6px] font-black text-black/30 uppercase tracking-wider mb-0.5">{t('balance')}</p>
                        <p className="text-sm font-black text-black font-mono leading-none italic">₹{bill.total_amount.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handlePrint(bill)} className="h-7 w-7 border-2 border-black bg-[hsl(var(--comic-yellow))] shadow-[1px_1px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                        <Printer className="h-3.5 w-3.5 text-black" />
                      </button>
                      <button onClick={() => handleShare(bill)} className="h-7 w-7 border-2 border-black bg-[hsl(var(--comic-cyan))] shadow-[1px_1px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                        <Share2 className="h-3.5 w-3.5 text-black" />
                      </button>
                      <button onClick={() => onNavigate('bills')} className="h-7 w-7 border-2 border-black bg-[hsl(var(--comic-pink))] shadow-[1px_1px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                        <MoreVertical className="h-3.5 w-3.5 text-black" />
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
          <div className="flex items-center bg-[hsl(var(--comic-beige))] border-2 border-black shadow-[2px_2px_0px_0px_#000] px-3 py-2">
            <Search className="h-4 w-4 text-black/40" />
            <Input
              placeholder={t('searchParty')}
              className="border-none shadow-none focus-visible:ring-0 text-[10px] font-black p-0 h-auto"
            />
          </div>
          <Button onClick={() => onNavigate('customers')} className="w-full h-10 rounded-none border-2 border-black bg-[hsl(var(--comic-cyan))] shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
            <Users className="h-4 w-4 mr-2" /> <span className="text-[10px] font-black uppercase tracking-widest">{t('viewAllCustomers')}</span>
          </Button>
        </div>
      )}

      {/* Floating Add New Sale Button */}
      <Button 
        onClick={() => onNavigate('billing')}
        className="fixed bottom-20 right-4 h-10 px-4 rounded-none border-2 border-black bg-[hsl(var(--comic-pink))] shadow-[3px_3px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all z-40 group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 border-2 border-black bg-[hsl(var(--comic-beige))] group-active:translate-x-0.5 group-active:translate-y-0.5 transition-all">
            <Receipt className="h-3.5 w-3.5 text-black" />
          </div>
          <span className="font-black text-[8px] uppercase tracking-wider text-black italic">{t('addNewSale')}</span>
        </div>
      </Button>
    </div>
  );
};

export default Dashboard;
