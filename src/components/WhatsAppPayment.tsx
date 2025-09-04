import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Copy, Upload, CheckCircle, Phone } from 'lucide-react';
import upiQRCode from '@/assets/upi-qr-code.png';

interface WhatsAppPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  planCode: string;
  planName: string;
  amount: string;
}

const WhatsAppPayment: React.FC<WhatsAppPaymentProps> = ({
  isOpen,
  onClose,
  planCode,
  planName,
  amount
}) => {
  const [step, setStep] = useState(1);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const UPI_ID = 'jayeshneo07@oksbi';
  const ADMIN_WHATSAPP = '+91 9876543210'; // Replace with actual admin WhatsApp

  const generateWhatsAppMessage = (template: string) => {
    return template
      .replace('{amount}', amount)
      .replace('{plan_name}', planName)
      .replace('{transaction_id}', transactionId)
      .replace('{end_date}', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString());
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success('UPI ID copied to clipboard');
  };

  const openWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePaymentComplete = async () => {
    if (!whatsappNumber || !transactionId) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Record purchase intent with WhatsApp details
      await supabase.from('purchase_intents' as any).insert({
        user_id: user?.id,
        plan_code: planCode,
        amount: parseInt(amount.replace('₹', '')),
        status: 'payment_submitted',
        whatsapp_number: whatsappNumber,
        transaction_id: transactionId,
        payment_screenshot: screenshot
      });

      // Send WhatsApp message to admin
      const paymentMessage = `Hi! I've completed payment for ${planName} (${amount}). 
      
WhatsApp: ${whatsappNumber}
UPI Transaction ID: ${transactionId}
Plan: ${planName}
Amount: ${amount}

Please activate my billing system. Thank you!`;
      
      openWhatsApp(paymentMessage);
      
      setStep(3);
      toast.success('Payment details submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit payment details');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setWhatsappNumber('');
    setTransactionId('');
    setScreenshot('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetForm}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center traditional-heading flex items-center justify-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-500" />
            WhatsApp Payment System
          </DialogTitle>
          <DialogDescription className="text-center elegant-text">
            Complete payment via UPI and get instant WhatsApp support
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNum ? 'bg-success text-white' : 'bg-secondary text-muted-foreground'
                }`}>
                  {step > stepNum ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-1 mx-2 ${
                    step > stepNum ? 'bg-success' : 'bg-secondary'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="space-y-4">
              <Card className="creative-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{planName} Plan - {amount}</CardTitle>
                  <CardDescription>Scan QR code or use UPI ID to pay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <img 
                        src={upiQRCode} 
                        alt="UPI QR Code" 
                        className="w-40 h-40 mx-auto"
                      />
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 p-3 bg-secondary rounded-lg mb-4">
                      <code className="font-mono text-sm">{UPI_ID}</code>
                      <Button size="sm" variant="ghost" onClick={copyUpiId}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Badge className="bg-warning text-warning-foreground">
                      Amount: {amount}
                    </Badge>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => setStep(2)}
                  >
                    I've Made the Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <Card className="creative-card">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Confirmation</CardTitle>
                  <CardDescription>
                    Provide your details for instant activation via WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-secondary border border-r-0 rounded-l-md">
                        <Phone className="h-4 w-4 mr-1" />
                        <span className="text-sm">+91</span>
                      </div>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="9876543210"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="rounded-l-none"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transaction">UPI Transaction ID *</Label>
                    <Input
                      id="transaction"
                      type="text"
                      placeholder="Enter transaction ID from payment app"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="screenshot">Payment Screenshot (Optional)</Label>
                    <Textarea
                      id="screenshot"
                      placeholder="Upload screenshot to Google Drive/Dropbox and paste link here"
                      value={screenshot}
                      onChange={(e) => setScreenshot(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-500" />
                      What happens next?
                    </h4>
                    <ul className="text-sm space-y-1 elegant-text">
                      <li>• WhatsApp message will be sent to admin</li>
                      <li>• Your plan will be activated within 1-2 hours</li>
                      <li>• You'll get confirmation via WhatsApp</li>
                      <li>• Instant support for any issues</li>
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handlePaymentComplete}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Send WhatsApp Message & Activate'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Payment Submitted!</h3>
                <p className="elegant-text mb-4">
                  WhatsApp message sent to admin. Your {planName} plan will be activated soon.
                </p>
                
                <div className="space-y-2 text-sm">
                  <p><strong>Plan:</strong> {planName}</p>
                  <p><strong>Amount:</strong> {amount}</p>
                  <p><strong>WhatsApp:</strong> +91 {whatsappNumber}</p>
                  <p><strong>Transaction ID:</strong> {transactionId}</p>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={resetForm}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppPayment;