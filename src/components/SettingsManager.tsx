import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocalization } from '@/contexts/LocalizationContext';
import { User, Bell, Globe, Shield, CreditCard, ChevronRight } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const SettingsManager: React.FC = () => {
  const { t } = useLocalization();

  const sections = [
    {
      title: t('profile'),
      icon: User,
      color: 'bg-[hsl(var(--comic-yellow))]',
      items: [
        { label: t('personalInfo'), value: 'Devesh' },
        { label: t('businessDetails'), value: 'DukanPay' }
      ]
    },
    {
      title: t('preferences'),
      icon: Globe,
      color: 'bg-[hsl(var(--comic-cyan))]',
      items: [
        { label: t('language'), component: <LanguageSelector /> },
        { label: t('notifications'), component: <Switch /> }
      ]
    },
    {
      title: t('security'),
      icon: Shield,
      color: 'bg-[hsl(var(--comic-pink))]',
      items: [
        { label: t('changePassword'), action: true }
      ]
    }
  ];

  return (
    <div className="space-y-4 pb-20">
      <div className="px-1">
        <h2 className="text-xl font-black text-black uppercase italic comic-text-stroke leading-none">{t('settings')}</h2>
        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1 italic">{t('manageYourPreferences')}</p>
      </div>

      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div key={idx} className="border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[3px_3px_0px_0px_#000]">
            <div className={`p-3 border-b-2 border-black flex items-center gap-3 ${section.color}`}>
              <section.icon className="h-4 w-4 text-black" />
              <h3 className="text-xs font-black text-black uppercase italic tracking-tighter leading-none">{section.title}</h3>
            </div>
            <div className="p-1">
              {section.items.map((item, iidx) => (
                <div key={iidx} className={`flex items-center justify-between p-3 ${iidx !== section.items.length - 1 ? 'border-b border-black/10' : ''}`}>
                  <span className="text-[10px] font-black text-black uppercase tracking-widest italic">{item.label}</span>
                  {item.component ? (
                    item.component
                  ) : item.action ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6 border-2 border-black bg-[hsl(var(--comic-beige))] shadow-[1px_1px_0px_0px_#000] active:shadow-none transition-all">
                      <ChevronRight className="h-3 w-3 text-black" />
                    </Button>
                  ) : (
                    <span className="text-[10px] font-black text-black/40 uppercase tracking-widest italic">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 px-1">
        <Button 
          variant="outline" 
          className="w-full h-12 border-2 border-black rounded-none font-black text-[10px] uppercase bg-[hsl(var(--comic-pink))] shadow-[3px_3px_0px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all text-black"
          onClick={() => window.location.reload()}
        >
          {t('resetApp')}
        </Button>
      </div>
    </div>
  );
};

export default SettingsManager;
