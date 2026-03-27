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
  
  // Items
  items: { en: 'Items', hi: 'वस्तुएं', mr: 'वस्तू' },
  itemName: { en: 'Item Name', hi: 'वस्तु का नाम', mr: 'वस्तूचे नाव' },
  price: { en: 'Price', hi: 'मूल्य', mr: 'किंमत' },
  priceUnit: { en: 'Price/Unit', hi: 'मूल्य/इकाई', mr: 'किंमत/युनिट' },
  unit: { en: 'Unit', hi: 'इकाई', mr: 'युनिट' },
  
  // Customers
  customers: { en: 'Customers', hi: 'ग्राहक', mr: 'ग्राहक' },
  customer: { en: 'Customer', hi: 'ग्राहक', mr: 'ग्राहक' },
  customerName: { en: 'Customer Name', hi: 'ग्राहक का नाम', mr: 'ग्राहकाचे नाव' },
  phone: { en: 'Phone', hi: 'फोन', mr: 'फोन' },
  address: { en: 'Address', hi: 'पता', mr: 'पत्ता' },
  
  // Bills
  bills: { en: 'Bills', hi: 'बिल', mr: 'बिल' },
  billNumber: { en: 'Bill Number', hi: 'बिल नंबर', mr: 'बिल नंबर' },
  billNo: { en: 'Bill No', hi: 'बिल नं', mr: 'बिल नं' },
  total: { en: 'Total', hi: 'कुल', mr: 'एकूण' },
  subtotal: { en: 'Sub Total', hi: 'उप योग', mr: 'उप बेरीज' },
  
  // Units
  patti: { en: 'Patti', hi: 'पत्ती', mr: 'पत्ती' },
  box: { en: 'Box', hi: 'डिब्बा', mr: 'बॉक्स' },
  
  // Business
  maheshwariAgency: { en: 'MAHESHWARI AGENCY', hi: 'महेश्वरी एजेंसी', mr: 'माहेश्वरी एजन्सी' },
  thankYou: { en: 'Thank you for your business!', hi: 'आपके व्यापार के लिए धन्यवाद!', mr: 'आपल्या व्यवसायासाठी धन्यवाद!' }
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
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('app-language') as Language;
    if (savedLanguage && ['en', 'hi', 'mr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Auto-detect language based on browser locale
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