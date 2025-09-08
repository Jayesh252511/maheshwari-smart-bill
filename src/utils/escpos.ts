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

export function generateReceiptData(bill: any, businessInfo: any, t?: (key: string) => string): string {
  const { ESC, LF, INIT, BOLD_ON, BOLD_OFF, ALIGN_CENTER, ALIGN_LEFT, DOUBLE_SIZE_ON, NORMAL_SIZE, CUT_PAPER } = ESCPOSCommands;
  
  let receipt = INIT; // Initialize printer
  
  // Header - Business Name (ALL BOLD)
  receipt += ALIGN_CENTER + BOLD_ON;
  receipt += DOUBLE_SIZE_ON;
  receipt += 'MAHESHWARI AGENCY';
  receipt += NORMAL_SIZE + LF;
  
  if (businessInfo?.address) {
    receipt += businessInfo.address + LF;
  }
  if (businessInfo?.phone) {
    receipt += 'Tel: ' + businessInfo.phone + LF;
  }
  
  receipt += '================================' + LF;
  receipt += LF;
  receipt += 'INVOICE' + LF;
  receipt += LF;
  receipt += ALIGN_LEFT;
  
  // Bill details (ALL BOLD)
  receipt += 'Bill No: ' + String(bill.bill_number).padStart(2, '0');
  receipt += '          Date: ' + new Date(bill.created_at).toLocaleDateString() + LF;
  receipt += LF;
  
  // Customer details (ALL BOLD)
  if (bill.customer_name) {
    receipt += 'Bill To:' + LF;
    receipt += bill.customer_name + LF;
    if (bill.customer_phone) {
      receipt += 'Phone: ' + bill.customer_phone + LF;
    }
    receipt += LF;
  }
  
  // Table header with proper spacing for 32 chars (removed Unit column)
  receipt += padRight('Item Name', 16) + padRight('Qty', 6) + padRight('Rate', 10) + LF;
  receipt += '================================' + LF;
  
  // Items with aligned amounts (no unit display)
  let totalQuantity = 0;
  bill.items.forEach((item: any) => {
    totalQuantity += item.quantity;
    const itemName = padRight(item.item_name, 16);
    const qty = padRight(item.quantity.toString(), 6);
    const price = padRight(item.unit_price.toFixed(2), 10);
    const amount = item.total_price.toFixed(2);
    receipt += itemName + qty + price + amount + LF;
  });
  
  receipt += '================================' + LF;
  
  // Summary with proper spacing and alignment
  receipt += LF;
  receipt += padRight('Total Items:', 16) + padRight(totalQuantity.toString(), 6) + LF;
  receipt += LF;
  receipt += padRight('', 22) + padRight('Subtotal:', 10) + bill.subtotal.toFixed(2) + LF;
  receipt += padRight('', 22) + padRight('Total:', 10) + bill.total_amount.toFixed(2) + LF;
  
  // Footer (ALL BOLD)
  receipt += LF;
  receipt += ALIGN_CENTER;
  receipt += 'Thank for coming and visit again' + LF;
  receipt += BOLD_OFF + LF + LF;
  
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

function padCenter(str: string, length: number): string {
  const totalPad = length - str.length;
  const leftPad = Math.floor(totalPad / 2);
  const rightPad = totalPad - leftPad;
  return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
}