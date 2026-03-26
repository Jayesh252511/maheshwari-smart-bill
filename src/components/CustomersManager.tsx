import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, Phone, MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLocalization } from '@/contexts/LocalizationContext';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

const CustomersManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const { user } = useAuth();
  const { t } = useLocalization();

  useEffect(() => { if (user) fetchCustomers(); }, [user]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      setCustomers(data || []);
    } catch { toast.error(t('failedToLoadCustomers')); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerData = { name: formData.name.trim(), phone: formData.phone.trim() || null, address: formData.address.trim() || null, user_id: user?.id };
      if (editingCustomer) {
        const { error } = await supabase.from('customers').update(customerData).eq('id', editingCustomer.id);
        if (error) throw error;
        toast.success(t('customerUpdated'));
      } else {
        const { error } = await supabase.from('customers').insert([customerData]);
        if (error) throw error;
        toast.success(t('customerAdded'));
      }
      setDialogOpen(false); setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '' }); fetchCustomers();
    } catch { toast.error(t('failedToSaveCustomer')); }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone || '', address: customer.address || '' });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteThisCustomer'))) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('customerDeleted')); fetchCustomers();
    } catch { toast.error(t('failedToDeleteCustomer')); }
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('customers')}</h2>
          <p className="text-xs text-muted-foreground">{customers.length} {t('nCustomers')}</p>
        </div>
        <Button onClick={() => { setEditingCustomer(null); setFormData({ name: '', phone: '', address: '' }); setDialogOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {t('add')}
        </Button>
      </div>

      <div className="section-card flex items-center gap-3 px-4 py-3">
        <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <Input placeholder={t('searchCustomers')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-0 text-sm" />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="section-card flex flex-col items-center justify-center py-12">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">{t('noCustomers')}</p>
          <p className="text-xs text-muted-foreground mb-3">{t('addYourFirstCustomer')}</p>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> {t('addCustomer')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="section-card p-4 flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground">{customer.name}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {customer.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {customer.phone}
                    </span>
                  )}
                  {customer.address && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {customer.address}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(customer)} className="p-2 text-muted-foreground hover:text-primary">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(customer.id)} className="p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? t('editCustomer') : t('addCustomer')}</DialogTitle>
            <DialogDescription>{editingCustomer ? t('updateDetails') : t('enterDetails')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('customerName')}</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder={t('enterCustomerName')} required />
            </div>
            <div className="space-y-2">
              <Label>{t('phoneNumber')}</Label>
              <Input type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder={t('enterPhoneNumber')} />
            </div>
            <div className="space-y-2">
              <Label>{t('address')}</Label>
              <Textarea value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} placeholder={t('enterAddress')} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{editingCustomer ? t('update') : t('addCustomer')}</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersManager;
