import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

const translations: Translations = {
  // Common
  add: { en: 'Add', hi: 'जोड़ें', mr: 'जोडा' },
  edit: { en: 'Edit', hi: 'संपादित करें', mr: 'संपादित करा' },
  delete: { en: 'Delete', hi: 'हटाएं', mr: 'हटवा' },
  cancel: { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा' },
  save: { en: 'Save', hi: 'सहेजें', mr: 'सेव्ह करा' },
  name: { en: 'Name', hi: 'नाम', mr: 'नाव' },
  quantity: { en: 'Quantity', hi: 'मात्रा', mr: 'प्रमाण' },
  amount: { en: 'Amount', hi: 'राशि', mr: 'रक्कम' },
  date: { en: 'Date', hi: 'दिनांक', mr: 'दिनांक' },
  search: { en: 'Search', hi: 'खोजें', mr: 'शोधा' },
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...', mr: 'लोड होत आहे...' },
  back: { en: 'Back', hi: 'वापस', mr: 'मागे' },
  clear: { en: 'Clear', hi: 'साफ करें', mr: 'साफ करा' },
  update: { en: 'Update', hi: 'अपडेट करें', mr: 'अपडेट करा' },
  yes: { en: 'Yes', hi: 'हाँ', mr: 'होय' },
  no: { en: 'No', hi: 'नहीं', mr: 'नाही' },
  noDataAvailable: { en: 'No data available', hi: 'कोई डेटा उपलब्ध नहीं', mr: 'डेटा उपलब्ध नाही' },
  
  // Items
  items: { en: 'Items', hi: 'वस्तुएं', mr: 'वस्तू' },
  itemName: { en: 'Item Name', hi: 'वस्तु का नाम', mr: 'वस्तूचे नाव' },
  price: { en: 'Price', hi: 'मूल्य', mr: 'किंमत' },
  priceUnit: { en: 'Price/Unit', hi: 'मूल्य/इकाई', mr: 'किंमत/युनिट' },
  unit: { en: 'Unit', hi: 'इकाई', mr: 'युनिट' },
  addItem: { en: 'Add Item', hi: 'वस्तु जोड़ें', mr: 'वस्तू जोडा' },
  editItem: { en: 'Edit Item', hi: 'वस्तु संपादित करें', mr: 'वस्तू संपादित करा' },
  addNewItem: { en: 'Add New Item', hi: 'नई वस्तु जोड़ें', mr: 'नवीन वस्तू जोडा' },
  searchItems: { en: 'Search items...', hi: 'वस्तुएं खोजें...', mr: 'वस्तू शोधा...' },
  noItems: { en: 'No items', hi: 'कोई वस्तु नहीं', mr: 'वस्तू नाही' },
  addYourFirstItem: { en: 'Add your first item', hi: 'अपनी पहली वस्तु जोड़ें', mr: 'तुमची पहिली वस्तू जोडा' },
  enterItemName: { en: 'Enter item name', hi: 'वस्तु का नाम दर्ज करें', mr: 'वस्तूचे नाव प्रविष्ट करा' },
  ratePerUnit: { en: 'Rate (Price/Unit)', hi: 'दर (मूल्य/इकाई)', mr: 'दर (किंमत/युनिट)' },
  updateItemDetails: { en: 'Update item details.', hi: 'वस्तु विवरण अपडेट करें।', mr: 'वस्तू तपशील अपडेट करा.' },
  enterItemDetails: { en: 'Enter item details.', hi: 'वस्तु विवरण दर्ज करें।', mr: 'वस्तू तपशील प्रविष्ट करा.' },
  itemUpdated: { en: 'Item updated', hi: 'वस्तु अपडेट हुई', mr: 'वस्तू अपडेट झाली' },
  itemAdded: { en: 'Item added', hi: 'वस्तु जोड़ी गई', mr: 'वस्तू जोडली' },
  itemDeleted: { en: 'Item deleted', hi: 'वस्तु हटाई गई', mr: 'वस्तू हटवली' },
  failedToLoadItems: { en: 'Failed to load items', hi: 'वस्तुएं लोड करने में विफल', mr: 'वस्तू लोड करण्यात अयशस्वी' },
  failedToSaveItem: { en: 'Failed to save item', hi: 'वस्तु सहेजने में विफल', mr: 'वस्तू सेव्ह करण्यात अयशस्वी' },
  failedToDeleteItem: { en: 'Failed to delete item', hi: 'वस्तु हटाने में विफल', mr: 'वस्तू हटवण्यात अयशस्वी' },
  deleteThisItem: { en: 'Delete this item?', hi: 'इस वस्तु को हटाएं?', mr: 'ही वस्तू हटवायची?' },
  itemsManagement: { en: 'Items Management', hi: 'वस्तु प्रबंधन', mr: 'वस्तू व्यवस्थापन' },
  
  // Customers
  customers: { en: 'Customers', hi: 'ग्राहक', mr: 'ग्राहक' },
  customer: { en: 'Customer', hi: 'ग्राहक', mr: 'ग्राहक' },
  customerName: { en: 'Customer Name', hi: 'ग्राहक का नाम', mr: 'ग्राहकाचे नाव' },
  phone: { en: 'Phone', hi: 'फोन', mr: 'फोन' },
  phoneNumber: { en: 'Phone Number', hi: 'फोन नंबर', mr: 'फोन नंबर' },
  address: { en: 'Address', hi: 'पता', mr: 'पत्ता' },
  addCustomer: { en: 'Add Customer', hi: 'ग्राहक जोड़ें', mr: 'ग्राहक जोडा' },
  editCustomer: { en: 'Edit Customer', hi: 'ग्राहक संपादित करें', mr: 'ग्राहक संपादित करा' },
  searchCustomers: { en: 'Search customers...', hi: 'ग्राहक खोजें...', mr: 'ग्राहक शोधा...' },
  noCustomers: { en: 'No customers', hi: 'कोई ग्राहक नहीं', mr: 'ग्राहक नाही' },
  addYourFirstCustomer: { en: 'Add your first customer', hi: 'अपना पहला ग्राहक जोड़ें', mr: 'तुमचा पहिला ग्राहक जोडा' },
  customerUpdated: { en: 'Customer updated', hi: 'ग्राहक अपडेट हुआ', mr: 'ग्राहक अपडेट झाला' },
  customerAdded: { en: 'Customer added', hi: 'ग्राहक जोड़ा गया', mr: 'ग्राहक जोडला' },
  customerDeleted: { en: 'Customer deleted', hi: 'ग्राहक हटाया गया', mr: 'ग्राहक हटवला' },
  failedToLoadCustomers: { en: 'Failed to load customers', hi: 'ग्राहक लोड करने में विफल', mr: 'ग्राहक लोड करण्यात अयशस्वी' },
  failedToSaveCustomer: { en: 'Failed to save customer', hi: 'ग्राहक सहेजने में विफल', mr: 'ग्राहक सेव्ह करण्यात अयशस्वी' },
  failedToDeleteCustomer: { en: 'Failed to delete customer', hi: 'ग्राहक हटाने में विफल', mr: 'ग्राहक हटवण्यात अयशस्वी' },
  deleteThisCustomer: { en: 'Delete this customer?', hi: 'इस ग्राहक को हटाएं?', mr: 'हा ग्राहक हटवायचा?' },
  customerManagement: { en: 'Customer Management', hi: 'ग्राहक प्रबंधन', mr: 'ग्राहक व्यवस्थापन' },
  updateDetails: { en: 'Update details.', hi: 'विवरण अपडेट करें।', mr: 'तपशील अपडेट करा.' },
  enterDetails: { en: 'Enter details.', hi: 'विवरण दर्ज करें।', mr: 'तपशील प्रविष्ट करा.' },
  viewAllCustomers: { en: 'View All Customers', hi: 'सभी ग्राहक देखें', mr: 'सर्व ग्राहक पहा' },
  
  // Bills
  bills: { en: 'Bills', hi: 'बिल', mr: 'बिल' },
  billNumber: { en: 'Bill Number', hi: 'बिल नंबर', mr: 'बिल नंबर' },
  billNo: { en: 'Bill No', hi: 'बिल नं', mr: 'बिल नं' },
  total: { en: 'Total', hi: 'कुल', mr: 'एकूण' },
  subtotal: { en: 'Sub Total', hi: 'उप योग', mr: 'उप बेरीज' },
  createBill: { en: 'Create Bill', hi: 'बिल बनाएं', mr: 'बिल तयार करा' },
  saveBill: { en: 'Save Bill', hi: 'बिल सहेजें', mr: 'बिल सेव्ह करा' },
  billSaved: { en: 'Bill saved!', hi: 'बिल सहेजा गया!', mr: 'बिल सेव्ह झाले!' },
  billCreated: { en: 'Bill Created!', hi: 'बिल बनाया गया!', mr: 'बिल तयार झाले!' },
  billUpdated: { en: 'Bill updated successfully!', hi: 'बिल सफलतापूर्वक अपडेट हुआ!', mr: 'बिल यशस्वीरित्या अपडेट झाले!' },
  billDeleted: { en: 'Bill deleted', hi: 'बिल हटाया गया', mr: 'बिल हटवले' },
  failedToSaveBill: { en: 'Failed to save bill', hi: 'बिल सहेजने में विफल', mr: 'बिल सेव्ह करण्यात अयशस्वी' },
  failedToLoadBills: { en: 'Failed to load bills', hi: 'बिल लोड करने में विफल', mr: 'बिल लोड करण्यात अयशस्वी' },
  failedToDeleteBill: { en: 'Failed to delete bill', hi: 'बिल हटाने में विफल', mr: 'बिल हटवण्यात अयशस्वी' },
  failedToUpdateBill: { en: 'Failed to update bill', hi: 'बिल अपडेट करने में विफल', mr: 'बिल अपडेट करण्यात अयशस्वी' },
  noBillsYet: { en: 'No bills yet', hi: 'अभी कोई बिल नहीं', mr: 'अजून बिल नाही' },
  noBillsFound: { en: 'No bills found', hi: 'कोई बिल नहीं मिला', mr: 'बिल सापडले नाही' },
  createFirstBill: { en: 'Create your first bill to see it here', hi: 'यहां देखने के लिए अपना पहला बिल बनाएं', mr: 'येथे पाहण्यासाठी तुमचे पहिले बिल तयार करा' },
  tryAdjustingSearch: { en: 'Try adjusting your search', hi: 'अपनी खोज बदलकर देखें', mr: 'तुमचा शोध बदलून पहा' },
  searchBills: { en: 'Search bills by number or customer...', hi: 'नंबर या ग्राहक से बिल खोजें...', mr: 'नंबर किंवा ग्राहकाने बिल शोधा...' },
  billsAndReports: { en: 'Bills & Reports', hi: 'बिल और रिपोर्ट', mr: 'बिल आणि अहवाल' },
  totalBills: { en: 'Total Bills', hi: 'कुल बिल', mr: 'एकूण बिल' },
  revenue: { en: 'Revenue', hi: 'राजस्व', mr: 'महसूल' },
  balance: { en: 'Balance', hi: 'शेष', mr: 'शिल्लक' },
  sale: { en: 'SALE', hi: 'बिक्री', mr: 'विक्री' },
  invoiceNo: { en: 'Invoice No.', hi: 'बिल संख्या', mr: 'बिल क्रमांक' },
  billedItems: { en: 'Billed Items', hi: 'बिल की वस्तुएं', mr: 'बिल केलेल्या वस्तू' },
  itemSubtotal: { en: 'Item Subtotal', hi: 'वस्तु उप योग', mr: 'वस्तू उप बेरीज' },
  noItemsAdded: { en: 'No items added', hi: 'कोई वस्तु नहीं जोड़ी गई', mr: 'वस्तू जोडल्या नाहीत' },
  noItemsAddedYet: { en: 'No items added yet.', hi: 'अभी तक कोई वस्तु नहीं जोड़ी गई।', mr: 'अजून वस्तू जोडल्या नाहीत.' },
  selectCustomerAndAddItems: { en: 'Select a customer and add items', hi: 'एक ग्राहक चुनें और वस्तुएं जोड़ें', mr: 'एक ग्राहक निवडा आणि वस्तू जोडा' },
  editBillTitle: { en: 'Edit Bills', hi: 'बिल संपादित करें', mr: 'बिल संपादित करा' },
  updateBillDetails: { en: 'Update bill details and items', hi: 'बिल विवरण और वस्तुएं अपडेट करें', mr: 'बिल तपशील आणि वस्तू अपडेट करा' },
  addItems: { en: 'Add Items', hi: 'वस्तुएं जोड़ें', mr: 'वस्तू जोडा' },
  
  // Units
  patti: { en: 'Patti', hi: 'पत्ती', mr: 'पत्ती' },
  box: { en: 'Box', hi: 'डिब्बा', mr: 'बॉक्स' },
  
  // Business
  maheshwariAgency: { en: 'MAHESHWARI AGENCY', hi: 'महेश्वरी एजेंसी', mr: 'माहेश्वरी एजन्सी' },
  maheshwariAgencies: { en: 'MAHESHWARI AGENCIES', hi: 'महेश्वरी एजेंसी', mr: 'माहेश्वरी एजन्सी' },
  thankYou: { en: 'Thank you for your business!', hi: 'आपके व्यापार के लिए धन्यवाद!', mr: 'आपल्या व्यवसायासाठी धन्यवाद!' },
  smartBillingSolution: { en: 'Smart Billing Solution', hi: 'स्मार्ट बिलिंग समाधान', mr: 'स्मार्ट बिलिंग सोल्यूशन' },
  
  // Navigation
  home: { en: 'HOME', hi: 'होम', mr: 'होम' },
  dashboard: { en: 'DASHBOARD', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड' },
  menu: { en: 'MENU', hi: 'मेन्यू', mr: 'मेन्यू' },
  
  // Dashboard
  transactionDetails: { en: 'Transaction Details', hi: 'लेन-देन विवरण', mr: 'व्यवहार तपशील' },
  partyDetails: { en: 'Party Details', hi: 'पार्टी विवरण', mr: 'पार्टी तपशील' },
  quickLinks: { en: 'Quick Links', hi: 'त्वरित लिंक', mr: 'द्रुत दुवे' },
  addTxn: { en: 'Add Txn', hi: 'लेन-देन जोड़ें', mr: 'व्यवहार जोडा' },
  saleReport: { en: 'Sale Report', hi: 'बिक्री रिपोर्ट', mr: 'विक्री अहवाल' },
  settings: { en: 'Settings', hi: 'सेटिंग्स', mr: 'सेटिंग्ज' },
  showAll: { en: 'Show All', hi: 'सभी देखें', mr: 'सर्व पहा' },
  searchTransaction: { en: 'Search for a transaction', hi: 'लेन-देन खोजें', mr: 'व्यवहार शोधा' },
  searchParty: { en: 'Search for a party', hi: 'पार्टी खोजें', mr: 'पार्टी शोधा' },
  noTransactionsYet: { en: 'No transactions yet', hi: 'अभी कोई लेन-देन नहीं', mr: 'अजून व्यवहार नाहीत' },
  addTransaction: { en: 'Add Transaction', hi: 'लेन-देन जोड़ें', mr: 'व्यवहार जोडा' },
  addNewSale: { en: 'Add New Sale', hi: 'नई बिक्री जोड़ें', mr: 'नवीन विक्री जोडा' },
  
  // Billing
  saleTitle: { en: 'Sale', hi: 'बिक्री', mr: 'विक्री' },
  connected: { en: 'Connected', hi: 'कनेक्टेड', mr: 'कनेक्टेड' },
  disconnected: { en: 'Disconnected', hi: 'डिस्कनेक्टेड', mr: 'डिस्कनेक्टेड' },
  selectCustomer: { en: 'Select a customer', hi: 'एक ग्राहक चुनें', mr: 'एक ग्राहक निवडा' },
  searchItemsPlaceholder: { en: 'Search items... e.g. ki', hi: 'वस्तुएं खोजें... उदा. की', mr: 'वस्तू शोधा... उदा. की' },
  noItemsFound: { en: 'No items found', hi: 'कोई वस्तु नहीं मिली', mr: 'वस्तू सापडल्या नाहीत' },
  selected: { en: 'Selected:', hi: 'चयनित:', mr: 'निवडलेले:' },
  qty: { en: 'Qty', hi: 'मात्रा', mr: 'प्रमाण' },
  rate: { en: 'Rate', hi: 'दर', mr: 'दर' },
  tax: { en: 'Tax', hi: 'कर', mr: 'कर' },
  taxPercent: { en: 'Tax %', hi: 'कर %', mr: 'कर %' },
  selectAnItem: { en: 'Select an item', hi: 'एक वस्तु चुनें', mr: 'एक वस्तू निवडा' },
  quantityMustBeGreater: { en: 'Quantity must be > 0', hi: 'मात्रा > 0 होनी चाहिए', mr: 'प्रमाण > 0 असावे' },
  selectItem: { en: 'Select item', hi: 'वस्तु चुनें', mr: 'वस्तू निवडा' },
  saving: { en: 'Saving...', hi: 'सहेज रहे हैं...', mr: 'सेव्ह होत आहे...' },
  updating: { en: 'Updating...', hi: 'अपडेट हो रहा है...', mr: 'अपडेट होत आहे...' },
  failedToLoadData: { en: 'Failed to load data', hi: 'डेटा लोड करने में विफल', mr: 'डेटा लोड करण्यात अयशस्वी' },
  printed: { en: 'Printed!', hi: 'प्रिंट हो गया!', mr: 'प्रिंट झाले!' },
  printFailed: { en: 'Print failed', hi: 'प्रिंट विफल', mr: 'प्रिंट अयशस्वी' },
  shareFailed: { en: 'Share failed', hi: 'शेयर विफल', mr: 'शेअर अयशस्वी' },
  pdfDownloaded: { en: 'PDF downloaded!', hi: 'PDF डाउनलोड हो गया!', mr: 'PDF डाउनलोड झाले!' },
  failedToGeneratePDF: { en: 'Failed to generate PDF', hi: 'PDF बनाने में विफल', mr: 'PDF तयार करण्यात अयशस्वी' },
  failedToSharePDF: { en: 'Failed to share PDF', hi: 'PDF शेयर करने में विफल', mr: 'PDF शेअर करण्यात अयशस्वी' },
  shared: { en: 'Shared!', hi: 'शेयर हो गया!', mr: 'शेअर झाले!' },
  chooseHowToShare: { en: 'Choose how to share with your customer.', hi: 'अपने ग्राहक के साथ कैसे शेयर करें चुनें।', mr: 'तुमच्या ग्राहकासोबत कसे शेअर करायचे ते निवडा.' },
  printReceipt: { en: 'Print Receipt', hi: 'रसीद प्रिंट करें', mr: 'पावती प्रिंट करा' },
  downloadPDF: { en: 'Download PDF', hi: 'PDF डाउनलोड करें', mr: 'PDF डाउनलोड करा' },
  sharePDF: { en: 'Share PDF', hi: 'PDF शेयर करें', mr: 'PDF शेअर करा' },
  createAnotherBill: { en: 'Create Another Bill', hi: 'और एक बिल बनाएं', mr: 'आणखी एक बिल तयार करा' },
  
  // Reports
  reportsAndAnalytics: { en: 'Reports & Analytics', hi: 'रिपोर्ट और विश्लेषण', mr: 'अहवाल आणि विश्लेषण' },
  viewBusinessPerformance: { en: 'View your business performance', hi: 'अपने व्यापार का प्रदर्शन देखें', mr: 'तुमच्या व्यवसायाचे कामगिरी पहा' },
  reportFilters: { en: 'Report Filters', hi: 'रिपोर्ट फिल्टर', mr: 'अहवाल फिल्टर' },
  fromDate: { en: 'From Date', hi: 'तारीख से', mr: 'तारखेपासून' },
  toDate: { en: 'To Date', hi: 'तारीख तक', mr: 'तारखेपर्यंत' },
  reportType: { en: 'Report Type', hi: 'रिपोर्ट प्रकार', mr: 'अहवाल प्रकार' },
  daily: { en: 'Daily', hi: 'दैनिक', mr: 'दैनिक' },
  weekly: { en: 'Weekly', hi: 'साप्ताहिक', mr: 'साप्ताहिक' },
  monthly: { en: 'Monthly', hi: 'मासिक', mr: 'मासिक' },
  yearly: { en: 'Yearly', hi: 'वार्षिक', mr: 'वार्षिक' },
  last7days: { en: 'Last 7 days', hi: 'पिछले 7 दिन', mr: 'मागील 7 दिवस' },
  last30days: { en: 'Last 30 days', hi: 'पिछले 30 दिन', mr: 'मागील 30 दिवस' },
  last3months: { en: 'Last 3 months', hi: 'पिछले 3 महीने', mr: 'मागील 3 महिने' },
  generateReport: { en: 'Generate Report', hi: 'रिपोर्ट बनाएं', mr: 'अहवाल तयार करा' },
  totalRevenue: { en: 'Total Revenue', hi: 'कुल राजस्व', mr: 'एकूण महसूल' },
  totalItems: { en: 'Total Items', hi: 'कुल वस्तुएं', mr: 'एकूण वस्तू' },
  avgBillValue: { en: 'Avg Bill Value', hi: 'औसत बिल मूल्य', mr: 'सरासरी बिल मूल्य' },
  topCustomers: { en: 'Top Customers', hi: 'शीर्ष ग्राहक', mr: 'शीर्ष ग्राहक' },
  revenueBy: { en: 'Revenue by', hi: 'के अनुसार राजस्व', mr: 'नुसार महसूल' },
  noCustomerDataAvailable: { en: 'No customer data available', hi: 'कोई ग्राहक डेटा उपलब्ध नहीं', mr: 'ग्राहक डेटा उपलब्ध नाही' },
  noDataForPeriod: { en: 'No data available for selected period', hi: 'चयनित अवधि के लिए कोई डेटा नहीं', mr: 'निवडलेल्या कालावधीसाठी डेटा उपलब्ध नाही' },
  failedToGenerateReport: { en: 'Failed to generate report', hi: 'रिपोर्ट बनाने में विफल', mr: 'अहवाल तयार करण्यात अयशस्वी' },
  selectDateRange: { en: 'Please select date range', hi: 'कृपया तारीख सीमा चुनें', mr: 'कृपया तारीख श्रेणी निवडा' },
  
  // Auth
  welcomeBack: { en: 'Welcome Back', hi: 'वापस स्वागत है', mr: 'पुन्हा स्वागत' },
  signInOrCreate: { en: 'Sign in or create a new account', hi: 'साइन इन करें या नया खाता बनाएं', mr: 'साइन इन करा किंवा नवीन खाते तयार करा' },
  signIn: { en: 'Sign In', hi: 'साइन इन', mr: 'साइन इन' },
  signUp: { en: 'Sign Up', hi: 'साइन अप', mr: 'साइन अप' },
  email: { en: 'Email', hi: 'ईमेल', mr: 'ईमेल' },
  password: { en: 'Password', hi: 'पासवर्ड', mr: 'पासवर्ड' },
  businessName: { en: 'Business Name', hi: 'व्यापार का नाम', mr: 'व्यवसायाचे नाव' },
  enterEmail: { en: 'Enter your email', hi: 'अपना ईमेल दर्ज करें', mr: 'तुमचा ईमेल प्रविष्ट करा' },
  enterPassword: { en: 'Enter your password', hi: 'अपना पासवर्ड दर्ज करें', mr: 'तुमचा पासवर्ड प्रविष्ट करा' },
  yourBusinessName: { en: 'Your business name', hi: 'आपका व्यापार का नाम', mr: 'तुमच्या व्यवसायाचे नाव' },
  createPassword: { en: 'Create a password (min 6 characters)', hi: 'पासवर्ड बनाएं (कम से कम 6 अक्षर)', mr: 'पासवर्ड तयार करा (किमान 6 अक्षरे)' },
  signingIn: { en: 'Signing In...', hi: 'साइन इन हो रहा है...', mr: 'साइन इन होत आहे...' },
  creatingAccount: { en: 'Creating Account...', hi: 'खाता बना रहे हैं...', mr: 'खाते तयार होत आहे...' },
  createAccount: { en: 'Create Account', hi: 'खाता बनाएं', mr: 'खाते तयार करा' },
  securePrivateMobile: { en: 'Secure • Private • Mobile-First', hi: 'सुरक्षित • निजी • मोबाइल-फर्स्ट', mr: 'सुरक्षित • खाजगी • मोबाइल-फर्स्ट' },
  signedInSuccess: { en: 'Signed in successfully!', hi: 'सफलतापूर्वक साइन इन हो गया!', mr: 'यशस्वीरित्या साइन इन झाले!' },
  accountCreated: { en: 'Account created! Please check your email for verification.', hi: 'खाता बनाया गया! कृपया सत्यापन के लिए अपना ईमेल जांचें।', mr: 'खाते तयार झाले! कृपया सत्यापनासाठी तुमचा ईमेल तपासा.' },
  invalidCredentials: { en: 'Invalid email or password.', hi: 'अमान्य ईमेल या पासवर्ड।', mr: 'अवैध ईमेल किंवा पासवर्ड.' },
  emailNotConfirmed: { en: 'Please check your email and click the confirmation link.', hi: 'कृपया अपना ईमेल जांचें और पुष्टि लिंक पर क्लिक करें।', mr: 'कृपया तुमचा ईमेल तपासा आणि पुष्टी लिंकवर क्लिक करा.' },
  userAlreadyExists: { en: 'An account with this email already exists.', hi: 'इस ईमेल से पहले से खाता मौजूद है।', mr: 'या ईमेलसह खाते आधीच अस्तित्वात आहे.' },
  passwordTooShort: { en: 'Password should be at least 6 characters long.', hi: 'पासवर्ड कम से कम 6 अक्षर लंबा होना चाहिए।', mr: 'पासवर्ड किमान 6 अक्षरांचा असावा.' },
  unexpectedError: { en: 'An unexpected error occurred.', hi: 'एक अप्रत्याशित त्रुटि हुई।', mr: 'अनपेक्षित त्रुटी आली.' },
  signedOutSuccess: { en: 'Signed out successfully', hi: 'सफलतापूर्वक साइन आउट हो गया', mr: 'यशस्वीरित्या साइन आउट झाले' },
  errorSigningOut: { en: 'Error signing out', hi: 'साइन आउट में त्रुटि', mr: 'साइन आउट करताना त्रुटी' },
  
  // Features on auth page
  inventory: { en: 'Inventory', hi: 'इन्वेंटरी', mr: 'इन्व्हेंटरी' },
  billing: { en: 'Billing', hi: 'बिलिंग', mr: 'बिलिंग' },
  
  // Print / PDF / Share
  print: { en: 'Print', hi: 'प्रिंट', mr: 'प्रिंट' },
  pdf: { en: 'PDF', hi: 'PDF', mr: 'PDF' },
  share: { en: 'Share', hi: 'शेयर', mr: 'शेअर' },
  download: { en: 'Download', hi: 'डाउनलोड', mr: 'डाउनलोड' },
};

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') as Language;
    if (savedLanguage && ['en', 'hi', 'mr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'hi') {
        setLanguage('hi');
      } else if (browserLang === 'mr') {
        setLanguage('mr');
      }
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
