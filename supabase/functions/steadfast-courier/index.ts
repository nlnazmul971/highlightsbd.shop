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
    console.error('Missing keys - API_KEY:', !!STEADFAST_API_KEY, 'SECRET_KEY:', !!STEADFAST_SECRET_KEY);
    return new Response(JSON.stringify({ success: false, error: 'Steadfast API keys not configured' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const steadfastHeaders: Record<string, string> = {
    'Api-Key': STEADFAST_API_KEY,
    'Secret-Key': STEADFAST_SECRET_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const body = await req.json();
    const { action, data } = body;

    let url = '';
    let method = 'GET';
    let fetchBody: string | undefined;

    switch (action) {
      case 'check_connection':
      case 'check_balance':
        url = `${STEADFAST_BASE_URL}/get_balance`;
        break;
      case 'create_order':
        url = `${STEADFAST_BASE_URL}/create_order`;
        method = 'POST';
        fetchBody = JSON.stringify({
          invoice: data.invoice,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          recipient_address: data.recipient_address,
          cod_amount: data.cod_amount,
          note: data.note || '',
        });
        break;
      case 'check_status':
        url = `${STEADFAST_BASE_URL}/status_by_cid/${data.consignment_id}`;
        break;
      default:
        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`Calling Steadfast API: ${method} ${url}`);

    const fetchOptions: RequestInit = { method, headers: steadfastHeaders };
    if (fetchBody) fetchOptions.body = fetchBody;

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();

    console.log(`Steadfast response status: ${response.status}, body preview: ${responseText.substring(0, 200)}`);

    // Try to parse as JSON, handle HTML error pages
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      // API returned non-JSON (HTML error page)
      return new Response(JSON.stringify({
        success: false,
        error: response.ok
          ? 'Unexpected response format from Steadfast API'
          : `Steadfast API returned ${response.status}. Please verify your API Key and Secret Key are correct.`,
        status: response.status,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: response.ok, data: result, status: response.status }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge function error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
