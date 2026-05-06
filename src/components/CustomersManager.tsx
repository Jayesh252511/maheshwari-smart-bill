import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, Phone, MapPin, Search, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { toast } from 'sonner';

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
      const customerData = { 
        name: formData.name.trim(), 
        phone: formData.phone.trim() || null, 
        address: formData.address.trim() || null, 
        user_id: user?.id 
      };
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
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 border-2 border-black bg-[hsl(var(--comic-beige))] animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-black uppercase italic comic-text-stroke leading-none">{t('customers')}</h2>
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1 italic">{customers.length} {t('totalCustomers')}</p>
        </div>
        <Button 
          onClick={() => { setEditingCustomer(null); setFormData({ name: '', phone: '', address: '' }); setDialogOpen(true); }} 
          className="h-10 border-2 border-black bg-[hsl(var(--comic-cyan))] shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <Plus className="h-4 w-4 mr-1 text-black stroke-[3px]" /> 
          <span className="font-black text-[10px] uppercase tracking-wider text-black">{t('add')}</span>
        </Button>
      </div>

      <div className="flex items-center gap-3 px-3 py-2 border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000]">
        <Search className="h-4 w-4 text-black/40" />
        <Input 
          placeholder={t('searchCustomers')} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-[10px] font-black placeholder:text-black/20 bg-transparent" 
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="border-2 border-black border-dashed bg-black/5 p-12 text-center">
          <Users className="h-10 w-10 text-black/10 mx-auto mb-3" />
          <p className="text-[10px] font-black text-black/30 uppercase italic">{t('noCustomersFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="border-2 border-black p-3 bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000] relative overflow-hidden flex items-center justify-between group">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black text-black uppercase italic comic-text-stroke leading-none truncate pr-2">{customer.name}</h3>
                <div className="flex flex-wrap gap-3 mt-2">
                  {customer.phone && (
                    <span className="flex items-center gap-1 text-[8px] font-black text-black/40 uppercase tracking-widest italic">
                      <Phone className="h-2.5 w-2.5" /> {customer.phone}
                    </span>
                  )}
                  {customer.address && (
                    <span className="flex items-center gap-1 text-[8px] font-black text-black/40 uppercase tracking-widest italic truncate max-w-[150px]">
                      <MapPin className="h-2.5 w-2.5" /> {customer.address}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 ml-2">
                <button onClick={() => handleEdit(customer)} className="h-8 w-8 border-2 border-black bg-[hsl(var(--comic-yellow))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                  <Edit className="h-3.5 w-3.5 text-black" />
                </button>
                <button onClick={() => handleDelete(customer.id)} className="h-8 w-8 border-2 border-black bg-[hsl(var(--comic-pink))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                  <Trash2 className="h-3.5 w-3.5 text-black" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md border-4 border-black rounded-none shadow-[8px_8px_0px_0px_#000] p-0 overflow-hidden">
          <DialogHeader className="bg-black text-white p-4 italic">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter italic leading-none">
              {editingCustomer ? t('editCustomer') : t('addCustomer')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[hsl(var(--comic-beige))]">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-black/40 tracking-widest">{t('customerName')}</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
                placeholder={t('customerName')} 
                required 
                className="h-12 border-2 border-black rounded-none font-black text-xs shadow-[2px_2px_0px_0px_#000] focus-visible:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-black/40 tracking-widest">{t('phoneNumber')}</Label>
              <Input 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} 
                placeholder={t('phoneNumber')} 
                className="h-12 border-2 border-black rounded-none font-black text-xs shadow-[2px_2px_0px_0px_#000] focus-visible:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-black/40 tracking-widest">{t('address')}</Label>
              <Textarea 
                value={formData.address} 
                onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} 
                placeholder={t('address')} 
                rows={2} 
                className="border-2 border-black rounded-none font-black text-xs shadow-[2px_2px_0px_0px_#000] focus-visible:ring-0 resize-none min-h-[80px]"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1 h-12 border-2 border-black bg-[hsl(var(--comic-green))] text-black font-black uppercase text-xs italic tracking-widest shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {editingCustomer ? t('update') : t('save')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="flex-1 h-12 border-2 border-black bg-[hsl(var(--comic-beige))] text-black font-black uppercase text-xs italic tracking-widest shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersManager;
