-- Enable delete policy for bills
CREATE POLICY "Users can delete their own bills" 
ON public.bills 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable delete policy for bill_items
CREATE POLICY "Users can delete bill items for their bills" 
ON public.bill_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM bills 
  WHERE bills.id = bill_items.bill_id 
  AND bills.user_id = auth.uid()
));

-- Delete all existing bills and their items
DELETE FROM public.bill_items;
DELETE FROM public.bills;