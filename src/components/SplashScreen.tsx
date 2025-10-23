import React from 'react';
import { Calculator } from 'lucide-react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-warm animate-fade-in">
      <div className="text-center space-y-6 animate-scale-in">
        {/* Logo Circle with Icon */}
        <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center shadow-warm hover-glow animate-bounce-gentle">
          <Calculator className="h-12 w-12 text-primary-foreground" />
        </div>
        
        {/* Brand Name */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold traditional-heading gradient-text">
            Maheshwari Agency
          </h1>
          <p className="text-lg elegant-text">Smart Billing Solution</p>
        </div>
        
        {/* Loading Indicator */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
