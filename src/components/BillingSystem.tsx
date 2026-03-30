import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Minus, Trash2, Receipt, Download, Share, Bluetooth, X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { bluetoothPrinter } from '@/utils/bluetoothPrinter';
import { downloadPDF, sharePDF } from '@/utils/pdfGenerator';
import { Bill, BillItem, Customer, Item } from '@/types/bill';
import { useLocalization } from '@/contexts/LocalizationContext';
import AIVoiceAssistant from './AIVoiceAssistant';

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

  const showDropdown = showSuggestions && filteredItems.length > 0;

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectItemFromSearch = (item: Item) => {
    setSelectedItem(item.id);
    setItemSearch(item.name);
    setShowSuggestions(false);
  };

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

  const updateItemRate = (itemId: string, newRate: number) => {
    setBillItems(prev => prev.map(bi =>
      bi.item_id === itemId ? { ...bi, unit_price: newRate, total_price: bi.quantity * newRate } : bi
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

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Sale Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t('saleTitle')}</h2>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          printerConnected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
        }`}>
          <Bluetooth className="h-3 w-3" />
          {printerConnected ? t('connected') : t('disconnected')}
        </div>
      </div>

      {/* Customer Section */}
      <div className="bg-card rounded-lg border border-border p-3 space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">{t('customer')} *</Label>
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder={t('selectCustomer')} />
          </SelectTrigger>
          <SelectContent>
            {customers.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}{c.phone ? ` • ${c.phone}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCustomerData?.phone && (
          <p className="text-xs text-muted-foreground">📞 {selectedCustomerData.phone}</p>
        )}
      </div>

      {/* Add Items Section */}
      <div className="bg-card rounded-lg border border-border p-3 space-y-3">
        <h3 className="font-bold text-foreground text-sm">{t('addItems')}</h3>

        {/* Search with autocomplete */}
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchItemsPlaceholder')}
              value={itemSearch}
              onChange={(e) => {
              setItemSearch(e.target.value);
                setShowSuggestions(true);
                if (!e.target.value.trim()) setSelectedItem('');
              }}
              onFocus={() => setShowSuggestions(true)}
              className="h-11 pl-9 text-sm"
            />
          </div>

          {/* Suggestions dropdown */}
          {showDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex items-center justify-between transition-colors ${
                    selectedItem === item.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => selectItemFromSearch(item)}
                >
                  <span className="font-bold text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">₹{item.price}/{item.unit}</span>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && itemSearch.trim() && filteredItems.length === 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-3">
              <p className="text-sm text-muted-foreground text-center">{t('noItemsFound')}</p>
            </div>
          )}
        </div>

        {/* Selected item badge */}
        {selectedItem && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
            <span className="text-xs text-primary font-bold">{t('selected')}</span>
            <span className="text-sm font-bold text-foreground">{items.find(i => i.id === selectedItem)?.name}</span>
          </div>
        )}

        {/* Quantity + Add */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">{t('qty')}</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" min="0" className="h-10 text-sm font-bold bg-primary/5 border-primary/30" />
          </div>
          <div className="flex items-end">
            <Button onClick={addItemToBill} className="h-10 px-4">
              <Plus className="h-4 w-4 mr-1" /> {t('add')}
            </Button>
          </div>
        </div>
      </div>

      {/* Billed Items */}
      {billItems.length > 0 && (
        <div className="space-y-2">
          <div className="bg-success/10 text-success px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-between">
            <span>✓ {t('billedItems')} ({billItems.length})</span>
          </div>

          {billItems.map((item, index) => (
            <div key={item.id} className="bg-card rounded-lg border border-border p-3">
              {/* Item name and total */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">#{index + 1}</span>
                  <span className="font-bold text-foreground text-sm truncate">{item.item_name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-bold text-sm">₹{item.total_price.toFixed(0)}</span>
                  <button onClick={() => removeItemFromBill(item.item_id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quantity and Rate row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-1">{t('qty')}:</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => updateItemQuantity(item.item_id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-bold bg-muted rounded px-1 py-0.5">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => updateItemQuantity(item.item_id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Editable Rate */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{t('rate')}:</span>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItemRate(item.item_id, parseFloat(e.target.value) || 0)}
                    className="h-7 w-20 text-sm text-center"
                    min="0"
                  />
                </div>

                <span className="text-xs text-muted-foreground ml-auto">
                  {item.quantity} × ₹{item.unit_price} = ₹{item.total_price.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      {billItems.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('subtotal')}</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('taxPercent')}</span>
            <div className="flex items-center gap-2">
              <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                className="w-14 h-7 text-center text-sm" min="0" max="100" step="0.1" />
              <span className="text-muted-foreground text-xs">₹{taxAmount.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-dashed pt-2">
            <span>{t('total')}:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" onClick={resetBill} size="sm">{t('clear')}</Button>
            <Button onClick={handleCheckout} disabled={saving || billItems.length === 0} size="sm">
              <Receipt className="h-4 w-4 mr-1" />
              {saving ? t('saving') : t('saveBill')}
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {billItems.length === 0 && (
        <div className="bg-card rounded-lg border border-border flex flex-col items-center justify-center py-10">
          <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">{t('noItemsAdded')}</p>
          <p className="text-xs text-muted-foreground">{t('selectCustomerAndAddItems')}</p>
        </div>
      )}

      {/* AI Voice Assistant */}
      <div className="mt-2">
        <AIVoiceAssistant
          onAddItems={handleVoiceAddItems}
          onSelectCustomer={handleVoiceSelectCustomer}
          availableItems={items.map(item => ({ id: item.id, name: item.name, price: item.price }))}
        />
      </div>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('billCreated')}</DialogTitle>
            <DialogDescription>{t('chooseHowToShare')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button onClick={handlePrint} className="w-full" size="mobile">
              <Bluetooth className="h-4 w-4 mr-2" /> {t('printReceipt')}
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="w-full" size="mobile">
              <Download className="h-4 w-4 mr-2" /> {t('downloadPDF')}
            </Button>
            {navigator.share && (
              <Button onClick={handleSharePDF} variant="outline" className="w-full" size="mobile">
                <Share className="h-4 w-4 mr-2" /> {t('sharePDF')}
              </Button>
            )}
            <Button onClick={() => { resetBill(); setPrintDialogOpen(false); }} variant="secondary" className="w-full">
              {t('createAnotherBill')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingSystem;
