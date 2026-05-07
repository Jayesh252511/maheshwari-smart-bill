import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Minus, Trash2, Receipt, Download, Share, Bluetooth, X, Search, Package, ShoppingCart, Users, Loader2, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { bluetoothPrinter } from '@/utils/bluetoothPrinter';
import { downloadPDF, sharePDF } from '@/utils/pdfGenerator';
import { Bill, BillItem, Customer, Item } from '@/types/bill';
import { useLocalization } from '@/contexts/LocalizationContext';

const BillingSystem: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('0');
  const [taxRate, setTaxRate] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { t } = useLocalization();

  useEffect(() => {
    if (user) { fetchData(); checkPrinterConnection(); }
  }, [user]);

  const fetchData = async () => {
    try {
      const [customersRes, itemsRes] = await Promise.all([
        supabase.from('customers').select('*').eq('user_id', user?.id).order('name'),
        supabase.from('items').select('*').eq('user_id', user?.id).order('name')
      ]);
      if (customersRes.error) throw customersRes.error;
      if (itemsRes.error) throw itemsRes.error;
      setCustomers(customersRes.data || []);
      setItems(itemsRes.data || []);
    } catch { toast.error(t('failedToLoadData')); } finally { setLoading(false); }
  };

  const checkPrinterConnection = () => setPrinterConnected(bluetoothPrinter.isConnected());

  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(q));
  }, [items, itemSearch]);

  const addItemToBill = () => {
    if (!selectedItem) { toast.error(t('selectAnItem')); return; }
    const item = items.find(i => i.id === selectedItem);
    if (!item) return;
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) { toast.error(t('quantityMustBeGreater')); return; }

    const existingIdx = billItems.findIndex(bi => bi.item_id === selectedItem);
    if (existingIdx >= 0) {
      const updated = [...billItems];
      const newQty = updated[existingIdx].quantity + qty;
      updated[existingIdx].quantity = newQty;
      updated[existingIdx].total_price = newQty * updated[existingIdx].unit_price;
      setBillItems(updated);
    } else {
      setBillItems([...billItems, {
        id: Date.now().toString(), item_id: selectedItem, item_name: item.name,
        quantity: qty, unit_price: item.price, total_price: qty * item.price, unit: item.unit
      }]);
    }
    setSelectedItem(''); setQuantity('0'); setItemSearch('');
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) { removeItemFromBill(itemId); return; }
    setBillItems(prev => prev.map(bi =>
      bi.item_id === itemId ? { ...bi, quantity: newQuantity, total_price: newQuantity * bi.unit_price } : bi
    ));
  };

  const removeItemFromBill = (itemId: string) => setBillItems(prev => prev.filter(bi => bi.item_id !== itemId));

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = subtotal * (parseFloat(taxRate) / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const generateBillNumber = async () => {
    const { data } = await supabase.from('bills').select('id', { count: 'exact' }).eq('user_id', user?.id);
    return ((data?.length || 0) + 1).toString().padStart(2, '0');
  };

  const saveBill = async (): Promise<Bill | null> => {
    if (!selectedCustomer) { toast.error(t('selectCustomer')); return null; }
    if (billItems.length === 0) { toast.error(t('addItems')); return null; }
    setSaving(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (!customer) throw new Error('Customer not found');
      const { subtotal, taxAmount, total } = calculateTotals();
      const billNumber = await generateBillNumber();
      const { data: billData, error: billError } = await supabase.from('bills')
        .insert([{ user_id: user?.id, customer_id: selectedCustomer, bill_number: billNumber, subtotal, tax_amount: taxAmount, total_amount: total, status: 'completed' }])
        .select().single();
      if (billError) throw billError;
      const { error: itemsError } = await supabase.from('bill_items')
        .insert(billItems.map(item => ({ bill_id: billData.id, item_id: item.item_id, quantity: item.quantity, unit_price: item.unit_price, total_price: item.total_price })));
      if (itemsError) throw itemsError;
      const bill: Bill = {
        id: billData.id, bill_number: billNumber, customer_id: selectedCustomer,
        customer_name: customer.name, customer_phone: customer.phone, customer_address: customer.address,
        items: billItems, subtotal, tax_amount: taxAmount, total_amount: total, status: 'completed', created_at: billData.created_at
      };
      toast.success(t('billSaved'));
      return bill;
    } catch { toast.error(t('failedToSaveBill')); return null; } finally { setSaving(false); }
  };

  const handleCheckout = async () => {
    const bill = await saveBill();
    if (bill) { setCurrentBill(bill); setPrintDialogOpen(true); }
  };

  const handlePrint = async () => {
    if (!currentBill) return;
    try {
      if (!bluetoothPrinter.isConnected()) {
        const devices = await bluetoothPrinter.scanForPrinters();
        if (devices.length > 0) { await bluetoothPrinter.connectToPrinter(devices[0]); setPrinterConnected(true); }
      }
      await bluetoothPrinter.printReceipt(currentBill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' }, t);
      toast.success(t('printed')); resetBill(); setPrintDialogOpen(false);
    } catch (e) { toast.error(t('printFailed') + `: ${e}`); }
  };

  const handleDownloadPDF = async () => {
    if (!currentBill) return;
    try { await downloadPDF(currentBill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' }, undefined, t); toast.success(t('pdfDownloaded')); }
    catch { toast.error(t('failedToGeneratePDF')); }
  };

  const handleSharePDF = async () => {
    if (!currentBill) return;
    try { await sharePDF(currentBill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' }, t); toast.success(t('shared')); }
    catch { toast.error(t('failedToSharePDF')); }
  };

  const resetBill = () => {
    setSelectedCustomer(''); setBillItems([]); setSelectedItem(''); setQuantity('0'); setTaxRate('0'); setCurrentBill(null); setItemSearch(''); fetchData();
  };

  const handleVoiceAddItems = useCallback((voiceItems: { name: string; quantity: number }[]) => {
    voiceItems.forEach(voiceItem => {
      const matchingItem = items.find(item =>
        item.name.toLowerCase().includes(voiceItem.name.toLowerCase()) || voiceItem.name.toLowerCase().includes(item.name.toLowerCase())
      );
      if (matchingItem) {
        setTimeout(() => {
          const qty = voiceItem.quantity;
          if (qty <= 0) return;
          const existingIdx = billItems.findIndex(bi => bi.item_id === matchingItem.id);
          if (existingIdx >= 0) {
            const updated = [...billItems];
            updated[existingIdx].quantity += qty;
            updated[existingIdx].total_price = updated[existingIdx].quantity * matchingItem.price;
            setBillItems(updated);
          } else {
            setBillItems(prev => [...prev, {
              id: Date.now().toString() + Math.random(), item_id: matchingItem.id, item_name: matchingItem.name,
              quantity: qty, unit_price: matchingItem.price, total_price: qty * matchingItem.price, unit: matchingItem.unit
            }]);
          }
        }, 100);
      }
    });
  }, [items, billItems]);

  const handleVoiceSelectCustomer = useCallback((customerName: string) => {
    const match = customers.find(c => c.name.toLowerCase().includes(customerName.toLowerCase()) || customerName.toLowerCase().includes(c.name.toLowerCase()));
    if (match) { setSelectedCustomer(match.id); toast.success(`Selected: ${match.name}`); }
  }, [customers]);

  const { subtotal, taxAmount, total } = calculateTotals();
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <>
      <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-24 lg:pb-8">
        {/* Sale Header */}
        <div className="flex items-center justify-between px-1 mb-6">
          <h2 className="text-2xl font-black text-black tracking-tighter italic uppercase comic-text-stroke leading-none">
            {t('saleTitle')}
          </h2>
          <div className={`flex items-center gap-2 px-4 py-3 border-2 border-black font-black uppercase tracking-wider transition-all shadow-[3px_3px_0px_0px_#000] text-sm ${
            printerConnected 
              ? 'bg-[hsl(var(--comic-green))] text-black' 
              : 'bg-[hsl(var(--comic-beige))] text-black/40'
          }`}>
            <Bluetooth className="h-5 w-5" />
            <span className="hidden sm:inline">{printerConnected ? t('connected') : t('disconnected')}</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Selection */}
            <div className="comic-card bg-[hsl(var(--comic-beige))] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-black" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">{t('customer')} *</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Select value={selectedCustomer || ""} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="h-10 border-2 border-black rounded-none font-black text-xs focus:ring-0 shadow-[2px_2px_0px_0px_#000] bg-[hsl(var(--comic-beige))]">
                      <SelectValue placeholder={t('selectCustomer')} />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black rounded-none">
                      <SelectItem value="walkin" className="font-black text-xs uppercase">{t('walkinCustomer')}</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="font-black text-xs uppercase">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setShowAddCustomer(true)} className="h-10 w-10 border-2 border-black bg-[hsl(var(--comic-cyan))] shadow-[2px_2px_0px_0px_#000] active:shadow-none p-0 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-black stroke-[3px]" />
                </Button>
              </div>
            </div>

            {/* Items Grid */}
            <div className="comic-card bg-[hsl(var(--comic-beige))] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-black" />
                  <h3 className="text-xs font-black text-black uppercase italic tracking-tighter leading-none">{t('addItems')}</h3>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000] mb-4">
                <Search className="h-4 w-4 text-black/40" />
                <Input 
                  placeholder={t('searchItems')} 
                  value={itemSearch} 
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-[10px] font-black placeholder:text-black/20 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-1 comic-scrollbar">
                {filteredItems.map((item) => {
                  const inBill = billItems.find(bi => bi.item_id === item.id);
                  const qty = inBill?.quantity || 0;
                  return (
                    <div key={item.id} className={`group relative border-2 border-black p-2.5 transition-all flex flex-col justify-between ${qty > 0 ? 'bg-[hsl(var(--comic-pink))] translate-x-0.5 translate-y-0.5' : 'bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000]'}`}>
                      <div onClick={() => { if (!inBill) setBillItems([...billItems, { id: Date.now().toString(), item_id: item.id, item_name: item.name, quantity: 1, unit_price: item.price, total_price: item.price, unit: item.unit }]); }} className="cursor-pointer">
                        <h4 className="text-[10px] font-black text-black uppercase italic leading-tight line-clamp-2">{item.name}</h4>
                        <p className="text-[8px] font-black text-black/40 mt-1 uppercase tracking-widest">₹{item.price.toFixed(0)}/{item.unit}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/10">
                        {qty > 0 ? (
                          <div className="flex items-center justify-between w-full">
                            <button onClick={() => updateItemQuantity(item.id, qty - 1)} className="h-6 w-6 border-2 border-black bg-[hsl(var(--comic-beige))] flex items-center justify-center shadow-[1px_1px_0px_0px_#000]"><Minus className="h-3 w-3 text-black" /></button>
                            <span className="text-[10px] font-black font-mono">{qty}</span>
                            <button onClick={() => updateItemQuantity(item.id, qty + 1)} className="h-6 w-6 border-2 border-black bg-[hsl(var(--comic-beige))] flex items-center justify-center shadow-[1px_1px_0px_0px_#000]"><Plus className="h-3 w-3 text-black" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setBillItems([...billItems, { id: Date.now().toString(), item_id: item.id, item_name: item.name, quantity: 1, unit_price: item.price, total_price: item.price, unit: item.unit }])} className="w-full py-1 border-2 border-black bg-[hsl(var(--comic-yellow))] text-[8px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000]">{t('add')}</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Cart Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="comic-card bg-[hsl(var(--comic-beige))] p-4 space-y-4 border-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-5 w-5 text-black" />
                <h3 className="text-sm font-black text-black uppercase italic tracking-tighter leading-none">{t('billSummary')}</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 comic-scrollbar">
                {billItems.length === 0 ? (
                  <div className="text-center py-10 border-2 border-black border-dashed bg-black/5 opacity-40">
                    <p className="text-[10px] font-black uppercase italic">{t('noItemsInBill')}</p>
                  </div>
                ) : (
                  billItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center gap-3 p-2 border-2 border-black bg-[hsl(var(--comic-yellow))] shadow-[2px_2px_0px_0px_#000]">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase truncate leading-none mb-1">{item.item_name}</p>
                        <p className="text-[8px] font-black text-black/40 uppercase">₹{item.unit_price} x {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black font-mono italic leading-none mb-1">₹{item.total_price.toFixed(0)}</p>
                        <button onClick={() => setBillItems(billItems.filter(bi => bi.id !== item.id))} className="text-[8px] font-black text-black/30 uppercase hover:text-black underline">{t('remove')}</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-4 border-t-4 border-black space-y-2">
                <div className="flex justify-between text-xs font-black uppercase">
                  <span>{t('subtotal')}</span>
                  <span className="font-mono">₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-black uppercase bg-black text-white p-2">
                  <span>{t('total')}</span>
                  <span className="text-xl font-mono">₹{total.toFixed(0)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="ghost" onClick={resetBill} disabled={billItems.length === 0} className="h-10 border-2 border-black rounded-none font-black text-[10px] uppercase">{t('clear')}</Button>
                  <Button onClick={handleCheckout} disabled={saving || billItems.length === 0 || !selectedCustomer} className="h-10 border-2 border-black rounded-none font-black text-[10px] uppercase bg-[hsl(var(--comic-green))] shadow-[2px_2px_0px_0px_#000]">{t('generateBill')}</Button>
                </div>
              </div>
            </div>
            <div className="mt-3 p-2 bg-[hsl(var(--comic-yellow))] border-2 border-black text-center">
              <p className="text-[7px] font-black uppercase tracking-widest leading-none italic">{t('fastBillingNote')}</p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-4 border-black rounded-none shadow-[12px_12px_0px_0px_#000] bg-[hsl(var(--comic-beige))]">
          <div className="bg-[hsl(var(--comic-green))] px-8 py-12 text-center border-b-4 border-black relative overflow-hidden">
            <div className="w-20 h-20 bg-[hsl(var(--comic-beige))] border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_#000]">
              <Receipt className="h-10 w-10 text-black stroke-[3px]" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-black tracking-tighter uppercase italic comic-text-stroke leading-none">{t('billCreated')}</DialogTitle>
              <DialogDescription className="text-black font-black uppercase tracking-widest text-[9px] mt-3 italic">{t('chooseHowToShare')}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6 bg-[hsl(var(--comic-beige))]">
            <Button onClick={handlePrint} className="w-full h-18 border-4 border-black bg-[hsl(var(--comic-cyan))] text-black font-black text-lg uppercase shadow-[6px_6px_0px_0px_#000]">{t('printReceipt')}</Button>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={handleDownloadPDF} className="h-14 border-2 border-black bg-[hsl(var(--comic-beige))] text-black font-black uppercase text-[9px] shadow-[4px_4px_0px_0px_#000]">{t('downloadPDF')}</Button>
              {navigator.share && (
                <Button onClick={handleSharePDF} className="h-14 border-2 border-black bg-[hsl(var(--comic-beige))] text-black font-black uppercase text-[9px] shadow-[4px_4px_0px_0px_#000]">{t('share')}</Button>
              )}
            </div>
            <Button variant="ghost" onClick={() => { resetBill(); setPrintDialogOpen(false); }} className="w-full font-black uppercase text-[10px] tracking-widest hover:text-black transition-colors">{t('done')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BillingSystem;
