import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

async function verifyAdmin(req: Request): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing authorization header' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { authorized: false, error: 'Invalid token' };
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleData) {
    return { authorized: false, error: 'Forbidden: admin role required' };
  }

  return { authorized: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify admin role
  const auth = await verifyAdmin(req);
  if (!auth.authorized) {
    return new Response(JSON.stringify({ success: false, error: auth.error }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const STEADFAST_API_KEY = Deno.env.get('STEADFAST_API_KEY');
  const STEADFAST_SECRET_KEY = Deno.env.get('STEADFAST_SECRET_KEY');

  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
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
          item_description: data.item_description || '',
          delivery_type: data.delivery_type ?? 0,
        });
        break;

      case 'bulk_create_order':
        url = `${STEADFAST_BASE_URL}/create_order/bulk-order`;
        method = 'POST';
        fetchBody = JSON.stringify({ data: data.orders });
        break;

      case 'check_status':
        url = `${STEADFAST_BASE_URL}/status_by_cid/${data.consignment_id}`;
        break;

      case 'status_by_invoice':
        url = `${STEADFAST_BASE_URL}/status_by_invoice/${data.invoice}`;
        break;

      case 'status_by_tracking':
        url = `${STEADFAST_BASE_URL}/status_by_trackingcode/${data.tracking_code}`;
        break;

      case 'create_return_request':
        url = `${STEADFAST_BASE_URL}/create_return_request`;
        method = 'POST';
        fetchBody = JSON.stringify({
          consignment_id: data.consignment_id,
          reason: data.reason || '',
        });
        break;

      case 'get_return_request':
        url = `${STEADFAST_BASE_URL}/get_return_request/${data.id}`;
        break;

      case 'get_return_requests':
        url = `${STEADFAST_BASE_URL}/get_return_requests`;
        break;

      case 'get_payments':
        url = `${STEADFAST_BASE_URL}/payments`;
        break;

      case 'get_payment':
        url = `${STEADFAST_BASE_URL}/payments/${data.payment_id}`;
        break;

      case 'get_police_stations':
        url = `${STEADFAST_BASE_URL}/police_stations`;
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

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
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
