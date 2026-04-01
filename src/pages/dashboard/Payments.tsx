import { CreditCard, Download, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const payments = [
  { id: "TXN-001", tenant: "Grace Wanjiku", unit: "Sunrise A-12", amount: 25000, method: "M-Pesa", ref: "SHJ3K7L2MN", date: "2026-06-01", status: "confirmed" },
  { id: "TXN-002", tenant: "Peter Ochieng", unit: "Greenview B-4", amount: 35000, method: "KCB Bank", ref: "KCB98234", date: "2026-06-01", status: "confirmed" },
  { id: "TXN-003", tenant: "James Mwangi", unit: "Coastal C-2", amount: 45000, method: "Equity Bank", ref: "EQ39201", date: "2026-05-31", status: "confirmed" },
  { id: "TXN-004", tenant: "Faith Njeri", unit: "Greenview B-7", amount: 35000, method: "M-Pesa", ref: "QWE8K4N1OP", date: "2026-05-31", status: "pending" },
  { id: "TXN-005", tenant: "David Mutua", unit: "Karen V-1", amount: 120000, method: "Co-op Bank", ref: "COOP4521", date: "2026-05-30", status: "confirmed" },
  { id: "TXN-006", tenant: "Ann Wambui", unit: "Lakeview L-3", amount: 24000, method: "M-Pesa", ref: "LMN5R2T8UV", date: "2026-05-28", status: "failed" },
];

const methodColors: Record<string, string> = {
  "M-Pesa": "bg-success/10 text-success",
  "KCB Bank": "bg-info/10 text-info",
  "Equity Bank": "bg-info/10 text-info",
  "Co-op Bank": "bg-info/10 text-info",
};

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-destructive/10 text-destructive",
};

export default function Payments() {
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

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Collected (Jun)", value: "KES 930,000", sub: "32 transactions" },
          { label: "M-Pesa Payments", value: "KES 520,000", sub: "18 transactions" },
          { label: "Bank Transfers", value: "KES 410,000", sub: "14 transactions" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-heading text-xl font-bold text-card-foreground">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

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
            {payments.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-card-foreground">{p.id}</div>
                  <div className="text-xs text-muted-foreground">Ref: {p.ref}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-card-foreground">{p.tenant}</div>
                  <div className="text-xs text-muted-foreground">{p.unit}</div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-card-foreground">KES {p.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${methodColors[p.method] || ""}`}>
                    {p.method}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{p.date}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
