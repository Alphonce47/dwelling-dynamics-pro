import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useInvoices, useCreateInvoice } from "@/hooks/useInvoices";
import { useTenants } from "@/hooks/useTenants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-0",
  paid: "bg-success/10 text-success border-0",
  overdue: "bg-destructive/10 text-destructive border-0",
  cancelled: "bg-muted text-muted-foreground border-0",
  partial: "bg-info/10 text-info border-0",
};

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: tenants } = useTenants();
  const createInvoice = useCreateInvoice();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tenant_id: "", amount: "", due_date: "", invoice_number: "", notes: "" });

  const handleCreate = async () => {
    if (!form.tenant_id || !form.amount || !form.due_date) return toast.error("Fill in all required fields");
    const invoiceNumber = form.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`;
    try {
      await createInvoice.mutateAsync({
        tenant_id: form.tenant_id,
        amount: Number(form.amount),
        due_date: form.due_date,
        invoice_number: invoiceNumber,
        notes: form.notes || undefined,
      });
      toast.success("Invoice created");
      setOpen(false);
      setForm({ tenant_id: "", amount: "", due_date: "", invoice_number: "", notes: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalPending = invoices?.filter((i) => i.status === "pending" || i.status === "overdue").reduce((a, i) => a + Number(i.amount), 0) ?? 0;
  const totalPaid = invoices?.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">{invoices?.length ?? 0} invoices</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="gap-2"><Plus className="h-4 w-4" /> Create Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Tenant</Label>
                <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                  <SelectContent>
                    {tenants?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount (KES)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="25000" /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div><Label>Invoice Number (optional)</Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="Auto-generated" /></div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Rent for July 2026" /></div>
              <Button onClick={handleCreate} disabled={createInvoice.isPending} className="w-full">
                {createInvoice.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Outstanding</div>
          <div className="mt-1 font-heading text-xl font-bold text-card-foreground">KES {totalPending.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Paid</div>
          <div className="mt-1 font-heading text-xl font-bold text-success">KES {totalPaid.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Total Invoices</div>
          <div className="mt-1 font-heading text-xl font-bold text-card-foreground">{invoices?.length ?? 0}</div>
        </div>
      </div>

      {!invoices?.length ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">No invoices yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create your first invoice to start billing tenants</p>
        </div>
      ) : (
        <div className="stat-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Tenant / Property</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const tenant = inv.tenant as any;
                return (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-card-foreground">{inv.invoice_number}</td>
                    <td className="px-6 py-4">
                      <div className="text-card-foreground">{tenant?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{tenant?.unit?.property?.name} — {tenant?.unit?.unit_number}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-card-foreground">KES {Number(inv.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[inv.status] ?? ""} variant="secondary">{inv.status}</Badge>
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
