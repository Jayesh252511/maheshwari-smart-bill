import { useState } from "react";
import Layout from "@/components/Layout";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    code: '199_1m',
    price: 199,
    duration: '1 Month',
    savings: '',
    perMonth: '₹199/month',
    popular: false,
    icon: <Check className="w-6 h-6" />,
    description: 'Perfect for trying out'
  },
  {
    code: '299_3m',
    price: 299,
    duration: '3 Months', 
    savings: 'Save ₹298!',
    perMonth: 'Just ₹100/month',
    popular: false,
    icon: <Sparkles className="w-6 h-6" />,
    description: 'Great for small shops'
  },
  {
    code: '499_8m',
    price: 499,
    duration: '8 Months',
    savings: 'Save ₹1093!', 
    perMonth: 'Only ~₹62/month',
    popular: false,
    icon: <Sparkles className="w-6 h-6" />,
    description: 'Best for growing business'
  },
  {
    code: '599_12m',
    price: 599,
    duration: '12 Months',
    savings: 'Save ₹1789!',
    perMonth: 'Just ₹50/month for full year',
    popular: true,
    icon: <Crown className="w-6 h-6 text-yellow-500" />,
    description: 'Maximum value for money'
  },
];

const Pricing = () => {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-4">Simple Pricing for Your Business</h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your business needs. No hidden charges, no auto-deductions.
            </p>
          </div>

          {/* Free Trial Banner */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center">
                <Badge className="mb-3 bg-blue-100 text-blue-800">FREE TRIAL</Badge>
                <h3 className="text-xl font-semibold mb-2">Start with 7 Days Free</h3>
                <p className="text-muted-foreground">
                  Get 30 bill actions (create or update bills) absolutely free. 
                  No credit card required to start.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {plans.map((plan) => (
              <Card 
                key={plan.code}
                className={`relative transition-all hover:shadow-xl hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1">
                    Best Value 💥
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-3xl font-bold">₹{plan.price}</CardTitle>
                  <p className="text-muted-foreground font-medium">{plan.duration}</p>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-primary">{plan.perMonth}</p>
                    {plan.savings && (
                      <p className="text-sm text-green-600 font-medium">{plan.savings}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Unlimited bill creation</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Customer & item management</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Print receipts via Bluetooth</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Export bills as PDF</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>Sales reports & analytics</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowUpgrade(true)}
                    className={`w-full text-sm ${
                      plan.popular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-secondary hover:bg-secondary/90'
                    }`}
                    size="lg"
                  >
                    Choose Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Why Choose Our Billing System?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">No Hidden Charges</h4>
                  <p className="text-sm text-muted-foreground">
                    What you see is what you pay. No surprise deductions or extra fees.
                  </p>
                </div>
                <div>
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">No Auto-Deductions</h4>
                  <p className="text-sm text-muted-foreground">
                    Your plan stops when it ends. Renew only when you want to continue.
                  </p>
                </div>
                <div>
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Made for India</h4>
                  <p className="text-sm text-muted-foreground">
                    Simple UPI payments, Hindi support, and features designed for Indian businesses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </Layout>
  );
};

export default Pricing;