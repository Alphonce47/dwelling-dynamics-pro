import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePayments } from "@/hooks/usePayments";

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

export default function Payments() {
  const { data: payments, isLoading } = usePayments();

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
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
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
          <p className="mt-1 text-sm text-muted-foreground">Payments will appear here once recorded</p>
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
