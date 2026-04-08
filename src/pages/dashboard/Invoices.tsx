import { useState, useMemo } from "react";
import { FileText, Plus, Trash2, RefreshCw, ChevronDown, Download, Search, Filter, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus, useDeleteInvoice, useBulkCreateInvoices } from "@/hooks/useInvoices";
import { useTenants } from "@/hooks/useTenants";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-0",
  paid: "bg-success/10 text-success border-0",
  overdue: "bg-destructive/10 text-destructive border-0",
  cancelled: "bg-muted text-muted-foreground border-0",
  partial: "bg-info/10 text-info border-0",
};

const statusOptions = ["pending", "paid", "overdue", "partial", "cancelled"];

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: tenants } = useTenants();
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const bulkCreate = useBulkCreateInvoices();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tenant_id: "", amount: "", due_date: "", invoice_number: "", notes: "" });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let list = invoices ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => {
        const t = i.tenant as any;
        return (
          i.invoice_number.toLowerCase().includes(q) ||
          t?.full_name?.toLowerCase().includes(q) ||
          t?.unit?.property?.name?.toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    return list;
  }, [invoices, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allPageSelected = pageData.length > 0 && pageData.every((i) => selected.includes(i.id));
  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelected((s) => s.filter((id) => !pageData.find((i) => i.id === id)));
    } else {
      setSelected((s) => [...new Set([...s, ...pageData.map((i) => i.id)])]);
    }
  };
  const toggleSelect = (id: string) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const handleBulkMarkPaid = async () => {
    if (!selected.length) return;
    try {
      await Promise.all(selected.map((id) => updateStatus.mutateAsync({ id, status: "paid" })));
      toast.success(`${selected.length} invoice${selected.length > 1 ? "s" : ""} marked as paid`);
      setSelected([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update invoices");
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`Delete ${selected.length} invoice${selected.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    try {
      await Promise.all(selected.map((id) => deleteInvoice.mutateAsync(id)));
      toast.success(`${selected.length} invoice${selected.length > 1 ? "s" : ""} deleted`);
      setSelected([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete invoices");
    }
  };

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

  const handleUpdateStatus = async (id: string, status: "pending" | "paid" | "overdue" | "cancelled" | "partial") => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Invoice marked as ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success("Invoice deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete invoice");
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const res = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { invoice_id: invoiceId },
      });
      if (res.error) throw res.error;
      const blob = new Blob([res.data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success("Invoice opened — use Ctrl+P to save as PDF");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
    }
  };

  const handleBulkGenerate = async () => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().slice(0, 10);
    const monthLabel = today.toLocaleString("default", { month: "long", year: "numeric" });
    const activeTenants = tenants?.filter((t) => {
      const activeLease = (t.leases as any[])?.find((l: any) => l.status === "active");
      return t.unit_id && activeLease;
    }) ?? [];
    if (!activeTenants.length) return toast.error("No tenants with active leases found");
    const invoicesToCreate = activeTenants.map((t) => {
      const activeLease = (t.leases as any[])?.find((l: any) => l.status === "active");
      const amount = Number(activeLease?.rent_amount ?? (t.unit as any)?.rent_amount ?? 0);
      return {
        tenant_id: t.id,
        amount,
        due_date: dueDate,
        invoice_number: `INV-${t.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        notes: `Rent for ${monthLabel}`,
      };
    });
    try {
      await bulkCreate.mutateAsync(invoicesToCreate);
      toast.success(`Generated ${invoicesToCreate.length} invoices for ${monthLabel}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoices");
    }
  };

  const handleExportCsv = () => {
    if (!filtered.length) return toast.error("No invoices to export");
    const headers = ["Invoice #", "Tenant", "Property", "Unit", "Amount (KES)", "Due Date", "Status", "Notes"];
    const rows = filtered.map((inv) => {
      const t = inv.tenant as any;
      return [
        inv.invoice_number,
        t?.full_name ?? "",
        t?.unit?.property?.name ?? "",
        t?.unit?.unit_number ?? "",
        Number(inv.amount).toLocaleString(),
        new Date(inv.due_date).toLocaleDateString(),
        inv.status,
        inv.notes ?? "",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
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

  const totalPending = invoices?.filter((i) => i.status === "pending" || i.status === "overdue").reduce((a, i) => a + Number(i.amount), 0) ?? 0;
  const totalPaid = invoices?.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} of {invoices?.length ?? 0} invoices</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" className="gap-2" onClick={handleBulkGenerate} disabled={bulkCreate.isPending}>
            <RefreshCw className="h-4 w-4" />{bulkCreate.isPending ? "Generating…" : "Bulk Generate"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="gap-2"><Plus className="h-4 w-4" /> Create Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Tenant</Label>
                  <Select value={form.tenant_id} onValueChange={(v) => {
                    const t = tenants?.find((t) => t.id === v);
                    const lease = (t?.leases as any[])?.find((l: any) => l.status === "active");
                    const amount = lease?.rent_amount ?? (t?.unit as any)?.rent_amount ?? "";
                    setForm({ ...form, tenant_id: v, amount: amount ? String(amount) : form.amount });
                  }}>
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
                  {createInvoice.isPending ? "Creating…" : "Create Invoice"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card"><div className="text-sm text-muted-foreground">Outstanding</div><div className="mt-1 font-heading text-xl font-bold text-card-foreground">KES {totalPending.toLocaleString()}</div></div>
        <div className="stat-card"><div className="text-sm text-muted-foreground">Paid</div><div className="mt-1 font-heading text-xl font-bold text-success">KES {totalPaid.toLocaleString()}</div></div>
        <div className="stat-card"><div className="text-sm text-muted-foreground">Total Invoices</div><div className="mt-1 font-heading text-xl font-bold text-card-foreground">{invoices?.length ?? 0}</div></div>
      </div>

      {/* Search + Filter + Bulk actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice #, tenant, or property…"
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.length} selected</span>
            <Button size="sm" variant="outline" onClick={handleBulkMarkPaid}>Mark Paid</Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={handleBulkDelete}>Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
          </div>
        )}
      </div>

      {!filtered.length ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">
            {search || statusFilter !== "all" ? "No matching invoices" : "No invoices yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || statusFilter !== "all" ? "Try adjusting your search or filter" : "Create your first invoice or use Bulk Generate"}
          </p>
        </div>
      ) : (
        <>
          <div className="stat-card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tenant / Property</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((inv) => {
                  const tenant = inv.tenant as any;
                  const isSelected = selected.includes(inv.id);
                  const isOverdue = inv.status === "overdue";
                  return (
                    <tr key={inv.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(inv.id)} className="rounded border-border" />
                      </td>
                      <td className="px-4 py-4 font-medium text-card-foreground">{inv.invoice_number}</td>
                      <td className="px-4 py-4">
                        <div className="text-card-foreground">{tenant?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{tenant?.unit?.property?.name} — {tenant?.unit?.unit_number}</div>
                      </td>
                      <td className={`px-4 py-4 text-right font-medium ${isOverdue ? "text-destructive" : "text-card-foreground"}`}>
                        KES {Number(inv.amount).toLocaleString()}
                      </td>
                      <td className={`px-4 py-4 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 rounded-full focus:outline-none">
                              <Badge className={`${statusColors[inv.status] ?? ""} cursor-pointer capitalize`} variant="secondary">
                                {inv.status}
                              </Badge>
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {statusOptions.filter((s) => s !== inv.status).map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(inv.id, s as any)} className="capitalize">
                                Mark as {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-4 py-4 text-right space-x-2">
                        <button onClick={() => handleDownloadPdf(inv.id)} className="text-muted-foreground hover:text-primary transition-colors" title="Download invoice PDF">
                          <Download className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(inv.id, inv.invoice_number)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete invoice">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
