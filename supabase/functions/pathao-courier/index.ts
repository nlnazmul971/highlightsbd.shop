import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PATHAO_BASE_URL = 'https://api-hermes.pathao.com';

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('PATHAO_CLIENT_ID'),
      client_secret: Deno.env.get('PATHAO_CLIENT_SECRET'),
      username: Deno.env.get('PATHAO_USERNAME'),
      password: Deno.env.get('PATHAO_PASSWORD'),
      grant_type: 'password',
    }),
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Pathao auth returned non-JSON (status ${response.status})`);
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.message || `Authentication failed (status ${response.status})`);
  }

  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientId = Deno.env.get('PATHAO_CLIENT_ID');
  const clientSecret = Deno.env.get('PATHAO_CLIENT_SECRET');
  const username = Deno.env.get('PATHAO_USERNAME');
  const password = Deno.env.get('PATHAO_PASSWORD');

  if (!clientId || !clientSecret || !username || !password) {
    return new Response(JSON.stringify({ success: false, error: 'Pathao API credentials not configured' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    // For check_connection, just try to get a token
    if (action === 'check_connection') {
      try {
        const token = await getAccessToken();
        return new Response(JSON.stringify({ success: true, data: { message: 'Connected successfully', has_token: !!token } }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return new Response(JSON.stringify({ success: false, error: msg }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const token = await getAccessToken();
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    let url = '';
    let method = 'GET';
    let fetchBody: string | undefined;

    switch (action) {
      case 'get_cities':
        url = `${PATHAO_BASE_URL}/aladdin/api/v1/countries/1/city-list`;
        break;
      case 'get_zones':
        url = `${PATHAO_BASE_URL}/aladdin/api/v1/cities/${data.city_id}/zone-list`;
        break;
      case 'get_areas':
        url = `${PATHAO_BASE_URL}/aladdin/api/v1/zones/${data.zone_id}/area-list`;
        break;
      case 'create_order':
        url = `${PATHAO_BASE_URL}/aladdin/api/v1/orders`;
        method = 'POST';
        fetchBody = JSON.stringify(data);
        break;
      case 'view_order':
        url = `${PATHAO_BASE_URL}/aladdin/api/v1/orders/${data.consignment_id}`;
        break;
      default:
        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`Calling Pathao API: ${method} ${url}`);
    const fetchOptions: RequestInit = { method, headers: authHeaders };
    if (fetchBody) fetchOptions.body = fetchBody;

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    console.log(`Pathao response status: ${response.status}, preview: ${responseText.substring(0, 200)}`);

    let result;
    try { result = JSON.parse(responseText); } catch {
      return new Response(JSON.stringify({
        success: false,
        error: `Pathao API returned non-JSON (status ${response.status})`,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
