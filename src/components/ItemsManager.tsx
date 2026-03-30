import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { toast } from 'sonner';

interface Item {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
}

const ItemsManager: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', price: '', unit: 'patti' });
  const { user } = useAuth();
  const { t } = useLocalization();

  useEffect(() => { if (user) fetchItems(); }, [user]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase.from('items').select('*').eq('user_id', user?.id).order('name');
      if (error) throw error;
      setItems(data || []);
    } catch { toast.error(t('failedToLoadItems')); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = { name: formData.name.trim(), price: parseFloat(formData.price), unit: formData.unit, stock: 999, user_id: user?.id };
      if (editingItem) {
        const { error } = await supabase.from('items').update(itemData).eq('id', editingItem.id);
        if (error) throw error;
        toast.success(t('itemUpdated'));
      } else {
        const { error } = await supabase.from('items').insert([itemData]);
        if (error) throw error;
        toast.success(t('itemAdded'));
      }
      setDialogOpen(false); setEditingItem(null);
      setFormData({ name: '', price: '', unit: 'patti' }); fetchItems();
    } catch { toast.error(t('failedToSaveItem')); }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({ name: item.name, price: item.price.toString(), unit: item.unit });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteThisItem'))) return;
    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('itemDeleted')); fetchItems();
    } catch { toast.error(t('failedToDeleteItem')); }
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('items')}</h2>
          <p className="text-xs text-muted-foreground">{items.length} {t('items').toLowerCase()}</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormData({ name: '', price: '', unit: 'patti' }); setDialogOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {t('addItem')}
        </Button>
      </div>

      {/* Search */}
      <div className="section-card flex items-center gap-3 px-4 py-3">
        <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <Input placeholder={t('searchItems')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-0 text-sm" />
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="section-card flex flex-col items-center justify-center py-12">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">{t('noItems')}</p>
          <p className="text-xs text-muted-foreground mb-3">{t('addYourFirstItem')}</p>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> {t('addItem')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div key={item.id} className="section-card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} / {item.unit === 'patti' ? t('patti') : item.unit === 'box' ? t('box') : item.unit}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(item)} className="p-2 text-muted-foreground hover:text-primary">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('editItem') : t('addNewItem')}</DialogTitle>
            <DialogDescription>{editingItem ? t('updateItemDetails') : t('enterItemDetails')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('itemName')}</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder={t('enterItemName')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('ratePerUnit')}</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <Label>{t('unit')}</Label>
                <select value={formData.unit} onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="patti">{t('patti')}</option>
                  <option value="box">{t('box')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{editingItem ? t('update') : t('addItem')}</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemsManager;
