import { useTenantRecord, useMyInvoices, useMyPayments } from "@/hooks/useTenantRecord";
import { Receipt, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function TenantRent() {
  const { data: tenant } = useTenantRecord();
  const { data: invoices, isLoading: loadingInvoices } = useMyInvoices(tenant?.id);
  const { data: payments, isLoading: loadingPayments } = useMyPayments(tenant?.id);

  const outstanding = invoices?.filter((i) => i.status === "pending" || i.status === "overdue") ?? [];
  const totalDue = outstanding.reduce((a, i) => a + Number(i.amount), 0);
  const totalPaid = (payments ?? []).filter((p) => p.status === "confirmed").reduce((a, p) => a + Number(p.amount), 0);

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
