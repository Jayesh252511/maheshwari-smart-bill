import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Minus, Plus, Save, X, Search, Trash2, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bill, BillItem, Customer, Item } from '@/types/bill';
import { useLocalization } from '@/contexts/LocalizationContext';

interface BillEditProps {
  bill: Bill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBillUpdated: () => void;
}

const BillEdit: React.FC<BillEditProps> = ({ bill, open, onOpenChange, onBillUpdated }) => {
  const { user } = useAuth();
  const { t } = useLocalization();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState(bill.customer_id);
  const [billItems, setBillItems] = useState<BillItem[]>(bill.items);
  const [taxRate, setTaxRate] = useState<string>(((bill.tax_amount / (bill.subtotal || 1)) * 100).toFixed(1));
  const [loading, setLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchCustomers();
      fetchItems();
    }
  }, [open, user]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      setCustomers(data || []);
    } catch { toast.error(t('failedToLoadCustomers')); }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase.from('items').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      setItems(data || []);
    } catch { toast.error(t('failedToLoadItems')); }
  };

  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return items;
    const q = itemSearch.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(q));
  }, [items, itemSearch]);

  const addItem = () => {
    const newItem: BillItem = {
      id: `temp_${Date.now()}`, item_id: '', item_name: '', quantity: 1,
      unit_price: 0, total_price: 0, unit: 'pcs'
    };
    setBillItems([...billItems, newItem]);
  };

  const updateBillItem = (index: number, field: keyof BillItem, value: any) => {
    const updatedItems = [...billItems];
    const item = updatedItems[index];
    if (field === 'item_id') {
      const selectedItem = items.find(i => i.id === value);
      if (selectedItem) {
        item.item_id = value;
        item.item_name = selectedItem.name;
        item.unit_price = selectedItem.price;
        item.unit = selectedItem.unit;
        item.total_price = item.quantity * selectedItem.price;
      }
    } else if (field === 'quantity') {
      item.quantity = Math.max(0, parseInt(value) || 0);
      item.total_price = item.quantity * item.unit_price;
    } else if (field === 'unit_price') {
      item.unit_price = parseFloat(value) || 0;
      item.total_price = item.quantity * item.unit_price;
    } else {
      (item as any)[field] = value;
    }
    setBillItems(updatedItems);
  };

  const removeBillItem = (index: number) => setBillItems(billItems.filter((_, i) => i !== index));

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = subtotal * (parseFloat(taxRate) / 100);
    return { subtotal, tax_amount: taxAmount, total_amount: subtotal + taxAmount };
  };

  const handleUpdateBill = async () => {
    if (!selectedCustomer) { toast.error(t('selectCustomer')); return; }
    if (billItems.length === 0 || billItems.some(item => !item.item_id)) {
      toast.error(t('addItems')); return;
    }
    setLoading(true);
    try {
      const { subtotal, tax_amount, total_amount } = calculateTotals();
      const { error: billError } = await supabase.from('bills')
        .update({ customer_id: selectedCustomer, subtotal, tax_amount, total_amount, updated_at: new Date().toISOString() })
        .eq('id', bill.id);
      if (billError) throw billError;

      const { error: deleteError } = await supabase.from('bill_items').delete().eq('bill_id', bill.id);
      if (deleteError) throw deleteError;

      const { error: itemsError } = await supabase.from('bill_items')
        .insert(billItems.map(item => ({ bill_id: bill.id, item_id: item.item_id, quantity: item.quantity, unit_price: item.unit_price, total_price: item.total_price })));
      if (itemsError) throw itemsError;

      toast.success(t('billUpdated'));
      onOpenChange(false);
      onBillUpdated();
    } catch (error) { 
      console.error('Update error:', error);
      toast.error(t('failedToUpdateBill')); 
    } finally { setLoading(false); }
  };

  const { subtotal, tax_amount, total_amount } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden border-4 border-black rounded-none shadow-[10px_10px_0px_0px_#000] bg-[hsl(var(--comic-beige))] flex flex-col max-h-[90vh]">
        <div className="bg-[hsl(var(--comic-green))] p-4 border-b-4 border-black">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-black text-black uppercase italic comic-text-stroke leading-none">
                  {t('editBill')}
                </DialogTitle>
                <DialogDescription className="text-black font-black uppercase tracking-widest text-[8px] mt-1 italic">
                  {t('invoiceNo')} #{bill.bill_number}
                </DialogDescription>
              </div>
              <button onClick={() => onOpenChange(false)} className="p-2 border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000] active:shadow-none transition-all">
                <X className="h-4 w-4 text-black" />
              </button>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 overflow-y-auto comic-scrollbar space-y-4">
          {/* Customer Selection */}
          <div className="comic-card bg-[hsl(var(--comic-beige))] p-3 space-y-2">
            <Label className="text-[10px] font-black text-black uppercase tracking-widest italic">{t('customer')} *</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="h-10 border-2 border-black rounded-none font-black text-xs focus:ring-0 shadow-[2px_2px_0px_0px_#000] bg-[hsl(var(--comic-beige))]">
                <SelectValue placeholder={t('selectCustomer')} />
              </SelectTrigger>
              <SelectContent className="border-2 border-black rounded-none">
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id} className="font-black text-xs uppercase">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Section */}
          <div className="comic-card bg-[hsl(var(--comic-beige))] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-black uppercase italic tracking-tighter leading-none">{t('billedItems')}</h3>
              <Button 
                onClick={addItem} 
                className="h-8 border-2 border-black bg-[hsl(var(--comic-cyan))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none transition-all px-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-black stroke-[3px]" /> 
                <span className="font-black text-[9px] uppercase text-black">{t('addItem')}</span>
              </Button>
            </div>

            <div className="space-y-2">
              {billItems.map((billItem, index) => (
                <div key={index} className="border-2 border-black p-2.5 bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000] flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Select value={billItem.item_id} onValueChange={(v) => updateBillItem(index, 'item_id', v)}>
                        <SelectTrigger className="h-8 border-2 border-black rounded-none font-black text-[10px] uppercase focus:ring-0">
                          <SelectValue placeholder={t('selectItem')} />
                        </SelectTrigger>
                        <SelectContent className="border-2 border-black rounded-none">
                          {items.map(item => (
                            <SelectItem key={item.id} value={item.id} className="font-black text-[10px] uppercase">{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button 
                      onClick={() => removeBillItem(index)}
                      className="h-8 w-8 border-2 border-black bg-[hsl(var(--comic-pink))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none flex items-center justify-center transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-black" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => updateBillItem(index, 'quantity', billItem.quantity - 1)}
                        className="h-7 w-7 border-2 border-black bg-[hsl(var(--comic-beige))] flex items-center justify-center active:scale-90 shadow-[1px_1px_0px_0px_#000]"
                      >
                        <Minus className="h-3 w-3 text-black" />
                      </button>
                      <Input
                        type="number" 
                        value={billItem.quantity}
                        onChange={(e) => updateBillItem(index, 'quantity', e.target.value)}
                        className="h-7 w-10 text-center text-[10px] font-black border-2 border-black rounded-none p-0 focus-visible:ring-0"
                      />
                      <button 
                        onClick={() => updateBillItem(index, 'quantity', billItem.quantity + 1)}
                        className="h-7 w-7 border-2 border-black bg-[hsl(var(--comic-beige))] flex items-center justify-center active:scale-90 shadow-[1px_1px_0px_0px_#000]"
                      >
                        <Plus className="h-3 w-3 text-black" />
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <span className="text-[10px] font-black text-black/40">₹</span>
                      <Input
                        type="number" 
                        value={billItem.unit_price}
                        onChange={(e) => updateBillItem(index, 'unit_price', e.target.value)}
                        className="h-7 w-16 text-right text-[10px] font-black border-2 border-black rounded-none p-1 focus-visible:ring-0"
                      />
                    </div>
                    <div className="min-w-[60px] text-right">
                      <span className="text-xs font-black font-mono">₹{billItem.total_price.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {billItems.length === 0 && (
                <div className="text-center py-10 border-2 border-black border-dashed bg-black/5 opacity-40">
                  <Receipt className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase italic">{t('cartEmpty')}</p>
                </div>
              )}
            </div>
          </div>

        <div className="p-4 bg-[hsl(var(--comic-beige))] border-t-4 border-black space-y-3">
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black uppercase text-black/40">{t('subtotal')}</span>
              <span className="text-[10px] font-black font-mono">₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase text-black/40">{t('tax')}</span>
                <Input 
                  type="number" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-10 h-6 text-center text-[8px] font-black border-2 border-black bg-[hsl(var(--comic-beige))] rounded-none shadow-[1px_1px_0px_0px_#000] p-0" 
                />
                <span className="text-[8px] font-black text-black/40">%</span>
              </div>
              <span className="text-[10px] font-black font-mono">+₹{tax_amount.toFixed(0)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-black text-white p-3 italic">
            <span className="text-xs font-black uppercase tracking-widest">{t('total')}</span>
            <span className="text-xl font-black font-mono">₹{total_amount.toFixed(0)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-12 border-2 border-black rounded-none font-black text-[10px] uppercase active:translate-y-0.5 transition-all"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpdateBill}
              disabled={loading || billItems.length === 0}
              className="h-12 border-2 border-black rounded-none font-black text-[10px] uppercase bg-[hsl(var(--comic-green))] shadow-[3px_3px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              {loading ? t('updating') : t('updateBill')}
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillEdit;
