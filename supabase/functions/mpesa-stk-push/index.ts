import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DARAJA_BASE = "https://sandbox.safaricom.co.ke"; // switch to api.safaricom.co.ke for prod

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY");
    const CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET");
    const PASSKEY = Deno.env.get("MPESA_PASSKEY");
    const SHORTCODE = Deno.env.get("MPESA_SHORTCODE");
    const CALLBACK_URL = Deno.env.get("MPESA_CALLBACK_URL");

    if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY || !SHORTCODE) {
      return new Response(JSON.stringify({ error: "M-Pesa credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth token
    const authRes = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)}` },
    });
    const authData = await authRes.json();
    if (!authRes.ok) {
      return new Response(JSON.stringify({ error: "Daraja auth failed", details: authData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const accessToken = authData.access_token;

    const { phone_number, amount, invoice_id, tenant_id } = await req.json();
    if (!phone_number || !amount || !tenant_id) {
      return new Response(JSON.stringify({ error: "phone_number, amount, tenant_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone: 07xxx → 2547xxx
    const phone = phone_number.replace(/^0/, "254").replace(/^\+/, "");

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);

    const callbackUrl = CALLBACK_URL || `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`;

    const stkRes = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: invoice_id || tenant_id.slice(0, 12),
        TransactionDesc: "Rent Payment via NyumbaHub",
      }),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === "0") {
      // Record pending payment
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.from("payments").insert({
        tenant_id,
        amount: Math.round(amount),
        method: "mpesa",
        status: "pending",
        phone_number: phone,
        invoice_id: invoice_id || null,
        transaction_ref: stkData.CheckoutRequestID,
        metadata: stkData,
      });
    }

    return new Response(JSON.stringify(stkData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
