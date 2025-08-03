export interface BillItem {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  items: BillItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
}