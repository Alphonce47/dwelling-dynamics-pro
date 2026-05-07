import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Provide Bearer token" }), { status: 401, headers });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
    const segments = path.split("/").filter(Boolean);

    // Routes: GET /properties, GET /tenants, GET /invoices, GET /payments
    const resource = segments[0];
    const id = segments[1];

    const allowedResources = ["properties", "tenants", "invoices", "payments", "units", "maintenance_requests", "leases"];
    if (!resource || !allowedResources.includes(resource)) {
      return new Response(JSON.stringify({
        message: "NyumbaHub API v1",
        endpoints: allowedResources.map((r) => `GET /${r}`),
      }), { status: 200, headers });
    }

    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Only GET supported via API" }), { status: 405, headers });
    }

    let query = supabase.from(resource as any).select("*");
    if (id) query = query.eq("id", id);

    // Pagination
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ data, page, limit }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers });
  }
});
