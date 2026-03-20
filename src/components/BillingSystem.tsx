import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Minus, Trash2, Receipt, Download, Share, Bluetooth, X } from 'lucide-react';
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
  const [quantity, setQuantity] = useState<string>('1');
  const [taxRate, setTaxRate] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [printerConnected, setPrinterConnected] = useState(false);
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
    } catch { toast.error('Failed to load data'); } finally { setLoading(false); }
  };

  const checkPrinterConnection = () => setPrinterConnected(bluetoothPrinter.isConnected());

  const addItemToBill = () => {
    if (!selectedItem || !quantity) { toast.error('Select item and quantity'); return; }
    const item = items.find(i => i.id === selectedItem);
    if (!item) return;
    const qty = parseInt(quantity);
    if (qty <= 0) { toast.error('Quantity must be > 0'); return; }

    const existingIdx = billItems.findIndex(bi => bi.item_id === selectedItem);
    if (existingIdx >= 0) {
      const updated = [...billItems];
      const newQty = updated[existingIdx].quantity + qty;
      updated[existingIdx].quantity = newQty;
      updated[existingIdx].total_price = newQty * item.price;
      setBillItems(updated);
    } else {
      setBillItems([...billItems, {
        id: Date.now().toString(), item_id: selectedItem, item_name: item.name,
        quantity: qty, unit_price: item.price, total_price: qty * item.price, unit: item.unit
      }]);
    }
    setSelectedItem(''); setQuantity('1');
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) { removeItemFromBill(itemId); return; }
    const item = items.find(i => i.id === itemId);
    if (!item) return;
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
    if (!selectedCustomer) { toast.error('Select a customer'); return null; }
    if (billItems.length === 0) { toast.error('Add at least one item'); return null; }
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
      toast.success('Bill saved!');
      return bill;
    } catch { toast.error('Failed to save bill'); return null; } finally { setSaving(false); }
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
      toast.success('Printed!'); resetBill(); setPrintDialogOpen(false);
    } catch (e) { toast.error(`Print failed: ${e}`); }
  };

  const handleDownloadPDF = async () => {
    if (!currentBill) return;
    try { await downloadPDF(currentBill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' }, undefined, t); toast.success('PDF downloaded!'); }
    catch { toast.error('Failed to generate PDF'); }
  };

  const handleSharePDF = async () => {
    if (!currentBill) return;
    try { await sharePDF(currentBill, { name: 'Maheshwari Agency', address: 'matakari galli shegaon', phone: '7020709696' }, t); toast.success('Shared!'); }
    catch { toast.error('Failed to share PDF'); }
  };

  const resetBill = () => {
    setSelectedCustomer(''); setBillItems([]); setSelectedItem(''); setQuantity('1'); setTaxRate('0'); setCurrentBill(null); fetchData();
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
    <div className="space-y-4">
      {/* Sale Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Sale</h2>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          printerConnected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
        }`}>
          <Bluetooth className="h-3 w-3" />
          {printerConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Customer Section */}
      <div className="section-card p-4 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Customer Name *</Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` • ${c.phone}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedCustomerData?.phone && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Phone Number</Label>
            <p className="text-sm font-medium text-foreground">{selectedCustomerData.phone}</p>
          </div>
        )}
      </div>

      {/* Add Items Section */}
      <div className="section-card p-4 space-y-4">
        <h3 className="font-semibold text-foreground">Add Items to Sale</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Item Name</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} (₹{item.price}/{item.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" min="1" className="h-12" />
            </div>
            <div className="flex items-end">
              <Button onClick={addItemToBill} className="w-full h-12">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Billed Items */}
      {billItems.length > 0 && (
        <div className="space-y-3">
          <div className="bg-success/10 text-success px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>✓</span> Billed Items
            </div>
            <span className="text-xs font-normal">Rate excl. tax</span>
          </div>

          {billItems.map((item, index) => (
            <div key={item.id} className="section-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">#{index + 1}</span>
                  <span className="font-semibold text-foreground">{item.item_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">₹ {item.total_price.toFixed(0)}</span>
                  <button onClick={() => removeItemFromBill(item.item_id)} className="p-1 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Item Subtotal: {item.quantity} x {item.unit_price} = ₹ {item.total_price.toFixed(2)}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => updateItemQuantity(item.item_id, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => updateItemQuantity(item.item_id, item.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground ml-1">× ₹{item.unit_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals & Taxes */}
      {billItems.length > 0 && (
        <div className="section-card p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Totals & Taxes</h3>
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal (Rate x Qty)</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax %</span>
              <div className="flex items-center gap-2">
                <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                  className="w-16 h-8 text-center text-sm" min="0" max="100" step="0.1" />
                <span className="text-muted-foreground">₹ {taxAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-dashed pt-2">
              <span>Total Amount:</span>
              <span>₹ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={resetBill}>Clear</Button>
            <Button onClick={handleCheckout} disabled={saving || billItems.length === 0} className="bg-primary">
              <Receipt className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save Bill'}
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {billItems.length === 0 && (
        <div className="section-card flex flex-col items-center justify-center py-12">
          <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No items added</p>
          <p className="text-xs text-muted-foreground">Select a customer and add items to create a bill</p>
        </div>
      )}

      {/* AI Voice Assistant */}
      <div className="mt-4">
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
            <DialogTitle>Bill Created!</DialogTitle>
            <DialogDescription>Choose how to share with your customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button onClick={handlePrint} className="w-full" size="mobile">
              <Bluetooth className="h-4 w-4 mr-2" /> Print Receipt
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="w-full" size="mobile">
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
            {navigator.share && (
              <Button onClick={handleSharePDF} variant="outline" className="w-full" size="mobile">
                <Share className="h-4 w-4 mr-2" /> Share PDF
              </Button>
            )}
            <Button onClick={() => { resetBill(); setPrintDialogOpen(false); }} variant="secondary" className="w-full">
              Create Another Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingSystem;
