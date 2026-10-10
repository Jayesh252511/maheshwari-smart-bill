import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Trash2, Edit } from 'lucide-react';
import { Bill } from '@/types/bill';
import { useLocalization } from '@/contexts/LocalizationContext';

interface BillDetailsProps {
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
}

export default function BillDetails({ bill, open, onOpenChange, onEdit, onDelete }: BillDetailsProps) {
  const { t } = useLocalization();
  const formatDate = (value: string) => new Date(value).toLocaleDateString();
  return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto border-4 border-black rounded-none shadow-[10px_10px_0px_0px_#000]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic comic-text-stroke tracking-tighter">{t('saleTitle')}</DialogTitle>
              <DialogDescription className="font-black uppercase tracking-widest text-[9px] text-black/40 italic">{t('invoiceNo')} #{bill?.bill_number}</DialogDescription>
            </DialogHeader>
            {bill && (
              <div className="space-y-6 pt-4">
                <div className="flex justify-between items-end border-b-2 border-black border-dotted pb-4">
                  <div>
                    <p className="text-[8px] font-black uppercase text-black/30 mb-1">{t('customer')}</p>
                    <p className="text-sm font-black text-black uppercase italic">{bill.customer_name}</p>
                    <p className="text-[9px] font-black text-black/50 font-mono mt-1">{bill.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-black/30 mb-1">{t('date')}</p>
                    <p className="text-xs font-black text-black font-mono">{formatDate(bill.created_at)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('billedItems')}</span>
                  </div>
                  {bill.items.map((item, index) => (
                    <div key={index} className="border-2 border-black p-3 bg-[hsl(var(--comic-yellow))] shadow-[2px_2px_0px_0px_#000]">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase italic truncate pr-2">{item.item_name}</p>
                          <p className="text-[8px] font-black text-black/40 uppercase mt-1">
                            {item.quantity} x ₹{item.unit_price}
                          </p>
                        </div>
                        <p className="text-xs font-black text-black font-mono italic">₹{item.total_price.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t-4 border-black space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black/50">
                    <span>{t('subtotal')}</span>
                    <span className="font-mono">₹{bill.subtotal.toFixed(2)}</span>
                  </div>
                  {bill.tax_amount > 0 && (
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black/50">
                      <span>{t('tax')}</span>
                      <span className="font-mono">₹{bill.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-black text-white p-4 italic mt-4">
                    <span className="text-sm font-black uppercase tracking-widest">{t('total')}</span>
                    <span className="text-2xl font-black font-mono">₹{bill.total_amount.toFixed(0)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button variant="ghost" onClick={() => onDelete(bill.id)} className="border-2 border-black rounded-none text-destructive font-black uppercase text-[10px] italic shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all">
                    <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                  </Button>
                  <Button onClick={() => { onOpenChange(false); onEdit(bill); }} className="border-2 border-black bg-[hsl(var(--comic-pink))] text-black font-black uppercase text-[10px] italic shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all">
                    <Edit className="h-4 w-4 mr-2" /> {t('edit')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

  );
}
