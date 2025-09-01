import React from 'react';
import AIChat from './AIChat';

const AICustomerSupport: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Customer Support</h1>
        <p className="text-muted-foreground">
          Get instant help with your POS system questions and issues
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <AIChat mode="support" className="w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Getting Started</h3>
          <p className="text-sm text-muted-foreground">
            Learn the basics of using the POS system, from creating your first bill to managing inventory.
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Troubleshooting</h3>
          <p className="text-sm text-muted-foreground">
            Common issues and their solutions, including printer connectivity and data sync problems.
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Advanced Features</h3>
          <p className="text-sm text-muted-foreground">
            Discover advanced features like voice billing, AI insights, and automated reporting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AICustomerSupport;