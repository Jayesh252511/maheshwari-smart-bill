// ESC/POS Commands for thermal printers
export class ESCPOSCommands {
  // Control characters
  static ESC = '\x1B';
  static GS = '\x1D';
  static LF = '\x0A';
  static FF = '\x0C';
  static CR = '\x0D';
  
  // Initialize printer
  static INIT = ESCPOSCommands.ESC + '@';
  
  // Text formatting
  static BOLD_ON = ESCPOSCommands.ESC + 'E' + '\x01';
  static BOLD_OFF = ESCPOSCommands.ESC + 'E' + '\x00';
  static UNDERLINE_ON = ESCPOSCommands.ESC + '-' + '\x01';
  static UNDERLINE_OFF = ESCPOSCommands.ESC + '-' + '\x00';
  static DOUBLE_HEIGHT_ON = ESCPOSCommands.ESC + '!' + '\x10';
  static DOUBLE_WIDTH_ON = ESCPOSCommands.ESC + '!' + '\x20';
  static DOUBLE_SIZE_ON = ESCPOSCommands.ESC + '!' + '\x30';
  static NORMAL_SIZE = ESCPOSCommands.ESC + '!' + '\x00';
  
  // Alignment
  static ALIGN_LEFT = ESCPOSCommands.ESC + 'a' + '\x00';
  static ALIGN_CENTER = ESCPOSCommands.ESC + 'a' + '\x01';
  static ALIGN_RIGHT = ESCPOSCommands.ESC + 'a' + '\x02';
  
  // Cut paper
  static CUT_PAPER = ESCPOSCommands.GS + 'V' + '\x41' + '\x03';
  
  // Cash drawer
  static OPEN_DRAWER = ESCPOSCommands.ESC + 'p' + '\x00' + '\x19' + '\xFA';
  
  // Line spacing
  static LINE_SPACING_DEFAULT = ESCPOSCommands.ESC + '2';
  static LINE_SPACING_TIGHT = ESCPOSCommands.ESC + '3' + '\x10';
}

export function generateReceiptData(bill: any, businessInfo: any): string {
  const { ESC, LF, INIT, BOLD_ON, BOLD_OFF, ALIGN_CENTER, ALIGN_LEFT, DOUBLE_SIZE_ON, NORMAL_SIZE, CUT_PAPER } = ESCPOSCommands;
  
  let receipt = INIT; // Initialize printer
  
  // Header - Business Name
  receipt += ALIGN_CENTER;
  receipt += DOUBLE_SIZE_ON + BOLD_ON;
  receipt += businessInfo.name || 'Maheshwari Agency';
  receipt += NORMAL_SIZE + BOLD_OFF + LF;
  
  if (businessInfo.address) {
    receipt += businessInfo.address + LF;
  }
  if (businessInfo.phone) {
    receipt += 'Tel: ' + businessInfo.phone + LF;
  }
  
  receipt += '================================' + LF;
  receipt += ALIGN_LEFT;
  
  // Bill details
  receipt += BOLD_ON + 'Bill No: ' + BOLD_OFF + bill.bill_number + LF;
  receipt += BOLD_ON + 'Date: ' + BOLD_OFF + new Date(bill.created_at).toLocaleString() + LF;
  receipt += LF;
  
  // Customer details
  if (bill.customer_name) {
    receipt += BOLD_ON + 'Customer: ' + BOLD_OFF + bill.customer_name + LF;
    if (bill.customer_phone) {
      receipt += BOLD_ON + 'Phone: ' + BOLD_OFF + bill.customer_phone + LF;
    }
    receipt += LF;
  }
  
  // Items header
  receipt += '================================' + LF;
  receipt += BOLD_ON;
  receipt += padRight('ITEM', 20) + padRight('QTY', 6) + padRight('RATE', 8) + 'TOTAL' + LF;
  receipt += BOLD_OFF;
  receipt += '================================' + LF;
  
  // Items
  bill.items.forEach((item: any) => {
    receipt += padRight(item.item_name, 20) + LF;
    receipt += padRight('', 20) + 
               padRight(item.quantity + ' ' + item.unit, 6) + 
               padRight(item.unit_price.toFixed(2), 8) + 
               item.total_price.toFixed(2) + LF;
  });
  
  receipt += '================================' + LF;
  
  // Totals
  receipt += LF;
  receipt += padLeft('Items: ' + bill.items.length, 32) + LF;
  receipt += padLeft('Subtotal: ' + bill.subtotal.toFixed(2), 32) + LF;
  if (bill.tax_amount > 0) {
    receipt += padLeft('Tax: ' + bill.tax_amount.toFixed(2), 32) + LF;
  }
  receipt += BOLD_ON + padLeft('TOTAL: ' + bill.total_amount.toFixed(2), 32) + BOLD_OFF + LF;
  
  // Footer
  receipt += LF;
  receipt += ALIGN_CENTER;
  receipt += 'Thank you for your business!' + LF;
  receipt += LF + LF;
  
  // Cut paper
  receipt += CUT_PAPER;
  
  return receipt;
}

function padRight(str: string, length: number): string {
  return str.slice(0, length).padEnd(length, ' ');
}

function padLeft(str: string, length: number): string {
  return str.slice(0, length).padStart(length, ' ');
}