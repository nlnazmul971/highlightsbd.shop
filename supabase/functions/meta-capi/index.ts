import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const META_GRAPH_URL = 'https://graph.facebook.com/v18.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get tracking settings from DB
    const { data: settings } = await supabase
      .from('tracking_settings')
      .select('key, value');

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

    const pixelId = settingsMap['meta_pixel_id'];
    const accessToken = settingsMap['meta_capi_access_token'];

    if (action === 'check_connection') {
      if (!pixelId || !accessToken) {
        return new Response(JSON.stringify({ success: false, error: 'Meta Pixel ID or CAPI Access Token not configured' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Test connection by calling the pixel endpoint
      const response = await fetch(`${META_GRAPH_URL}/${pixelId}?access_token=${accessToken}`);
      const responseText = await response.text();
      let result;
      try { result = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Non-JSON response from Meta API' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: !result.error, data: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send_event') {
      if (!pixelId || !accessToken) {
        return new Response(JSON.stringify({ success: false, error: 'Meta credentials not configured' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const response = await fetch(`${META_GRAPH_URL}/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data.events }),
      });
      const responseText = await response.text();
      let result;
      try { result = JSON.parse(responseText); } catch {
        return new Response(JSON.stringify({ success: false, error: 'Non-JSON response' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: response.ok, data: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Meta CAPI error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
