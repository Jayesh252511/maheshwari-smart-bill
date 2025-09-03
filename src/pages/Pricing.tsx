import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Crown, Star, Zap, Copy } from 'lucide-react';
import WhatsAppPayment from '@/components/WhatsAppPayment';

const plans = [
  {
    code: '199_1m',
    name: 'Starter',
    price: '₹199',
    duration: '1 Month',
    features: [
      'Unlimited Bills',
      'Customer Management', 
      'Inventory Tracking',
      'Mobile Receipt Printing',
      'Basic Reports'
    ],
    popular: false,
    icon: <Zap className="h-6 w-6" />
  },
  {
    code: '299_3m',
    name: 'Business',
    price: '₹299',
    duration: '3 Months',
    features: [
      'Everything in Starter',
      'Advanced Analytics',
      'Multiple Users',
      'Priority Support',
      'Data Backup'
    ],
    popular: true,
    icon: <Star className="h-6 w-6" />
  },
  {
    code: '499_8m',
    name: 'Professional',
    price: '₹499',
    duration: '8 Months',
    features: [
      'Everything in Business',
      'Custom Reports',
      'API Integration',
      'White Label Option',
      'Advanced Security'
    ],
    popular: false,
    icon: <Crown className="h-6 w-6" />
  },
  {
    code: '599_12m',
    name: 'Enterprise',
    price: '₹599',
    duration: '12 Months',
    features: [
      'Everything in Professional',
      'Dedicated Support',
      'Custom Features',
      'Training Sessions',
      'Premium Updates'
    ],
    popular: false,
    icon: <Crown className="h-6 w-6" />
  }
];

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showWhatsAppPayment, setShowWhatsAppPayment] = useState(false);
  const { user } = useAuth();

  const handleSelectPlan = async (planCode: string) => {
    if (!user) {
      toast.error('Please login to select a plan');
      return;
    }

    setSelectedPlan(planCode);
    setShowWhatsAppPayment(true);
    
    toast.success('Plan selected! Complete payment via WhatsApp for instant activation.');
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('jayeshneo07@oksbi');
    toast.success('UPI ID copied to clipboard');
  };

  const selectedPlanDetails = plans.find(p => p.code === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-warm py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl traditional-heading mb-4">Choose Your Plan</h1>
          <p className="text-xl elegant-text mb-2">
            Unlock unlimited billing potential for your business
          </p>
          <p className="elegant-text text-muted-foreground">
            Pay via UPI and get instant activation after admin approval
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.code}
              className={`relative creative-card hover:scale-105 transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-accent shadow-warm' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-xl ${plan.popular ? 'bg-accent text-accent-foreground' : 'bg-secondary'}`}>
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl traditional-heading">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold gradient-text">{plan.price}</div>
                  <CardDescription className="elegant-text">{plan.duration}</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      <span className="text-sm elegant-text">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  variant={plan.popular ? "traditional" : "outline"}
                  onClick={() => handleSelectPlan(plan.code)}
                  disabled={!user}
                >
                  {!user ? 'Login Required' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center elegant-text">
          <p className="mb-2">✓ WhatsApp Support • ✓ Instant Activation • ✓ 24/7 Help</p>
          <p className="text-sm text-muted-foreground">
            Pay via UPI → Send WhatsApp → Get activated within 1-2 hours!
          </p>
        </div>
      </div>

      {/* WhatsApp Payment Dialog */}
      {selectedPlanDetails && (
        <WhatsAppPayment
          isOpen={showWhatsAppPayment}
          onClose={() => setShowWhatsAppPayment(false)}
          planCode={selectedPlan!}
          planName={selectedPlanDetails.name}
          amount={selectedPlanDetails.price}
        />
      )}
    </div>
  );
};

export default Pricing;