CREATE OR REPLACE FUNCTION public.save_bill_with_items(p_customer_id uuid, p_items jsonb, p_tax_rate numeric DEFAULT 0, p_bill_id uuid DEFAULT NULL)
RETURNS public.bills
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_customer uuid := p_customer_id;
  v_bill public.bills;
  v_subtotal numeric;
  v_tax numeric;
  v_number text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to save a bill'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Add at least one item';
  END IF;
  IF p_tax_rate IS NULL OR p_tax_rate < 0 OR p_tax_rate > 100 THEN RAISE EXCEPTION 'Invalid tax rate'; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_to_recordset(p_items) AS x(item_id uuid, quantity numeric, unit_price numeric)
    WHERE x.item_id IS NULL OR x.quantity IS NULL OR x.quantity <= 0 OR x.quantity <> trunc(x.quantity)
      OR x.unit_price IS NULL OR x.unit_price < 0
      OR NOT EXISTS (SELECT 1 FROM public.items i WHERE i.id = x.item_id AND i.user_id = v_user)
  ) THEN RAISE EXCEPTION 'Invalid item, quantity, or price'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  IF p_bill_id IS NOT NULL THEN
    SELECT * INTO v_bill FROM public.bills WHERE id = p_bill_id AND user_id = v_user FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found or access denied'; END IF;
  END IF;
  IF v_customer IS NULL THEN
    SELECT id INTO v_customer FROM public.customers WHERE user_id = v_user AND name = 'Cash' ORDER BY created_at LIMIT 1;
    IF v_customer IS NULL THEN
      INSERT INTO public.customers(user_id, name) VALUES(v_user, 'Cash') RETURNING id INTO v_customer;
    END IF;
  ELSIF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = v_customer AND user_id = v_user) THEN
    RAISE EXCEPTION 'Customer not found or access denied';
  END IF;
  SELECT round(sum(x.quantity * x.unit_price), 2) INTO v_subtotal
    FROM jsonb_to_recordset(p_items) AS x(item_id uuid, quantity numeric, unit_price numeric);
  v_tax := round(v_subtotal * p_tax_rate / 100, 2);
  IF p_bill_id IS NULL THEN
    SELECT (COALESCE(max(CASE WHEN bill_number ~ '^[0-9]+$' THEN bill_number::numeric END), 0) + 1)::text
      INTO v_number FROM public.bills WHERE user_id = v_user;
    INSERT INTO public.bills(user_id, customer_id, bill_number, subtotal, tax_amount, total_amount, status)
      VALUES(v_user, v_customer, v_number, v_subtotal, v_tax, v_subtotal + v_tax, 'completed') RETURNING * INTO v_bill;
  ELSE
    UPDATE public.bills SET customer_id = v_customer, subtotal = v_subtotal, tax_amount = v_tax,
      total_amount = v_subtotal + v_tax, updated_at = now()
      WHERE id = p_bill_id AND user_id = v_user RETURNING * INTO v_bill;
    DELETE FROM public.bill_items WHERE bill_id = p_bill_id;
  END IF;
  INSERT INTO public.bill_items(bill_id, item_id, quantity, unit_price, total_price)
    SELECT v_bill.id, x.item_id, x.quantity::integer, x.unit_price, round(x.quantity * x.unit_price, 2)
    FROM jsonb_to_recordset(p_items) AS x(item_id uuid, quantity numeric, unit_price numeric);
  RETURN v_bill;
END;
$$;
REVOKE ALL ON FUNCTION public.save_bill_with_items(uuid, jsonb, numeric, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_bill_with_items(uuid, jsonb, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_bill_with_items(uuid, jsonb, numeric, uuid) TO service_role;