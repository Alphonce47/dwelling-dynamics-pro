import { useState, useMemo } from "react";
import { CreditCard, Download, Plus, Search, Filter, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayments, useRecordPayment } from "@/hooks/usePayments";
import { useTenants } from "@/hooks/useTenants";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const methodLabels: Record<string, string> = {
  mpesa: "M-Pesa",
  bank_equity: "Equity Bank",
  bank_kcb: "KCB Bank",
  bank_coop: "Co-op Bank",
  cash: "Cash",
  international_transfer: "Intl Transfer",
};

const methodColors: Record<string, string> = {
  mpesa: "bg-success/10 text-success",
  bank_equity: "bg-info/10 text-info",
  bank_kcb: "bg-info/10 text-info",
  bank_coop: "bg-info/10 text-info",
  cash: "bg-muted text-muted-foreground",
  international_transfer: "bg-primary/10 text-primary",
};

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-destructive/10 text-destructive",
  reversed: "bg-muted text-muted-foreground",
};

const defaultForm = { tenant_id: "", invoice_id: "", amount: "", method: "mpesa", transaction_ref: "", phone_number: "" };

function generateReceiptHtml(payment: any) {
  const tenant = payment.tenant as any;
  const property = tenant?.unit?.property;
  const date = new Date(payment.payment_date).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 600px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #2D8B5E; padding-bottom: 20px; }
    .brand { font-size: 24px; font-weight: 800; color: #2D8B5E; }
    .receipt-label { text-align: right; }
    .receipt-label h2 { font-size: 22px; color: #2D8B5E; text-transform: uppercase; letter-spacing: 2px; }
    .receipt-label .ref { font-size: 12px; color: #666; margin-top: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .meta-block h4 { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 6px; }
    .meta-block p { font-size: 14px; line-height: 1.6; }
    .amount-box { background: #f0f9f4; border: 2px solid #2D8B5E; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .amount-box .label { font-size: 12px; text-transform: uppercase; color: #2D8B5E; letter-spacing: 1px; }
    .amount-box .value { font-size: 36px; font-weight: 800; color: #1a1a2e; margin-top: 4px; }
    .details { border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row .key { color: #666; }
    .detail-row .val { font-weight: 500; }
    .status-paid { display: inline-block; background: #d4edda; color: #155724; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">NyumbaHub</div>
      <div style="font-size:12px;color:#666;margin-top:4px">Property Management Platform</div>
    </div>
    <div class="receipt-label">
      <h2>Receipt</h2>
      <div class="ref">${payment.transaction_ref ?? payment.id.slice(0, 8).toUpperCase()}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h4>Received From</h4>
      <p><strong>${tenant?.full_name ?? "—"}</strong></p>
      <p>${tenant?.phone ?? ""}</p>
    </div>
    <div class="meta-block" style="text-align:right">
      <h4>Property / Unit</h4>
      <p><strong>${property?.name ?? "—"}</strong></p>
      <p>Unit ${tenant?.unit?.unit_number ?? "—"}</p>
      <h4 style="margin-top:10px">Date</h4>
      <p>${date}</p>
    </div>
  </div>

  <div class="amount-box">
    <div class="label">Amount Received</div>
    <div class="value">KES ${Number(payment.amount).toLocaleString("en-KE")}</div>
  </div>

  <div class="details">
    <div class="detail-row"><span class="key">Payment Method</span><span class="val">${methodLabels[payment.method] ?? payment.method}</span></div>
    <div class="detail-row"><span class="key">Transaction Ref</span><span class="val">${payment.transaction_ref ?? "—"}</span></div>
    <div class="detail-row"><span class="key">Status</span><span class="val"><span class="status-paid">${payment.status}</span></span></div>
    ${payment.phone_number ? `<div class="detail-row"><span class="key">Phone</span><span class="val">${payment.phone_number}</span></div>` : ""}
  </div>

  <div class="footer">
    <p>Thank you for your payment. This is an official receipt from NyumbaHub.</p>
    <p style="margin-top:6px">Generated on ${new Date().toLocaleDateString("en-KE")} — NyumbaHub Property Management</p>
  </div>
</body>
</html>`;
}

export default function Payments() {
  const { data: payments, isLoading } = usePayments();
  const { data: tenants } = useTenants();
  const { data: invoices } = useInvoices();
  const recordPayment = useRecordPayment();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const tenantInvoices = invoices?.filter(
    (inv) => inv.tenant_id === form.tenant_id && (inv.status === "pending" || inv.status === "overdue")
  ) ?? [];

  const filtered = useMemo(() => {
    let list = payments ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const t = p.tenant as any;
        return (
          (p.transaction_ref ?? "").toLowerCase().includes(q) ||
          t?.full_name?.toLowerCase().includes(q) ||
          t?.unit?.property?.name?.toLowerCase().includes(q)
        );
      });
    }
    if (methodFilter !== "all") list = list.filter((p) => p.method === methodFilter);
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [payments, search, methodFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRecord = async () => {
    if (!form.tenant_id || !form.amount || !form.method) return toast.error("Tenant, amount, and payment method are required");
    try {
      await recordPayment.mutateAsync({
        tenant_id: form.tenant_id,
        amount: Number(form.amount),
        method: form.method as any,
        transaction_ref: form.transaction_ref || undefined,
        phone_number: form.phone_number || undefined,
        invoice_id: form.invoice_id || undefined,
      });
      toast.success("Payment recorded");
      setOpen(false);
      setForm(defaultForm);
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    }
  };

  const handleDownloadReceipt = (payment: any) => {
    const html = generateReceiptHtml(payment);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    toast.success("Receipt opened — use Ctrl+P to save as PDF");
  };

  const handleExport = () => {
    if (!filtered.length) return toast.error("No payments to export");
    const headers = ["Date", "Tenant", "Property", "Unit", "Amount (KES)", "Method", "Ref", "Status"];
    const rows = filtered.map((p) => {
      const t = p.tenant as any;
      return [
        new Date(p.payment_date).toLocaleDateString(),
        t?.full_name ?? "",
        t?.unit?.property?.name ?? "",
        t?.unit?.unit_number ?? "",
        Number(p.amount).toLocaleString(),
        methodLabels[p.method] ?? p.method,
        p.transaction_ref ?? "",
        p.status,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const confirmed = payments?.filter((p) => p.status === "confirmed") ?? [];
  const totalCollected = confirmed.reduce((a, p) => a + Number(p.amount), 0);
  const mpesaTotal = confirmed.filter((p) => p.method === "mpesa").reduce((a, p) => a + Number(p.amount), 0);
  const bankTotal = confirmed.filter((p) => p.method !== "mpesa" && p.method !== "cash").reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track M-Pesa and bank transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="h-4 w-4" /> Export CSV</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="gap-2"><Plus className="h-4 w-4" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Tenant</Label>
                  <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v, invoice_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>
                      {tenants?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.tenant_id && tenantInvoices.length > 0 && (
                  <div>
                    <Label>Link to Invoice (optional)</Label>
                    <Select value={form.invoice_id} onValueChange={(v) => {
                      const inv = invoices?.find((i) => i.id === v);
                      setForm({ ...form, invoice_id: v, amount: inv ? String(inv.amount) : form.amount });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Choose an outstanding invoice" /></SelectTrigger>
                      <SelectContent>
                        {tenantInvoices.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.invoice_number} — KES {Number(inv.amount).toLocaleString()} (due {new Date(inv.due_date).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Amount (KES)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="25000" /></div>
                  <div>
                    <Label>Method</Label>
                    <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(methodLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Transaction Ref</Label><Input value={form.transaction_ref} onChange={(e) => setForm({ ...form, transaction_ref: e.target.value })} placeholder="QHG3X7YZ2K" /></div>
                  <div><Label>Phone Number</Label><Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+254 7XX XXX XXX" /></div>
                </div>
                <Button onClick={handleRecord} disabled={recordPayment.isPending} className="w-full">
                  {recordPayment.isPending ? "Recording…" : "Record Payment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Collected", value: `KES ${totalCollected.toLocaleString()}`, sub: `${confirmed.length} transactions` },
          { label: "M-Pesa Payments", value: `KES ${mpesaTotal.toLocaleString()}`, sub: `${confirmed.filter((p) => p.method === "mpesa").length} transactions` },
          { label: "Bank Transfers", value: `KES ${bankTotal.toLocaleString()}`, sub: `${confirmed.filter((p) => p.method !== "mpesa" && p.method !== "cash").length} transactions` },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-heading text-xl font-bold text-card-foreground">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tenant, property, or transaction ref…"
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {Object.entries(methodLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!filtered.length ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">
            {search || methodFilter !== "all" || statusFilter !== "all" ? "No matching payments" : "No payments yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || methodFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters" : "Record your first payment to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="stat-card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transaction</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tenant / Unit</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((p) => {
                  const tenant = p.tenant as any;
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-card-foreground">{p.transaction_ref ?? p.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-card-foreground">{tenant?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{tenant?.unit?.property?.name} — {tenant?.unit?.unit_number}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-card-foreground">KES {Number(p.amount).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${methodColors[p.method] || ""}`}>
                          {methodLabels[p.method] || p.method}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(p)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Download receipt"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
