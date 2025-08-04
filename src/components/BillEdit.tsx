import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Minus, Plus, Save, X } from 'lucide-react';
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

  useEffect(() => {
    if (open && user) {
      fetchCustomers();
      fetchItems();
    }
  }, [open, user]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    }
  };

  const addItem = () => {
    const newItem: BillItem = {
      id: `temp_${Date.now()}`,
      item_id: '',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      unit: 'patti'
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
      item.quantity = Math.max(1, parseInt(value) || 1);
      item.total_price = item.quantity * item.unit_price;
    } else {
      (item as any)[field] = value;
    }
    
    setBillItems(updatedItems);
  };

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax_amount = 0; // No tax as per requirement
    const total_amount = subtotal + tax_amount;
    
    return { subtotal, tax_amount, total_amount };
  };

  const handleUpdateBill = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (billItems.length === 0 || billItems.some(item => !item.item_id)) {
      toast.error('Please add at least one valid item');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, tax_amount, total_amount } = calculateTotals();
      
      // Update bill
      const { error: billError } = await supabase
        .from('bills')
        .update({
          customer_id: selectedCustomer,
          subtotal,
          tax_amount,
          total_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', bill.id);

      if (billError) throw billError;

      // Delete existing bill items
      const { error: deleteError } = await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', bill.id);

      if (deleteError) throw deleteError;

      // Insert updated bill items
      const billItemsData = billItems.map(item => ({
        bill_id: bill.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItemsData);

      if (itemsError) throw itemsError;

      toast.success('Bill updated successfully!');
      onOpenChange(false);
      onBillUpdated();
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error('Failed to update bill');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, total_amount } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('edit')} {t('bills')} - {bill.bill_number}</DialogTitle>
          <DialogDescription>
            Update bill details and items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Selection */}
          <div>
            <Label htmlFor="customer">{t('customers')}</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${t('customers').toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('items')}</CardTitle>
                <Button onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add')} {t('items')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {billItems.map((billItem, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                  <div className="col-span-4">
                    <Label>{t('items')}</Label>
                    <Select
                      value={billItem.item_id}
                      onValueChange={(value) => updateBillItem(index, 'item_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${t('items').toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.price}/{item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Quantity</Label>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateBillItem(index, 'quantity', billItem.quantity - 1)}
                        disabled={billItem.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={billItem.quantity}
                        onChange={(e) => updateBillItem(index, 'quantity', e.target.value)}
                        className="mx-1 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateBillItem(index, 'quantity', billItem.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Label>{t('unit')}</Label>
                    <Input value={billItem.unit} disabled />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>{t('price')}</Label>
                    <Input value={billItem.unit_price.toFixed(2)} disabled />
                  </div>
                  
                  <div className="col-span-1">
                    <Label>{t('total')}</Label>
                    <Input value={billItem.total_price.toFixed(2)} disabled />
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeBillItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {billItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No items added yet. Click "Add Item" to start.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items: {billItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('subtotal')}:</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('total')}:</span>
                  <span>{total_amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleUpdateBill} disabled={loading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Updating...' : `${t('save')} ${t('bills')}`}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillEdit;