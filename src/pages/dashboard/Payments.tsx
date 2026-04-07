import { useState } from "react";
import { CreditCard, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayments, useRecordPayment } from "@/hooks/usePayments";
import { useTenants } from "@/hooks/useTenants";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "sonner";

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

const defaultForm = {
  tenant_id: "",
  invoice_id: "",
  amount: "",
  method: "mpesa",
  transaction_ref: "",
  phone_number: "",
};

export default function Payments() {
  const { data: payments, isLoading } = usePayments();
  const { data: tenants } = useTenants();
  const { data: invoices } = useInvoices();
  const recordPayment = useRecordPayment();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const tenantInvoices = invoices?.filter(
    (inv) => inv.tenant_id === form.tenant_id && (inv.status === "pending" || inv.status === "overdue")
  ) ?? [];

  const handleRecord = async () => {
    if (!form.tenant_id || !form.amount || !form.method) {
      return toast.error("Tenant, amount, and payment method are required");
    }
    try {
      await recordPayment.mutateAsync({
        tenant_id: form.tenant_id,
        amount: Number(form.amount),
        method: form.method as "mpesa" | "bank_equity" | "bank_kcb" | "bank_coop" | "cash" | "international_transfer",
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

  const handleExport = () => {
    if (!payments?.length) return toast.error("No payments to export");
    const headers = ["Date", "Tenant", "Property", "Unit", "Amount (KES)", "Method", "Ref", "Status"];
    const rows = payments.map((p) => {
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
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="gap-2">
                <Plus className="h-4 w-4" /> Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
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
                  <div>
                    <Label>Amount (KES)</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="25000"
                    />
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank_equity">Equity Bank</SelectItem>
                        <SelectItem value="bank_kcb">KCB Bank</SelectItem>
                        <SelectItem value="bank_coop">Co-op Bank</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="international_transfer">Intl Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Transaction Ref</Label>
                    <Input
                      value={form.transaction_ref}
                      onChange={(e) => setForm({ ...form, transaction_ref: e.target.value })}
                      placeholder="e.g. QHG3X7YZ2K"
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                </div>

                <Button onClick={handleRecord} disabled={recordPayment.isPending} className="w-full">
                  {recordPayment.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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

      {!payments?.length ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">No payments yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Record your first payment to get started</p>
        </div>
      ) : (
        <div className="stat-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Transaction</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Tenant / Unit</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const tenant = p.tenant as any;
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-card-foreground">{p.transaction_ref ?? p.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-card-foreground">{tenant?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{tenant?.unit?.property?.name} — {tenant?.unit?.unit_number}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-card-foreground">KES {Number(p.amount).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${methodColors[p.method] || ""}`}>
                        {methodLabels[p.method] || p.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
