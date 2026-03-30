import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, Download, Share, Receipt, User, Edit, Printer, Trash2, Share2, MoreVertical } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="section-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('totalBills')}</p>
              <p className="text-lg font-bold text-foreground">{bills.length}</p>
            </div>
          </div>
        </div>
        <div className="section-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <span className="text-success font-bold text-sm">₹</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('revenue')}</p>
              <p className="text-lg font-bold text-foreground">₹{getTotalRevenue().toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="section-card flex items-center gap-3 px-4 py-3">
        <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <Input
          placeholder={t('searchBills')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-0 text-sm"
        />
      </div>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <div className="section-card flex flex-col items-center justify-center py-12">
          <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            {bills.length === 0 ? t('noBillsYet') : t('noBillsFound')}
          </p>
          <p className="text-xs text-muted-foreground">
            {bills.length === 0 ? t('createFirstBill') : t('tryAdjustingSearch')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="transaction-card" onClick={() => { setSelectedBill(bill); setDetailsOpen(true); }}>
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
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handlePrintBill(bill)} className="p-2 text-muted-foreground hover:text-foreground">
                    <Printer className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleSharePDF(bill)} className="p-2 text-muted-foreground hover:text-foreground">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setEditBill(bill); setEditOpen(true); }} className="p-2 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('saleTitle')}</DialogTitle>
            <DialogDescription>{t('invoiceNo')} #{selectedBill?.bill_number}</DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-muted-foreground">{t('invoiceNo')}</p>
                  <p className="font-medium">{selectedBill.bill_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">{t('date')}</p>
                  <p className="font-medium">{formatDate(selectedBill.created_at)}</p>
                </div>
              </div>

              <div className="section-card p-3 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('customerName')}</p>
                  <p className="font-medium">{selectedBill.customer_name}</p>
                </div>
                {selectedBill.customer_phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('phone')}</p>
                    <p className="font-medium">{selectedBill.customer_phone}</p>
                  </div>
                )}
              </div>

              {/* Billed Items */}
              <div>
                <div className="bg-success/10 text-success px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 mb-3">
                  <span>✓</span> {t('billedItems')}
                </div>
                <div className="space-y-3">
                  {selectedBill.items.map((item, index) => (
                    <div key={index} className="section-card p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">#{index + 1}</span>
                            <span className="font-medium">{item.item_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('itemSubtotal')}: {item.quantity} x {item.unit_price} = ₹ {item.total_price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold">₹ {item.total_price.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('subtotal')}</span>
                  <span>₹ {selectedBill.subtotal.toFixed(2)}</span>
                </div>
                {selectedBill.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{t('tax')}</span>
                    <span>₹ {selectedBill.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('total')}</span>
                  <span>₹ {selectedBill.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" onClick={() => handleDeleteBill(selectedBill.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" /> {t('delete')}
                </Button>
                <Button onClick={() => { setEditBill(selectedBill); setEditOpen(true); setDetailsOpen(false); }}>
                  <Edit className="h-4 w-4 mr-1" /> {t('edit')}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleDownloadPDF(selectedBill)}>
                  <Download className="h-4 w-4 mr-1" /> {t('pdf')}
                </Button>
                <Button variant="outline" onClick={() => handlePrintBill(selectedBill)}>
                  <Printer className="h-4 w-4 mr-1" /> {t('print')}
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
  );
};

export default BillsHistory;
