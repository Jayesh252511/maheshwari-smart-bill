import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, Download, Share, Receipt, User, Edit, Printer, Trash2, Share2, MoreVertical, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { toast } from 'sonner';
import { downloadPDF, sharePDF } from '@/utils/pdfGenerator';
import { Bill } from '@/types/bill';
import BillEdit from '@/components/BillEdit';

const BillsHistory: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLocalization();

  useEffect(() => {
    if (user) fetchBills();
  }, [user]);

  const fetchBills = async () => {
    try {
      const { data: billsData, error } = await supabase
        .from('bills')
        .select(`*, customers (name, phone, address), bill_items (*, items (name, unit))`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed: Bill[] = billsData?.map(bill => ({
        id: bill.id,
        bill_number: bill.bill_number,
        customer_id: bill.customer_id,
        customer_name: bill.customers?.name || 'Unknown Customer',
        customer_phone: bill.customers?.phone,
        customer_address: bill.customers?.address,
        items: bill.bill_items?.map((bi: any) => ({
          id: bi.id, item_id: bi.item_id, item_name: bi.items?.name || 'Unknown',
          quantity: bi.quantity, unit_price: Number(bi.unit_price),
          total_price: Number(bi.total_price), unit: bi.items?.unit || 'pcs'
        })) || [],
        subtotal: Number(bill.subtotal), tax_amount: Number(bill.tax_amount),
        total_amount: Number(bill.total_amount), status: bill.status, created_at: bill.created_at
      })) || [];

      setBills(transformed);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error(t('failedToLoadBills'));
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = async (bill: Bill) => {
    try {
      await downloadPDF(bill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' });
      toast.success(t('pdfDownloaded'));
    } catch { toast.error(t('failedToGeneratePDF')); }
  };

  const handleSharePDF = async (bill: Bill) => {
    try {
      await sharePDF(bill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' });
    } catch { toast.error(t('failedToSharePDF')); }
  };

  const handlePrintBill = async (bill: Bill) => {
    try {
      const { bluetoothPrinter } = await import('@/utils/bluetoothPrinter');
      if (!bluetoothPrinter.isConnected()) {
        const devices = await bluetoothPrinter.scanForPrinters();
        if (devices.length > 0) await bluetoothPrinter.connectToPrinter(devices[0]);
      }
      await bluetoothPrinter.printReceipt(bill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' }, t);
      toast.success(t('printed'));
    } catch { toast.error(t('printFailed')); }
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await supabase.from('bill_items').delete().eq('bill_id', billId);
      await supabase.from('bills').delete().eq('id', billId);
      toast.success(t('billDeleted'));
      fetchBills();
    } catch { toast.error(t('failedToDeleteBill')); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}, ${d.getFullYear().toString().slice(2)}`;
  };

  const getTotalRevenue = () => bills.reduce((sum, bill) => sum + bill.total_amount, 0);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="border-2 border-black bg-[hsl(var(--comic-beige))] p-4 shadow-[2px_2px_0px_0px_#000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none border-2 border-black bg-black/5 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-black" />
            </div>
            <div>
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">{t('totalBills')}</p>
              <p className="text-xl font-black text-black font-mono leading-none italic">{bills.length}</p>
            </div>
          </div>
        </div>
        <div className="border-2 border-black bg-[hsl(var(--comic-beige))] p-4 shadow-[2px_2px_0px_0px_#000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none border-2 border-black bg-[hsl(var(--comic-green))] flex items-center justify-center">
              <span className="text-black font-black text-sm italic">₹</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">{t('revenue')}</p>
              <p className="text-xl font-black text-black font-mono leading-none italic">₹{getTotalRevenue().toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl font-black text-black uppercase italic comic-text-stroke leading-none">{t('billsHistory')}</h2>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-3 py-2 border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000]">
          <Search className="h-4 w-4 text-black/40" />
          <Input 
            placeholder={t('searchBills')} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-[10px] font-black placeholder:text-black/20 bg-transparent" 
          />
        </div>

        {/* Bills List */}
        <div className="space-y-2">
          {filteredBills.length === 0 ? (
            <div className="text-center py-12 border-2 border-black border-dashed bg-black/5 opacity-40">
              <Receipt className="h-8 w-8 text-black/10 mx-auto mb-2" />
              <p className="text-[10px] font-black text-black/30 uppercase italic">{t('noBillsFound')}</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <div key={bill.id} className="border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000] p-3 transition-all hover:bg-black/[0.02]" onClick={() => { setSelectedBill(bill); setDetailsOpen(true); }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-black text-black uppercase italic leading-none truncate pr-2">{bill.customer_name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[8px] font-black text-white bg-black px-1.5 py-0.5 uppercase tracking-widest leading-none italic">#{bill.bill_number}</span>
                      <span className="text-[8px] font-black text-black/40 uppercase tracking-widest font-mono italic">{formatDate(bill.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-black font-mono leading-none">₹{bill.total_amount.toFixed(0)}</p>
                    <p className="text-[8px] font-black text-[hsl(var(--comic-green))] uppercase mt-1 italic tracking-widest">{t('completed')}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-black/10" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handlePrintBill(bill)} className="h-8 w-8 border-2 border-black bg-[hsl(var(--comic-cyan))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                    <Printer className="h-3.5 w-3.5 text-black" />
                  </button>
                  <button onClick={() => handleSharePDF(bill)} className="h-8 w-8 border-2 border-black bg-[hsl(var(--comic-yellow))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                    <Share2 className="h-3.5 w-3.5 text-black" />
                  </button>
                  <button onClick={() => { setEditBill(bill); setEditOpen(true); }} className="h-8 w-8 border-2 border-black bg-[hsl(var(--comic-pink))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                    <Edit className="h-3.5 w-3.5 text-black" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto border-4 border-black rounded-none shadow-[10px_10px_0px_0px_#000]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic comic-text-stroke tracking-tighter">{t('saleTitle')}</DialogTitle>
              <DialogDescription className="font-black uppercase tracking-widest text-[9px] text-black/40 italic">{t('invoiceNo')} #{selectedBill?.bill_number}</DialogDescription>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-end border-b-2 border-black border-dotted pb-4">
                  <div>
                    <p className="text-[8px] font-black uppercase text-black/30 mb-1">{t('customer')}</p>
                    <p className="text-sm font-black text-black uppercase italic">{selectedBill.customer_name}</p>
                    <p className="text-[9px] font-black text-black/50 font-mono mt-1">{selectedBill.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-black/30 mb-1">{t('date')}</p>
                    <p className="text-xs font-black text-black font-mono">{formatDate(selectedBill.created_at)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('billedItems')}</span>
                  </div>
                  {selectedBill.items.map((item, index) => (
                    <div key={index} className="border-2 border-black p-3 bg-[hsl(var(--comic-yellow))] shadow-[2px_2px_0px_0px_#000]">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase italic truncate pr-2">{item.item_name}</p>
                          <p className="text-[8px] font-black text-black/40 uppercase mt-1">
                            {item.quantity} x ₹{item.unit_price}
                          </p>
                        </div>
                        <p className="text-xs font-black text-black font-mono italic">₹{item.total_price.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t-4 border-black space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black/50">
                    <span>{t('subtotal')}</span>
                    <span className="font-mono">₹{selectedBill.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedBill.tax_amount > 0 && (
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black/50">
                      <span>{t('tax')}</span>
                      <span className="font-mono">₹{selectedBill.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-black text-white p-4 italic mt-4">
                    <span className="text-sm font-black uppercase tracking-widest">{t('total')}</span>
                    <span className="text-2xl font-black font-mono">₹{selectedBill.total_amount.toFixed(0)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button variant="ghost" onClick={() => handleDeleteBill(selectedBill.id)} className="border-2 border-black rounded-none text-destructive font-black uppercase text-[10px] italic shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all">
                    <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                  </Button>
                  <Button onClick={() => { setEditBill(selectedBill); setEditOpen(true); setDetailsOpen(false); }} className="border-2 border-black bg-[hsl(var(--comic-pink))] text-black font-black uppercase text-[10px] italic shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all">
                    <Edit className="h-4 w-4 mr-2" /> {t('edit')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {editBill && (
          <BillEdit bill={editBill} open={editOpen} onOpenChange={setEditOpen}
            onBillUpdated={() => { fetchBills(); setEditBill(null); }} />
        )}
      </div>
    </>
  );
};

export default BillsHistory;
