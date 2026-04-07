import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  // Safaricom sends POST callbacks — no CORS needed (server-to-server)
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "No callback data" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const checkoutRequestID = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    if (resultCode === 0) {
      // Successful payment
      const items = callback.CallbackMetadata?.Item ?? [];
      const getValue = (name: string) => items.find((i: any) => i.Name === name)?.Value;

      const mpesaReceiptNumber = getValue("MpesaReceiptNumber");
      const amount = getValue("Amount");
      const phone = getValue("PhoneNumber");

      await supabase
        .from("payments")
        .update({
          status: "confirmed",
          transaction_ref: mpesaReceiptNumber || checkoutRequestID,
          phone_number: phone ? String(phone) : undefined,
          amount: amount || undefined,
          metadata: callback,
        })
        .eq("transaction_ref", checkoutRequestID);

      // If linked to an invoice, mark it as paid
      const { data: payment } = await supabase
        .from("payments")
        .select("invoice_id")
        .eq("transaction_ref", mpesaReceiptNumber || checkoutRequestID)
        .single();

      if (payment?.invoice_id) {
        await supabase.from("invoices").update({ status: "paid" }).eq("id", payment.invoice_id);
      }
    } else {
      // Failed payment
      await supabase
        .from("payments")
        .update({ status: "failed", metadata: callback })
        .eq("transaction_ref", checkoutRequestID);
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: (err as Error).message }), {
      status: 200, // Always return 200 to Safaricom
      headers: { "Content-Type": "application/json" },
    });
  }
});
