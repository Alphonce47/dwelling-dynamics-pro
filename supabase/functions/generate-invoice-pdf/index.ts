import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`*, tenant:tenants(full_name, email, phone, unit:units(unit_number, property:properties(name, address, city)))`)
      .eq("id", invoice_id)
      .single();

    if (error || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tenant = invoice.tenant as any;
    const property = tenant?.unit?.property;
    const dueDate = new Date(invoice.due_date).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
    const createdDate = new Date(invoice.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });

    // Generate a simple HTML invoice that can be printed/saved as PDF
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2D8B5E; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 800; color: #2D8B5E; }
    .brand-sub { font-size: 12px; color: #666; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 32px; color: #2D8B5E; text-transform: uppercase; letter-spacing: 2px; }
    .invoice-number { font-size: 14px; color: #666; margin-top: 4px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .meta-block h4 { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 6px; }
    .meta-block p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    thead th { background: #2D8B5E; color: white; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    tbody td { padding: 14px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
    .amount-col { text-align: right; }
    .total-row { border-top: 2px solid #2D8B5E; }
    .total-row td { font-weight: 700; font-size: 18px; padding-top: 16px; }
    .status { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-overdue { background: #f8d7da; color: #721c24; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
    .notes { margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #555; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">NyumbaHub</div>
      <div class="brand-sub">Property Management Platform</div>
    </div>
    <div class="invoice-title">
      <h2>Invoice</h2>
      <div class="invoice-number">${invoice.invoice_number}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h4>Bill To</h4>
      <p><strong>${tenant?.full_name ?? "—"}</strong></p>
      <p>${tenant?.email ?? ""}</p>
      <p>${tenant?.phone ?? ""}</p>
    </div>
    <div class="meta-block">
      <h4>Property</h4>
      <p><strong>${property?.name ?? "—"}</strong></p>
      <p>Unit ${tenant?.unit?.unit_number ?? "—"}</p>
      <p>${property?.address ?? ""}, ${property?.city ?? ""}</p>
    </div>
    <div class="meta-block" style="text-align:right">
      <h4>Date Issued</h4>
      <p>${createdDate}</p>
      <h4 style="margin-top:12px">Due Date</h4>
      <p><strong>${dueDate}</strong></p>
      <h4 style="margin-top:12px">Status</h4>
      <p><span class="status status-${invoice.status}">${invoice.status}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount-col">Amount (${invoice.currency})</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.notes || "Monthly Rent"}</td>
        <td class="amount-col">${Number(invoice.amount).toLocaleString("en-KE")}</td>
      </tr>
      <tr class="total-row">
        <td>Total</td>
        <td class="amount-col">${invoice.currency} ${Number(invoice.amount).toLocaleString("en-KE")}</td>
      </tr>
    </tbody>
  </table>

  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}

  <div class="footer">
    <p>Thank you for your prompt payment. For questions, contact your property manager.</p>
    <p style="margin-top:8px">Generated by NyumbaHub &mdash; ${new Date().toLocaleDateString("en-KE")}</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
