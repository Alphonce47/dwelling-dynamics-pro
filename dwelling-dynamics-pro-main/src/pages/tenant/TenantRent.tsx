import { useState } from "react";
import { useTenantRecord, useMyInvoices, useMyPayments } from "@/hooks/useTenantRecord";
import { Receipt, CheckCircle2, Clock, AlertCircle, Smartphone, Download, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-0",
  paid: "bg-success/10 text-success border-0",
  overdue: "bg-destructive/10 text-destructive border-0",
  cancelled: "bg-muted text-muted-foreground border-0",
  partial: "bg-info/10 text-info border-0",
};

const methodLabels: Record<string, string> = {
  mpesa: "M-Pesa",
  bank_equity: "Equity Bank",
  bank_kcb: "KCB Bank",
  bank_coop: "Co-op Bank",
  cash: "Cash",
  international_transfer: "Intl Transfer",
};

type Invoice = { id: string; invoice_number: string; amount: number; due_date: string; status: string; notes: string | null };
type Payment = { id: string; amount: number; payment_date: string; method: string; transaction_ref: string | null; status: string };

export default function TenantRent() {
  const { data: tenant } = useTenantRecord();
  const { data: invoices, isLoading: loadingInvoices, refetch: refetchInvoices } = useMyInvoices(tenant?.id);
  const { data: payments, isLoading: loadingPayments, refetch: refetchPayments } = useMyPayments(tenant?.id);

  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [stkSent, setStkSent] = useState(false);

  const outstanding = invoices?.filter((i) => i.status === "pending" || i.status === "overdue") ?? [];
  const totalDue = outstanding.reduce((a, i) => a + Number(i.amount), 0);
  const totalPaid = (payments ?? []).filter((p) => p.status === "confirmed").reduce((a, p) => a + Number(p.amount), 0);

  const handlePayNow = (inv: Invoice) => {
    setPayInvoice(inv);
    setPhone(tenant?.phone ?? "");
    setStkSent(false);
  };

  const handleStkPush = async () => {
    if (!payInvoice || !tenant) return;
    const phoneNum = phone.trim();
    if (!phoneNum) return toast.error("Enter your M-Pesa phone number");
    if (!/^(07|01|\+2547|\+2541|2547|2541)\d{7,8}$/.test(phoneNum.replace(/\s/g, ""))) {
      return toast.error("Enter a valid Kenyan phone number (e.g. 0712345678)");
    }

    setPaying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(`${supabaseUrl}/functions/v1/mpesa-stk-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          phone_number: phoneNum,
          amount: Number(payInvoice.amount),
          invoice_id: payInvoice.id,
          tenant_id: tenant.id,
        }),
      });

      const result = await res.json();

      if (result.ResponseCode === "0") {
        setStkSent(true);
        toast.success("M-Pesa request sent! Check your phone and enter your PIN.");
        setTimeout(() => {
          refetchInvoices();
          refetchPayments();
        }, 10000);
      } else if (result.error === "M-Pesa credentials not configured") {
        toast.error("M-Pesa is not configured. Please contact your landlord to pay manually.");
      } else {
        toast.error(result.errorMessage ?? result.error ?? "M-Pesa request failed. Try again.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send M-Pesa request");
    } finally {
      setPaying(false);
    }
  };

  const generateReceiptHtml = (payment: Payment) => {
    const unit = (tenant as any)?.unit;
    const property = unit?.property;
    const payDate = new Date(payment.payment_date).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; padding: 48px; max-width: 560px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #2D8B5E; padding-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 800; color: #2D8B5E; }
    .receipt-title { font-size: 20px; font-weight: 700; margin-top: 8px; color: #1a1a2e; text-transform: uppercase; letter-spacing: 2px; }
    .amount-box { background: #f0fdf4; border: 2px solid #2D8B5E; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .amount-label { font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 1px; }
    .amount { font-size: 36px; font-weight: 800; color: #2D8B5E; margin-top: 4px; }
    .details { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .details td { padding: 10px 0; font-size: 14px; border-bottom: 1px solid #eee; }
    .details td:first-child { color: #888; width: 45%; }
    .details td:last-child { font-weight: 600; text-align: right; }
    .status { display: inline-block; padding: 3px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #d4edda; color: #155724; }
    .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">NyumbaHub</div>
    <div class="receipt-title">Payment Receipt</div>
  </div>
  <div class="amount-box">
    <div class="amount-label">Amount Paid</div>
    <div class="amount">KES ${Number(payment.amount).toLocaleString("en-KE")}</div>
    <div style="margin-top:8px"><span class="status">Confirmed</span></div>
  </div>
  <table class="details">
    <tr><td>Tenant</td><td>${tenant?.full_name ?? "—"}</td></tr>
    <tr><td>Property</td><td>${property?.name ?? "—"}</td></tr>
    <tr><td>Unit</td><td>Unit ${unit?.unit_number ?? "—"}</td></tr>
    <tr><td>Payment Method</td><td>${methodLabels[payment.method] ?? payment.method}</td></tr>
    ${payment.transaction_ref ? `<tr><td>Reference</td><td style="font-family:monospace;font-size:12px">${payment.transaction_ref}</td></tr>` : ""}
    <tr><td>Date</td><td>${payDate}</td></tr>
  </table>
  <div class="footer">
    <p>Thank you for your payment.</p>
    <p style="margin-top:6px">Generated by NyumbaHub &mdash; ${new Date().toLocaleDateString("en-KE")}</p>
  </div>
  <script>window.addEventListener('load',function(){window.print();});</script>
</body>
</html>`;
  };

  const handleDownloadReceipt = (payment: Payment) => {
    if (payment.status !== "confirmed") return toast.error("Only confirmed payments have receipts");
    const html = generateReceiptHtml(payment);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) toast.info("Allow pop-ups to download the receipt");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast.success("Receipt ready — saving as PDF…");
  };

  if (loadingInvoices || loadingPayments) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">My Rent</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your invoices and payment history</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-warning" /> Outstanding
          </div>
          <div className="mt-2 font-heading text-2xl font-bold text-warning">KES {totalDue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{outstanding.length} unpaid invoice{outstanding.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" /> Total Paid
          </div>
          <div className="mt-2 font-heading text-2xl font-bold text-success">KES {totalPaid.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{(payments ?? []).filter((p) => p.status === "confirmed").length} confirmed payments</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" /> All Invoices
          </div>
          <div className="mt-2 font-heading text-2xl font-bold text-card-foreground">{invoices?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground">Total issued</div>
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Invoices</h2>
        {!invoices?.length ? (
          <div className="stat-card flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-card-foreground">No invoices yet</p>
            <p className="text-sm text-muted-foreground">Your landlord hasn't issued any invoices</p>
          </div>
        ) : (
          <div className="stat-card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Notes</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-card-foreground">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-right font-medium text-card-foreground">KES {Number(inv.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className={`${statusColors[inv.status] ?? ""} capitalize`}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{inv.notes ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      {(inv.status === "pending" || inv.status === "overdue") && (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handlePayNow(inv as Invoice)}
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          Pay via M-Pesa
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Payment History</h2>
        {!payments?.length ? (
          <div className="stat-card flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-card-foreground">No payments recorded yet</p>
          </div>
        ) : (
          <div className="stat-card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Method</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Reference</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-success">KES {Number(p.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">{methodLabels[p.method] ?? p.method}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p.transaction_ref ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${p.status === "confirmed" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDownloadReceipt(p as Payment)}
                          title="Download receipt"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Receipt
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Now Dialog */}
      <Dialog open={!!payInvoice} onOpenChange={(open) => { if (!open) { setPayInvoice(null); setStkSent(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Pay via M-Pesa
            </DialogTitle>
          </DialogHeader>

          {payInvoice && (
            <div className="space-y-5">
              {/* Invoice summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-medium">{payInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span className="font-bold text-lg text-foreground">KES {Number(payInvoice.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className={payInvoice.status === "overdue" ? "text-destructive font-medium" : ""}>{new Date(payInvoice.due_date).toLocaleDateString()}</span>
                </div>
              </div>

              {stkSent ? (
                <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-center space-y-2">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
                  <p className="font-semibold text-success">M-Pesa request sent!</p>
                  <p className="text-sm text-muted-foreground">Check your phone at <strong>{phone}</strong> and enter your M-Pesa PIN to complete payment.</p>
                  <p className="text-xs text-muted-foreground mt-2">Your payment status will update automatically once confirmed.</p>
                  <Button variant="outline" className="w-full mt-3" onClick={() => { setPayInvoice(null); setStkSent(false); }}>
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">M-Pesa Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Enter the phone number registered with M-Pesa. You'll receive a push notification to enter your PIN.</p>
                  </div>

                  <Button
                    className="w-full gap-2"
                    onClick={handleStkPush}
                    disabled={paying}
                    size="lg"
                  >
                    <Smartphone className="h-4 w-4" />
                    {paying ? "Sending M-Pesa Request…" : `Pay KES ${Number(payInvoice.amount).toLocaleString()} via M-Pesa`}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Having trouble? Contact your landlord to record your payment manually.
                  </p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
