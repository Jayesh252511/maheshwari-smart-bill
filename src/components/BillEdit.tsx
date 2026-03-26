import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Minus, Plus, Save, X, Search } from 'lucide-react';
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
      id: `temp_${Date.now()}`, item_id: '', item_name: '', quantity: 0,
      unit_price: 0, total_price: 0, unit: 'patti'
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
    return { subtotal, tax_amount: 0, total_amount: subtotal };
  };

  const handleUpdateBill = async () => {
    if (!selectedCustomer) { toast.error(t('pleaseSelectCustomer')); return; }
    if (billItems.length === 0 || billItems.some(item => !item.item_id)) {
      toast.error(t('pleaseAddValidItem')); return;
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
    } catch { toast.error(t('failedToUpdateBill')); } finally { setLoading(false); }
  };

  const { subtotal, total_amount } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle>{t('editBills')} - {bill.bill_number}</DialogTitle>
          <DialogDescription className="text-xs">{t('updateBillDetails')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Customer */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Customers</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="h-11 mt-1">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="bg-card rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">Items</h3>
              <Button onClick={addItem} variant="outline" size="sm" className="h-8 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Items
              </Button>
            </div>

            {billItems.map((billItem, index) => (
              <div key={index} className="border border-border rounded-lg p-3 space-y-2">
                {/* Row 1: Item select + remove */}
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs font-bold text-foreground">Items</Label>
                    <Select value={billItem.item_id} onValueChange={(v) => updateBillItem(index, 'item_id', v)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <div className="relative mb-2">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              placeholder="Search..."
                              value={itemSearch}
                              onChange={(e) => setItemSearch(e.target.value)}
                              className="h-8 pl-7 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {filteredItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            <span className="font-bold">{item.name}</span>
                            <span className="text-muted-foreground ml-1">({item.price}/{item.unit})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-5">
                    <Button variant="destructive" size="icon" className="h-10 w-10" onClick={() => removeBillItem(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Row 2: Quantity, Unit, Price, Total */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Quantity</Label>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                        onClick={() => updateBillItem(index, 'quantity', billItem.quantity - 1)}
                        disabled={billItem.quantity <= 0}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number" value={billItem.quantity}
                        onChange={(e) => updateBillItem(index, 'quantity', e.target.value)}
                        className="h-8 text-center text-sm font-bold px-1 min-w-[40px]" min="0"
                      />
                      <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                        onClick={() => updateBillItem(index, 'quantity', billItem.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Unit</Label>
                    <Input value={billItem.unit} disabled className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Price</Label>
                    <Input
                      type="number" value={billItem.unit_price}
                      onChange={(e) => updateBillItem(index, 'unit_price', e.target.value)}
                      className="h-8 text-sm" min="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Total</Label>
                    <Input value={billItem.total_price.toFixed(0)} disabled className="h-8 text-sm font-bold" />
                  </div>
                </div>
              </div>
            ))}

            {billItems.length === 0 && (
              <p className="text-center py-6 text-sm text-muted-foreground">No items added yet.</p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-card rounded-lg border border-border p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items: {billItems.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total:</span>
              <span>₹{total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleUpdateBill} disabled={loading} className="flex-1 h-10">
              <Save className="h-4 w-4 mr-1" />
              {loading ? 'Updating...' : 'Save Bill'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillEdit;
