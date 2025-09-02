import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Crown, Star, Zap, Copy } from 'lucide-react';
import upiQRCode from '@/assets/upi-qr-code.png';

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
  const [showPayment, setShowPayment] = useState(false);
  const { user } = useAuth();
  const UPI_ID = 'jayeshneo07@oksbi';

  const handleSelectPlan = async (planCode: string) => {
    if (!user) {
      toast.error('Please login to select a plan');
      return;
    }

    setSelectedPlan(planCode);
    
    // Record purchase intent
    try {
      const plan = plans.find(p => p.code === planCode);
      const amount = parseInt(plan?.price.replace('₹', '') || '0');
      
      await supabase.from('purchase_intents' as any).insert({
        user_id: user.id,
        plan_code: planCode,
        amount: amount,
        status: 'pending'
      });
      
      setShowPayment(true);
      toast.success('Plan selected! Please complete payment.');
    } catch (error) {
      toast.error('Failed to process request');
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
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
          <p className="mb-2">✓ Secure UPI Payment • ✓ Instant Activation • ✓ 24/7 Support</p>
          <p className="text-sm text-muted-foreground">
            Note: After payment, contact admin for plan activation
          </p>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center traditional-heading">
              Complete Payment
            </DialogTitle>
            <DialogDescription className="text-center elegant-text">
              Pay {selectedPlanDetails?.price} for {selectedPlanDetails?.name} plan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img 
                  src={upiQRCode} 
                  alt="UPI QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm elegant-text mb-2">Scan QR code or use UPI ID:</p>
              
              <div className="flex items-center justify-center gap-2 p-3 bg-secondary rounded-lg">
                <code className="font-mono text-sm">{UPI_ID}</code>
                <Button size="sm" variant="ghost" onClick={copyUpiId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Payment Instructions:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside elegant-text">
                  <li>Pay {selectedPlanDetails?.price} to UPI ID: <strong>{UPI_ID}</strong></li>
                  <li>Take screenshot of successful payment</li>
                  <li>Contact admin for plan activation</li>
                  <li>Your plan will be activated within 24 hours</li>
                </ol>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => {
                  setShowPayment(false);
                  toast.success('Payment initiated! Contact admin for activation.');
                }}
              >
                I've Made the Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;