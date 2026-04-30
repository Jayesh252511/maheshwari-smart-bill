import React from 'react';
import { Calculator } from 'lucide-react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">DukaanPe</h1>
          <p className="text-sm text-muted-foreground mt-1">Smart Billing for Your Dukaan</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
