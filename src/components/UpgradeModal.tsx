import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    code: '199_1m',
    price: 199,
    duration: '1 Month',
    savings: '',
    perMonth: '₹199/month',
    popular: false,
    icon: <Check className="w-5 h-5" />
  },
  {
    code: '299_3m',
    price: 299,
    duration: '3 Months',
    savings: 'Save ₹298!',
    perMonth: 'Just ₹100/month',
    popular: false,
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    code: '499_8m',
    price: 499,
    duration: '8 Months',
    savings: 'Save ₹1093!',
    perMonth: 'Only ~₹62/month',
    popular: false,
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    code: '599_12m',
    price: 599,
    duration: '12 Months',
    savings: 'Save ₹1789!',
    perMonth: 'Just ₹50/month for full year',
    popular: true,
    icon: <Crown className="w-5 h-5 text-yellow-500" />
  },
];

export const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handlePlanSelect = (planCode: string) => {
    setSelectedPlan(planCode);
    setShowPayment(true);
  };

  const handlePaymentConfirm = async () => {
    if (!user || !selectedPlan) return;

    const plan = plans.find(p => p.code === selectedPlan);
    if (!plan) return;

    try {
      // Get user profile for business name
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('user_id', user.id)
        .single();

      // Create purchase intent
      await supabase.from('purchase_intents').insert({
        user_id: user.id,
        business_name: profile?.business_name || 'Unknown Business',
        email: user.email,
        plan_code: selectedPlan,
        amount: plan.price,
        device_info: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });

      // Create WhatsApp message
      const message = encodeURIComponent(
        `🏪 *New Plan Purchase Request*\n\n` +
        `📧 Email: ${user.email}\n` +
        `🏢 Business: ${profile?.business_name || 'Unknown Business'}\n` +
        `🆔 User ID: ${user.id}\n` +
        `📦 Plan: ${plan.duration} - ₹${plan.price}\n` +
        `⏰ Time: ${new Date().toLocaleString('en-IN')}\n` +
        `📱 Device: ${navigator.userAgent.split(' ')[0]}\n\n` +
        `✅ *Payment completed via UPI*\n` +
        `Please activate my plan. Thank you! 🙏`
      );

      // Open WhatsApp
      window.open(`https://wa.me/918605601801?text=${message}`, '_blank');

      toast({
        title: "Payment Request Sent",
        description: "WhatsApp opened. Send the message to complete activation.",
      });

      onOpenChange(false);
      setShowPayment(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error creating purchase intent:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase request. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (showPayment && selectedPlan) {
    const plan = plans.find(p => p.code === selectedPlan);
    const upiUrl = `upi://pay?pa=YOUR_UPI_ID@upi&pn=MaheshwariAgency&am=${plan?.price}&cu=INR`;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {plan?.duration} - ₹{plan?.price}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Scan UPI QR Code</p>
                  <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300">
                    <p className="text-xs text-muted-foreground">QR Code would appear here</p>
                    <p className="text-xs mt-2 font-mono">{upiUrl}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>✅ No hidden charges</p>
                  <p>✅ No auto-deductions</p>
                  <p>✅ Billing stops when plan ends</p>
                </div>
                <Button 
                  onClick={handlePaymentConfirm}
                  className="w-full"
                  size="lg"
                >
                  I've Paid - Confirm & Activate
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPayment(false)}
                  className="w-full"
                >
                  Back to Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Choose Your Plan</DialogTitle>
          <p className="text-center text-muted-foreground">
            Upgrade to continue creating bills. Simple pricing, no hidden charges.
          </p>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card 
              key={plan.code}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handlePlanSelect(plan.code)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  Best Value 💥
                </Badge>
              )}
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-2">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl">₹{plan.price}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.duration}</p>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <p className="font-semibold text-primary">{plan.perMonth}</p>
                {plan.savings && (
                  <p className="text-sm text-green-600">{plan.savings}</p>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✅ Unlimited bills</p>
                  <p>✅ All features</p>
                  <p>✅ Print & export</p>
                </div>
                <Button 
                  className="w-full mt-4"
                  variant={plan.popular ? "default" : "outline"}
                >
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>💳 Pay securely via UPI • 📱 WhatsApp confirmation • ⚡ Instant activation</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};