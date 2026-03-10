import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // Check admin role
    const { data: hasRole } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'products';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: corsHeaders });
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')!;
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!;

    // Generate signature
    const timestamp = Math.round(Date.now() / 1000).toString();
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Upload to Cloudinary
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('api_key', apiKey);
    uploadForm.append('timestamp', timestamp);
    uploadForm.append('signature', signature);
    uploadForm.append('folder', folder);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: uploadForm }
    );

    const result = await cloudinaryRes.json();

    if (!cloudinaryRes.ok) {
      return new Response(JSON.stringify({ error: result.error?.message || 'Upload failed' }), {
        status: 400, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ url: result.secure_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
