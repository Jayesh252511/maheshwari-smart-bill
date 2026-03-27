import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, DollarSign, Receipt, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bill } from '@/types/bill';

interface ReportData {
  totalRevenue: number;
  totalBills: number;
  totalItems: number;
  averageBillValue: number;
  topCustomers: Array<{ name: string; totalAmount: number; billCount: number }>;
  revenueByPeriod: Array<{ period: string; revenue: number; bills: number }>;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const { user } = useAuth();

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (user && dateFrom && dateTo) {
      generateReport();
    }
  }, [user, dateFrom, dateTo, reportType]);

  const generateReport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select date range');
      return;
    }

    setLoading(true);
    try {
      // Fetch bills with customer and item details
      const { data: billsData, error } = await supabase
        .from('bills')
        .select(`
          *,
          customers (name, phone),
          bill_items (
            *,
            items (name, unit)
          )
        `)
        .eq('user_id', user?.id)
        .gte('created_at', dateFrom + 'T00:00:00.000Z')
        .lte('created_at', dateTo + 'T23:59:59.999Z')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bills: Bill[] = billsData?.map(bill => ({
        id: bill.id,
        bill_number: bill.bill_number,
        customer_id: bill.customer_id,
        customer_name: bill.customers?.name || 'Unknown Customer',
        customer_phone: bill.customers?.phone,
        items: bill.bill_items?.map((bi: any) => ({
          id: bi.id,
          item_id: bi.item_id,
          item_name: bi.items?.name || 'Unknown Item',
          quantity: bi.quantity,
          unit_price: Number(bi.unit_price),
          total_price: Number(bi.total_price),
          unit: bi.items?.unit || 'patti'
        })) || [],
        subtotal: Number(bill.subtotal),
        tax_amount: Number(bill.tax_amount),
        total_amount: Number(bill.total_amount),
        status: bill.status,
        created_at: bill.created_at
      })) || [];

      // Calculate report metrics
      const totalRevenue = bills.reduce((sum, bill) => sum + bill.total_amount, 0);
      const totalBills = bills.length;
      const totalItems = bills.reduce((sum, bill) => sum + bill.items.length, 0);
      const averageBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

      // Top customers
      const customerMap = new Map();
      bills.forEach(bill => {
        const existing = customerMap.get(bill.customer_name) || { name: bill.customer_name, totalAmount: 0, billCount: 0 };
        existing.totalAmount += bill.total_amount;
        existing.billCount += 1;
        customerMap.set(bill.customer_name, existing);
      });
      const topCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      // Revenue by period
      const revenueByPeriod = generatePeriodData(bills, reportType);

      setReportData({
        totalRevenue,
        totalBills,
        totalItems,
        averageBillValue,
        topCustomers,
        revenueByPeriod
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generatePeriodData = (bills: Bill[], type: string) => {
    const periodMap = new Map();
    
    bills.forEach(bill => {
      const date = new Date(bill.created_at);
      let period = '';
      
      switch (type) {
        case 'daily':
          period = date.toLocaleDateString();
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = `Week of ${weekStart.toLocaleDateString()}`;
          break;
        case 'monthly':
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          period = date.getFullYear().toString();
          break;
      }
      
      const existing = periodMap.get(period) || { period, revenue: 0, bills: 0 };
      existing.revenue += bill.total_amount;
      existing.bills += 1;
      periodMap.set(period, existing);
    });
    
    return Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  };

  const handleQuickDateRange = (days: number) => {
    const today = new Date();
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(startDate.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Reports & Analytics</h2>
        <p className="text-sm text-muted-foreground">View your business performance</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange(7)}>
              Last 7 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange(30)}>
              Last 30 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange(90)}>
              Last 3 months
            </Button>
            <Button onClick={generateReport}>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Data */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-semibold">{reportData.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bills</p>
                    <p className="text-lg font-semibold">{reportData.totalBills}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-lg font-semibold">{reportData.totalItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Bill Value</p>
                    <p className="text-lg font-semibold">{reportData.averageBillValue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.billCount} bills</p>
                    </div>
                    <p className="font-semibold">{customer.totalAmount.toFixed(2)}</p>
                  </div>
                ))}
                {reportData.topCustomers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No customer data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Period */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue by {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.revenueByPeriod.map((period, index) => (
                  <div key={period.period} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{period.period}</p>
                      <p className="text-sm text-muted-foreground">{period.bills} bills</p>
                    </div>
                    <p className="font-semibold">{period.revenue.toFixed(2)}</p>
                  </div>
                ))}
                {reportData.revenueByPeriod.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available for selected period</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;