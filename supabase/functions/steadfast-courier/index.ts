import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STEADFAST_BASE_URL = 'https://portal.steadfast.com.bd/api/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const STEADFAST_API_KEY = Deno.env.get('STEADFAST_API_KEY');
  const STEADFAST_SECRET_KEY = Deno.env.get('STEADFAST_SECRET_KEY');

  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'Steadfast API keys not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const steadfastHeaders = {
    'Api-Key': STEADFAST_API_KEY,
    'Secret-Key': STEADFAST_SECRET_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const body = await req.json();
    const { action, data } = body;

    let response: Response;

    switch (action) {
      case 'check_balance': {
        response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
          method: 'GET',
          headers: steadfastHeaders,
        });
        break;
      }

      case 'create_order': {
        response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
          method: 'POST',
          headers: steadfastHeaders,
          body: JSON.stringify({
            invoice: data.invoice,
            recipient_name: data.recipient_name,
            recipient_phone: data.recipient_phone,
            recipient_address: data.recipient_address,
            cod_amount: data.cod_amount,
            note: data.note || '',
          }),
        });
        break;
      }

      case 'check_status': {
        response = await fetch(`${STEADFAST_BASE_URL}/status_by_cid/${data.consignment_id}`, {
          method: 'GET',
          headers: steadfastHeaders,
        });
        break;
      }

      case 'check_connection': {
        response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
          method: 'GET',
          headers: steadfastHeaders,
        });
        break;
      }

      default:
        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const result = await response.json();

    return new Response(JSON.stringify({ success: response.ok, data: result, status: response.status }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
