import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useLocalization, Language } from '@/contexts/LocalizationContext';

const LanguageSelector: React.FC = () => {
  console.log('LanguageSelector rendering');
  try {
    const { language, setLanguage } = useLocalization();
    console.log('Successfully got localization context:', { language, setLanguage });

    const languages = [
      { code: 'en' as Language, name: 'English', native: 'English' },
      { code: 'hi' as Language, name: 'Hindi', native: 'हिंदी' },
      { code: 'mr' as Language, name: 'Marathi', native: 'मराठी' }
    ];

    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.native}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  } catch (error) {
    console.error('Error in LanguageSelector:', error);
    return <div>Error loading language selector</div>;
  }
};

export default LanguageSelector;