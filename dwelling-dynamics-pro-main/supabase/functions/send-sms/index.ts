import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AT_URL = "https://api.africastalking.com/version1/messaging";
const AT_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const AT_API_KEY = Deno.env.get("AT_API_KEY");
    const AT_USERNAME = Deno.env.get("AT_USERNAME");
    const AT_SENDER_ID = Deno.env.get("AT_SENDER_ID"); // optional

    if (!AT_API_KEY || !AT_USERNAME) {
      return new Response(JSON.stringify({ error: "Africa's Talking credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, message } = await req.json();
    if (!to || !message) {
      return new Response(JSON.stringify({ error: "to and message are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSandbox = AT_USERNAME === "sandbox";
    const apiUrl = isSandbox ? AT_SANDBOX_URL : AT_URL;

    const params = new URLSearchParams({
      username: AT_USERNAME,
      to,
      message,
    });
    if (AT_SENDER_ID && !isSandbox) params.set("from", AT_SENDER_ID);

    const smsRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    const smsData = await smsRes.json();

    // Log to sms_logs
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const recipients = smsData?.SMSMessageData?.Recipients ?? [];
    for (const r of recipients) {
      await supabase.from("sms_logs").insert({
        recipient_phone: r.number || to,
        message,
        status: r.status === "Success" ? "sent" : "failed",
        external_id: r.messageId || null,
        cost: r.cost ? parseFloat(r.cost.replace(/[^0-9.]/g, "")) : null,
        provider: "africastalking",
      });
    }

    return new Response(JSON.stringify(smsData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
