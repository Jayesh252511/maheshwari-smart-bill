import jsPDF from 'jspdf';
import { Bill } from '@/types/bill';

export async function generatePDFInvoice(bill: Bill, businessInfo: any, t?: (key: string) => string): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let y = 20;
  
  // Header - Business Name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(businessInfo.name || (t ? t('maheshwariAgency') : 'MAHESHWARI AGENCY'), pageWidth / 2, y, { align: 'center' });
  y += 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('matakari galli shegaon', pageWidth / 2, y, { align: 'center' });
  y += 7;
  doc.text('Tel: 9970041700', pageWidth / 2, y, { align: 'center' });
  y += 7;
  
  // Line separator
  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  y += 15;
  
  // Invoice title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 15;
  
  // Bill details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${t ? t('billNo') : 'Bill No'}: ${String(bill.bill_number).padStart(2, '0')}`, 20, y);
  doc.text(`${t ? t('date') : 'Date'}: ${new Date(bill.created_at).toLocaleDateString()}`, pageWidth - 20, y, { align: 'right' });
  y += 15;
  
  // Customer details
  if (bill.customer_name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(bill.customer_name, 20, y);
    y += 5;
    if (bill.customer_phone) {
      doc.text(`Phone: ${bill.customer_phone}`, 20, y);
      y += 5;
    }
    if (bill.customer_address) {
      const addressLines = doc.splitTextToSize(bill.customer_address, 80);
      doc.text(addressLines, 20, y);
      y += addressLines.length * 5;
    }
    y += 10;
  }
  
  // Items table header
  const tableStartY = y;
  doc.setFont('helvetica', 'bold');
  doc.text(t ? t('itemName') : 'Item', 20, y);
  doc.text(t ? t('quantity') : 'Qty', 120, y);
  doc.text(t ? t('price') : 'Price', 145, y);
  doc.text(t ? t('amount') : 'Amount', pageWidth - 20, y, { align: 'right' });
  y += 5;
  
  // Table header line
  doc.line(20, y, pageWidth - 20, y);
  y += 10;
  
  // Items - bold quantities and prices
  bill.items.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.text(item.item_name, 20, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.quantity}`, 120, y);
    doc.text(`${item.unit_price.toFixed(2)}`, 145, y);
    doc.text(`${item.total_price.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
    y += 8;
  });
  
  // Table footer line
  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  y += 10;
  
  // Totals
  doc.text('Items:', pageWidth - 80, y);
  doc.text(`${bill.items.length}`, pageWidth - 20, y, { align: 'right' });
  y += 7;
  
  doc.text(`${t ? t('subtotal') : 'Subtotal'}:`, pageWidth - 80, y);
  doc.text(`${bill.subtotal.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
  y += 7;
  
  if (bill.tax_amount > 0) {
    doc.text('Tax:', pageWidth - 80, y);
    doc.text(`${bill.tax_amount.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
    y += 7;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${t ? t('total') : 'Total'}:`, pageWidth - 80, y);
  doc.text(`${bill.total_amount.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
  
  // Footer
  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(t ? t('thankYou') : 'Thank you for your business!', pageWidth / 2, y, { align: 'center' });
  
  return doc.output('blob');
}

export async function downloadPDF(bill: Bill, businessInfo: any, filename?: string, t?: (key: string) => string): Promise<void> {
  const pdfBlob = await generatePDFInvoice(bill, businessInfo, t);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `invoice-${bill.bill_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function sharePDF(bill: Bill, businessInfo: any, t?: (key: string) => string): Promise<void> {
  if (!navigator.share) {
    throw new Error('Web Share API is not supported in this browser');
  }
  
  const pdfBlob = await generatePDFInvoice(bill, businessInfo, t);
  const file = new File([pdfBlob], `invoice-${bill.bill_number}.pdf`, { type: 'application/pdf' });
  
  await navigator.share({
    title: `Invoice ${bill.bill_number}`,
    text: `Invoice for ${bill.customer_name}`,
    files: [file]
  });
}