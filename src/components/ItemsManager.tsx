import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, Search, ChevronRight } from 'lucide-react';
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
      const itemData = { 
        name: formData.name.trim(), 
        price: parseFloat(formData.price), 
        unit: formData.unit, 
        stock: 999, 
        user_id: user?.id 
      };
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
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 border-2 border-black bg-[hsl(var(--comic-beige))] animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-black uppercase italic comic-text-stroke leading-none">{t('items')}</h2>
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1 italic">{items.length} {t('totalItems')}</p>
        </div>
        <Button 
          onClick={() => { setEditingItem(null); setFormData({ name: '', price: '', unit: 'patti' }); setDialogOpen(true); }} 
          className="h-10 border-2 border-black bg-[hsl(var(--comic-pink))] shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <Plus className="h-4 w-4 mr-1 text-black stroke-[3px]" /> 
          <span className="font-black text-[10px] uppercase tracking-wider text-black">{t('add')}</span>
        </Button>
      </div>

      <div className="flex items-center gap-3 px-3 py-2 border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000]">
        <Search className="h-4 w-4 text-black/40" />
        <Input 
          placeholder={t('searchItems')} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-[10px] font-black placeholder:text-black/20 bg-transparent" 
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="border-2 border-black border-dashed bg-black/5 p-12 text-center">
          <Package className="h-10 w-10 text-black/10 mx-auto mb-3" />
          <p className="text-[10px] font-black text-black/30 uppercase italic">{t('noItemsFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredItems.map((item) => (
            <div key={item.id} className="border-2 border-black p-3 bg-[hsl(var(--comic-beige))] shadow-[2px_2px_0px_0px_#000] relative overflow-hidden flex items-center justify-between group">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black text-black uppercase italic comic-text-stroke leading-none truncate pr-2">{item.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black font-mono">₹{item.price.toFixed(0)}</span>
                  <span className="text-[8px] font-black text-black/40 uppercase tracking-widest italic bg-black/5 px-1.5 py-0.5 border-2 border-black border-dotted">/{item.unit}</span>
                </div>
              </div>
              <div className="flex gap-1.5 ml-2">
                <button onClick={() => handleEdit(item)} className="h-8 w-8 border-2 border-black bg-[hsl(var(--comic-yellow))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
                  <Edit className="h-3.5 w-3.5 text-black" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="h-8 w-8 border-2 border-black bg-[hsl(var(--comic-pink))] shadow-[1.5px_1.5px_0px_0px_#000] active:shadow-none transition-all flex items-center justify-center">
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
              {editingItem ? t('editItem') : t('addItem')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[hsl(var(--comic-beige))]">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-black/40 tracking-widest">{t('itemName')}</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
                placeholder={t('itemName')} 
                required 
                className="h-12 border-2 border-black rounded-none font-black text-xs shadow-[2px_2px_0px_0px_#000] focus-visible:ring-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-black/40 tracking-widest">{t('price')}</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.price} 
                  onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} 
                  placeholder="0.00" 
                  required
                  className="h-12 border-2 border-black rounded-none font-black text-xs shadow-[2px_2px_0px_0px_#000] focus-visible:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-black/40 tracking-widest">{t('unit')}</Label>
                <select 
                  value={formData.unit} 
                  onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}
                  className="w-full h-12 border-2 border-black bg-[hsl(var(--comic-beige))] rounded-none font-black text-xs shadow-[2px_2px_0px_0px_#000] focus:ring-0 px-3 outline-none"
                >
                  <option value="patti">{t('patti')}</option>
                  <option value="box">{t('box')}</option>
                  <option value="kg">{t('kg')}</option>
                  <option value="piece">{t('piece')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1 h-12 border-2 border-black bg-[hsl(var(--comic-green))] text-black font-black uppercase text-xs italic tracking-widest shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {editingItem ? t('update') : t('save')}
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

export default ItemsManager;
