import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, type, userId } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    console.log(`Processing AI chat request - Type: ${type}, User: ${userId}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let systemPrompt = '';
    let contextData = '';

    // Get user's business context if available
    if (userId) {
      // Fetch recent bills for context
      const { data: bills } = await supabase
        .from('bills')
        .select(`
          total_amount,
          created_at,
          customer:customers(name),
          bill_items(
            quantity,
            unit_price,
            item:items(name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch items for inventory context
      const { data: items } = await supabase
        .from('items')
        .select('name, price, description')
        .eq('user_id', userId);

      // Fetch customers for customer context
      const { data: customers } = await supabase
        .from('customers')
        .select('name, phone, address')
        .eq('user_id', userId);

      contextData = `
Business Context:
- Recent Bills: ${JSON.stringify(bills?.slice(0, 5) || [])}
- Available Items: ${JSON.stringify(items || [])}
- Customers: ${JSON.stringify(customers || [])}
      `;
    }

    switch (type) {
      case 'voice_billing':
        systemPrompt = `You are an AI assistant for a point-of-sale system. Parse voice commands to extract billing information.

Extract from the user's voice command:
- Items to add (name and quantity)
- Customer information if mentioned
- Any special instructions

Context about available items and customers:
${contextData}

Respond in JSON format ONLY:
{
  "action": "add_items" | "select_customer" | "unclear",
  "items": [{"name": "item_name", "quantity": number}],
  "customer": "customer_name_if_mentioned",
  "response": "helpful_confirmation_message"
}

Examples:
- "Add 5 apples" → {"action": "add_items", "items": [{"name": "apples", "quantity": 5}], "response": "Added 5 apples to the bill"}
- "Add 3 coffees for John" → {"action": "add_items", "items": [{"name": "coffee", "quantity": 3}], "customer": "John", "response": "Added 3 coffees for customer John"}`;
        break;

      case 'business_insights':
        systemPrompt = `You are an AI business analyst for a point-of-sale system. Analyze the provided business data and give actionable insights.

Business Data:
${contextData}

Provide insights about:
- Sales trends and patterns
- Top performing items
- Customer behavior
- Revenue optimization suggestions
- Inventory recommendations

Be specific, actionable, and data-driven. Use the actual data provided to make recommendations.`;
        break;

      case 'customer_support':
        systemPrompt = `You are a helpful AI assistant for a point-of-sale system. Help users with:
- How to use the billing system
- Troubleshooting common issues
- Feature explanations
- Best practices for retail management

Available features in this POS system:
- Create bills and add items
- Manage customers and inventory
- Generate reports and analytics
- Print receipts via Bluetooth
- Export bills as PDF

Be friendly, helpful, and provide step-by-step guidance when needed.`;
        break;

      default:
        systemPrompt = `You are a helpful AI assistant for a point-of-sale system. Assist the user with their query about billing, inventory, customers, or general POS operations.`;
    }

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response:', aiResponse);

    // Try to parse as JSON for voice_billing, otherwise return as text
    let parsedResponse;
    if (type === 'voice_billing') {
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch {
        parsedResponse = {
          action: 'unclear',
          response: aiResponse
        };
      }
    } else {
      parsedResponse = { response: aiResponse };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});