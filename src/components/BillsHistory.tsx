import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Download, Share, Receipt, Calendar, User, DollarSign, Edit, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { downloadPDF, sharePDF } from '@/utils/pdfGenerator';
import { Bill } from '@/types/bill';
import { useLocalization } from '@/contexts/LocalizationContext';
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
    if (user) {
      fetchBills();
    }
  }, [user]);

  const fetchBills = async () => {
    try {
      // Fetch bills with customer details and bill items
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select(`
          *,
          customers (name, phone, address),
          bill_items (
            *,
            items (name, unit)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (billsError) throw billsError;

      // Transform data to match Bill interface
      const transformedBills: Bill[] = billsData?.map(bill => ({
        id: bill.id,
        bill_number: bill.bill_number,
        customer_id: bill.customer_id,
        customer_name: bill.customers?.name || 'Unknown Customer',
        customer_phone: bill.customers?.phone,
        customer_address: bill.customers?.address,
        items: bill.bill_items?.map((bi: any) => ({
          id: bi.id,
          item_id: bi.item_id,
          item_name: bi.items?.name || 'Unknown Item',
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

      setBills(transformedBills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (bill: Bill) => {
    setSelectedBill(bill);
    setDetailsOpen(true);
  };

  const handleDownloadPDF = async (bill: Bill) => {
    try {
      const businessInfo = {
        name: 'Maheshwari Agency',
        address: 'matakari galli shegaon',
        phone: '7020709696'
      };

      await downloadPDF(bill, businessInfo);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleSharePDF = async (bill: Bill) => {
    try {
      const businessInfo = {
        name: 'Maheshwari Agency',
        address: 'matakari galli shegaon',
        phone: '7020709696'
      };

      await sharePDF(bill, businessInfo);
      toast.success('PDF shared successfully!');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share PDF');
    }
  };

  const handlePrintBill = async (bill: Bill) => {
    try {
      const businessInfo = {
        name: 'Maheshwari Agency',
        address: 'matakari galli shegaon',
        phone: '7020709696'
      };

      const { bluetoothPrinter } = await import('@/utils/bluetoothPrinter');
      
      if (!bluetoothPrinter.isConnected()) {
        const devices = await bluetoothPrinter.scanForPrinters();
        if (devices.length > 0) {
          await bluetoothPrinter.connectToPrinter(devices[0]);
        }
      }

      await bluetoothPrinter.printReceipt(bill, businessInfo, t);
      toast.success('Bill printed successfully!');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print bill');
    }
  };

  const handleEditBill = (bill: Bill) => {
    setEditBill(bill);
    setEditOpen(true);
  };

  const getTotalRevenue = () => {
    return bills.reduce((sum, bill) => sum + bill.total_amount, 0);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t('bills')} & Reports</h2>
          <p className="text-sm text-muted-foreground">View and manage your billing history</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total {t('bills')}</p>
                  <p className="text-lg font-semibold text-foreground">{bills.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-semibold text-foreground">{getTotalRevenue().toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${t('bills').toLowerCase()} by number or customer name...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {bills.length === 0 ? `No ${t('bills').toLowerCase()} yet` : `No ${t('bills').toLowerCase()} found`}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {bills.length === 0 
                ? `Create your first ${t('bills').toLowerCase()} to see it here`
                : 'Try adjusting your search terms'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => (
            <Card key={bill.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-foreground">{bill.bill_number}</h3>
                      <Badge variant="secondary">{bill.status}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{bill.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(bill.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4" />
                        <span>{bill.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(bill)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBill(bill)}
                      title="Edit Bill"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintBill(bill)}
                      title="Print Bill"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(bill)}
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {navigator.share && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSharePDF(bill)}
                        title="Share PDF"
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bill Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('bills')} Details</DialogTitle>
            <DialogDescription>
              {selectedBill?.bill_number}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div>
                <h4 className="font-medium mb-2">{t('customers')} Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedBill.customer_name}</p>
                  {selectedBill.customer_phone && (
                    <p><strong>{t('phone')}:</strong> {selectedBill.customer_phone}</p>
                  )}
                  {selectedBill.customer_address && (
                    <p><strong>{t('address')}:</strong> {selectedBill.customer_address}</p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">{t('items')}</h4>
                <div className="space-y-2">
                  {selectedBill.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity} {item.unit} × {item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">{item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>{t('items')}:</span>
                  <span>{selectedBill.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('subtotal')}:</span>
                  <span>{selectedBill.subtotal.toFixed(2)}</span>
                </div>
                {selectedBill.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{selectedBill.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>{t('total')}:</span>
                  <span>{selectedBill.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  onClick={() => handlePrintBill(selectedBill)} 
                  className="w-full"
                  variant="outline"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Bill
                </Button>
                <Button 
                  onClick={() => handleDownloadPDF(selectedBill)} 
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {navigator.share && (
                  <Button 
                    onClick={() => handleSharePDF(selectedBill)} 
                    className="w-full"
                    variant="outline"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share PDF
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Edit Dialog */}
      {editBill && (
        <BillEdit
          bill={editBill}
          open={editOpen}
          onOpenChange={setEditOpen}
          onBillUpdated={() => {
            fetchBills();
            setEditBill(null);
          }}
        />
      )}
    </div>
  );
};

export default BillsHistory;