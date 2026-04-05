import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string" || phone.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid phone number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-11);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("fraud_checks")
      .select("*")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ cached: true, ...cached }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call OCS API
    const apiKey = Deno.env.get("OCS_FRAUD_CHECKER_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ocsUrl = `https://fraudchecker.ocs-api.top/api/v3?phone=${cleanPhone}&key=${apiKey}`;
    const ocsRes = await fetch(ocsUrl);
    const ocsData = await ocsRes.json();

    const record = {
      phone: cleanPhone,
      status: ocsData.status || "Unknown",
      score: ocsData.score || 0,
      total_parcel: ocsData.total_parcel || 0,
      success_parcel: ocsData.success_parcel || 0,
      cancel_parcel: ocsData.cancel_parcel || 0,
      response: ocsData.response || {},
      source: ocsData.source || "LIVE",
      checked_at: new Date().toISOString(),
    };

    // Save to DB
    const { error: insertError } = await supabase.from("fraud_checks").upsert(record, { onConflict: "phone" });
    if (insertError) console.error("Insert error:", insertError);

    return new Response(JSON.stringify({ cached: false, ...record }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fraud checker error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
