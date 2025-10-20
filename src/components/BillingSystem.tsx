import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Minus, Trash2, Receipt, Download, Share, Bluetooth, ShoppingCart } from 'lucide-react';
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
    if (user) {
      fetchData();
      checkPrinterConnection();
    }
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
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const checkPrinterConnection = () => {
    setPrinterConnected(bluetoothPrinter.isConnected());
  };

  const addItemToBill = () => {
    if (!selectedItem || !quantity) {
      toast.error('Please select an item and enter quantity');
      return;
    }

    const item = items.find(i => i.id === selectedItem);
    if (!item) return;

    const qty = parseInt(quantity);
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    // Stock check removed as per user request

    const existingItemIndex = billItems.findIndex(bi => bi.item_id === selectedItem);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...billItems];
      const newQty = updatedItems[existingItemIndex].quantity + qty;
      
      // Stock check removed as per user request
      
      updatedItems[existingItemIndex].quantity = newQty;
      updatedItems[existingItemIndex].total_price = newQty * item.price;
      setBillItems(updatedItems);
    } else {
      const billItem: BillItem = {
        id: Date.now().toString(),
        item_id: selectedItem,
        item_name: item.name,
        quantity: qty,
        unit_price: item.price,
        total_price: qty * item.price,
        unit: item.unit
      };
      setBillItems([...billItems, billItem]);
    }

    setSelectedItem('');
    setQuantity('1');
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromBill(itemId);
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Stock check removed as per user request

    setBillItems(prev => prev.map(bi => 
      bi.item_id === itemId 
        ? { ...bi, quantity: newQuantity, total_price: newQuantity * bi.unit_price }
        : bi
    ));
  };

  const removeItemFromBill = (itemId: string) => {
    setBillItems(prev => prev.filter(bi => bi.item_id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = subtotal * (parseFloat(taxRate) / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const generateBillNumber = async () => {
    // Get the count of existing bills for this user to generate sequential bill numbers
    const { data, error } = await supabase
      .from('bills')
      .select('id', { count: 'exact' })
      .eq('user_id', user?.id);
    
    if (error) {
      console.error('Error getting bill count:', error);
      return `01`; // fallback to 01
    }
    
    const billCount = (data?.length || 0) + 1;
    return billCount.toString().padStart(2, '0');
  };

  const saveBill = async (): Promise<Bill | null> => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return null;
    }

    if (billItems.length === 0) {
      toast.error('Please add at least one item');
      return null;
    }

    setSaving(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (!customer) throw new Error('Customer not found');

      const { subtotal, taxAmount, total } = calculateTotals();
      const billNumber = await generateBillNumber();

      // Create bill
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert([{
          user_id: user?.id,
          customer_id: selectedCustomer,
          bill_number: billNumber,
          subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          status: 'completed'
        }])
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items
      const billItemsData = billItems.map(item => ({
        bill_id: billData.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItemsData);

      if (itemsError) throw itemsError;

      // Stock update removed as per user request

      const bill: Bill = {
        id: billData.id,
        bill_number: billNumber,
        customer_id: selectedCustomer,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        items: billItems,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        status: 'completed',
        created_at: billData.created_at
      };

      toast.success('Bill saved successfully!');
      return bill;
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    const bill = await saveBill();
    if (bill) {
      setCurrentBill(bill);
      setPrintDialogOpen(true);
    }
  };

  const handlePrint = async () => {
    if (!currentBill) return;

    try {
      if (!bluetoothPrinter.isConnected()) {
        const devices = await bluetoothPrinter.scanForPrinters();
        if (devices.length > 0) {
          await bluetoothPrinter.connectToPrinter(devices[0]);
          setPrinterConnected(true);
        }
      }

      const businessInfo = {
        name: 'Maheshwari Agency',
        address: 'matakari galli shegaon',
        phone: '9970041700'
      };

      await bluetoothPrinter.printReceipt(currentBill, businessInfo, t);
      toast.success('Receipt printed successfully!');
      resetBill();
      setPrintDialogOpen(false);
    } catch (error) {
      console.error('Print error:', error);
      toast.error(`Print failed: ${error}`);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentBill) return;

    try {
      const businessInfo = {
        name: 'Maheshwari Agency',
        address: 'matakari galli shegaon',
        phone: '9970041700'
      };

      await downloadPDF(currentBill, businessInfo, undefined, t);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleSharePDF = async () => {
    if (!currentBill) return;

    try {
      const businessInfo = {
        name: 'Maheshwari Agency',
        address: 'matakari galli shegaon',
        phone: '9970041700'
      };

      await sharePDF(currentBill, businessInfo, t);
      toast.success('PDF shared successfully!');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share PDF');
    }
  };

  const resetBill = () => {
    setSelectedCustomer('');
    setBillItems([]);
    setSelectedItem('');
    setQuantity('1');
    setTaxRate('0');
    setCurrentBill(null);
    fetchData(); // Refresh data to update stock
  };

  const handleVoiceAddItems = useCallback((voiceItems: { name: string; quantity: number }[]) => {
    voiceItems.forEach(voiceItem => {
      // Find matching item (case-insensitive)
      const matchingItem = items.find(item => 
        item.name.toLowerCase().includes(voiceItem.name.toLowerCase()) ||
        voiceItem.name.toLowerCase().includes(item.name.toLowerCase())
      );
      
      if (matchingItem) {
        setSelectedItem(matchingItem.id);
        setQuantity(voiceItem.quantity.toString());
        
        // Simulate click to add item
        setTimeout(() => {
          const qty = voiceItem.quantity;
          if (qty <= 0) return;

          const existingItemIndex = billItems.findIndex(bi => bi.item_id === matchingItem.id);
          
          if (existingItemIndex >= 0) {
            const updatedItems = [...billItems];
            const newQty = updatedItems[existingItemIndex].quantity + qty;
            updatedItems[existingItemIndex].quantity = newQty;
            updatedItems[existingItemIndex].total_price = newQty * matchingItem.price;
            setBillItems(updatedItems);
          } else {
            const billItem: BillItem = {
              id: Date.now().toString() + Math.random(),
              item_id: matchingItem.id,
              item_name: matchingItem.name,
              quantity: qty,
              unit_price: matchingItem.price,
              total_price: qty * matchingItem.price,
              unit: matchingItem.unit
            };
            setBillItems(prev => [...prev, billItem]);
          }
          
          setSelectedItem('');
          setQuantity('1');
        }, 100);
      }
    });
  }, [items, billItems]);

  const handleVoiceSelectCustomer = useCallback((customerName: string) => {
    const matchingCustomer = customers.find(customer =>
      customer.name.toLowerCase().includes(customerName.toLowerCase()) ||
      customerName.toLowerCase().includes(customer.name.toLowerCase())
    );
    
    if (matchingCustomer) {
      setSelectedCustomer(matchingCustomer.id);
      toast.success(`Selected customer: ${matchingCustomer.name}`);
    }
  }, [customers]);

  const { subtotal, taxAmount, total } = calculateTotals();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-muted rounded mb-4"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Create Bill</h2>
          <p className="text-sm text-muted-foreground">Generate invoices and receipts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            printerConnected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
          }`}>
            <Bluetooth className="h-3 w-3" />
            {printerConnected ? 'Connected' : 'Not Connected'}
          </div>
        </div>
      </div>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone && ` • ${customer.phone}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Add Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.price}/{item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addItemToBill} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill Items */}
      {billItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bill Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {billItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.item_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          setBillItems(prev => prev.map(bi => 
                            bi.item_id === item.item_id 
                              ? { ...bi, unit_price: newPrice, total_price: newPrice * bi.quantity }
                              : bi
                          ));
                        }}
                        className="w-24 h-8 text-sm"
                        step="0.01"
                        min="0"
                      />
                      <span className="text-xs text-muted-foreground">per unit</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateItemQuantity(item.item_id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateItemQuantity(item.item_id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <div className="w-20 text-right font-medium">
                      {item.total_price.toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemFromBill(item.item_id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totals */}
      {billItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <span>Items Count:</span>
                <span>{billItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={resetBill} variant="outline" className="flex-1">
                Clear Bill
              </Button>
              <Button 
                onClick={handleCheckout} 
                disabled={saving || billItems.length === 0}
                className="flex-1"
              >
                <Receipt className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Checkout'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bill Created Successfully!</DialogTitle>
            <DialogDescription>
              Choose how you want to share the bill with your customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button onClick={handlePrint} className="w-full" size="mobile">
              <Bluetooth className="h-4 w-4 mr-2" />
              Print Receipt (Bluetooth)
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="w-full" size="mobile">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {navigator.share && (
              <Button onClick={handleSharePDF} variant="outline" className="w-full" size="mobile">
                <Share className="h-4 w-4 mr-2" />
                Share PDF
              </Button>
            )}
            <Button 
              onClick={() => {
                resetBill();
                setPrintDialogOpen(false);
              }} 
              variant="secondary" 
              className="w-full"
            >
              Create Another Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {billItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No items added</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Select a customer and start adding items to create a bill
            </p>
          </CardContent>
        </Card>
      )}
      </div>

      {/* AI Voice Assistant Sidebar */}
      <div className="space-y-6">
        <AIVoiceAssistant 
          onAddItems={handleVoiceAddItems}
          onSelectCustomer={handleVoiceSelectCustomer}
          availableItems={items.map(item => ({ id: item.id, name: item.name, price: item.price }))}
        />
      </div>
    </div>
  );
};

export default BillingSystem;