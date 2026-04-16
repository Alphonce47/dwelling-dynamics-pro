import { useState, useMemo } from "react";
import {
  Users, Plus, Search, Phone, Mail, Pencil, Trash2, X, FileText,
  CreditCard, Share2, LogOut, ChevronLeft, ChevronRight, Filter, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant } from "@/hooks/useTenants";
import { useCreateLease, useUpdateLeaseStatus } from "@/hooks/useLeases";
import { useProperties } from "@/hooks/useProperties";
import { usePayments } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "sonner";

const PAGE_SIZE = 25;
const emptyTenantForm = { full_name: "", phone: "", email: "", id_number: "", unit_id: "" };
const emptyLeaseForm = { start_date: "", end_date: "", rent_amount: "", deposit_amount: "" };

function generateStatementHtml(tenant: any, invoices: any[], payments: any[], dateFrom: string, dateTo: string) {
  const fromLabel = dateFrom ? new Date(dateFrom).toLocaleDateString("en-KE") : "All time";
  const toLabel = dateTo ? new Date(dateTo).toLocaleDateString("en-KE") : "Today";
  const unit = tenant.unit as any;
  const property = unit?.property;
  const totalInvoiced = invoices.reduce((a, i) => a + Number(i.amount), 0);
  const totalPaid = payments.filter((p) => p.status === "confirmed").reduce((a, p) => a + Number(p.amount), 0);
  const balance = totalInvoiced - totalPaid;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tenant Statement — ${tenant.full_name}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color:#1a1a2e; padding:48px; max-width:700px; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #2D8B5E; padding-bottom:20px; margin-bottom:28px; }
    .brand { font-size:24px; font-weight:800; color:#2D8B5E; }
    .title { text-align:right; }
    .title h2 { font-size:22px; font-weight:800; text-transform:uppercase; letter-spacing:2px; }
    .title p { font-size:12px; color:#666; margin-top:4px; }
    .meta { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px; }
    .meta-block h4 { font-size:10px; text-transform:uppercase; color:#999; letter-spacing:1.5px; margin-bottom:6px; border-bottom:1px solid #eee; padding-bottom:4px; }
    .meta-block p { font-size:13px; line-height:1.7; }
    .summary { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:28px; }
    .summary-box { border:1px solid #eee; border-radius:8px; padding:12px; text-align:center; }
    .summary-box .label { font-size:10px; text-transform:uppercase; color:#999; letter-spacing:1px; }
    .summary-box .value { font-size:20px; font-weight:800; margin-top:4px; }
    .summary-box.balance .value { color:${balance > 0 ? "#dc2626" : "#15803d"}; }
    h3 { font-size:12px; text-transform:uppercase; color:#999; letter-spacing:1px; margin-bottom:8px; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    thead tr { background:#f5f5f5; }
    th { padding:8px 10px; text-align:left; font-size:11px; text-transform:uppercase; color:#666; letter-spacing:0.5px; }
    td { padding:10px; border-bottom:1px solid #eee; font-size:13px; }
    .amount { text-align:right; font-weight:600; }
    .status { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; text-transform:capitalize; }
    .status.paid { background:#d4edda; color:#155724; }
    .status.overdue { background:#f8d7da; color:#721c24; }
    .status.pending { background:#fff3cd; color:#856404; }
    .footer { border-top:1px solid #eee; padding-top:16px; font-size:11px; color:#999; text-align:center; margin-top:16px; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div><div class="brand">NyumbaHub</div><div style="font-size:11px;color:#888;margin-top:3px">Property Management</div></div>
    <div class="title"><h2>Tenant Statement</h2><p>Period: ${fromLabel} – ${toLabel}</p></div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h4>Tenant</h4>
      <p><strong>${tenant.full_name}</strong></p>
      ${tenant.phone ? `<p>${tenant.phone}</p>` : ""}
      ${tenant.email ? `<p>${tenant.email}</p>` : ""}
    </div>
    <div class="meta-block" style="text-align:right">
      <h4>Property / Unit</h4>
      <p><strong>${property?.name ?? "—"}</strong></p>
      <p>Unit ${unit?.unit_number ?? "—"}</p>
      ${property?.city ? `<p>${property.city}</p>` : ""}
      <h4 style="margin-top:12px">Generated</h4>
      <p>${new Date().toLocaleDateString("en-KE")}</p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="label">Total Invoiced</div>
      <div class="value">KES ${totalInvoiced.toLocaleString("en-KE")}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Paid</div>
      <div class="value" style="color:#15803d">KES ${totalPaid.toLocaleString("en-KE")}</div>
    </div>
    <div class="summary-box balance">
      <div class="label">Balance Due</div>
      <div class="value">KES ${balance.toLocaleString("en-KE")}</div>
    </div>
  </div>

  <h3>Invoices</h3>
  <table>
    <thead><tr><th>Invoice #</th><th>Notes</th><th>Due Date</th><th>Status</th><th class="amount">Amount</th></tr></thead>
    <tbody>
      ${invoices.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:#999">No invoices in this period</td></tr>` : invoices.map((inv) => `
        <tr>
          <td>${inv.invoice_number}</td>
          <td style="color:#666">${inv.notes || "Monthly Rent"}</td>
          <td>${new Date(inv.due_date).toLocaleDateString("en-KE")}</td>
          <td><span class="status ${inv.status}">${inv.status}</span></td>
          <td class="amount">KES ${Number(inv.amount).toLocaleString("en-KE")}</td>
        </tr>`).join("")}
    </tbody>
  </table>

  <h3>Payments</h3>
  <table>
    <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Status</th><th class="amount">Amount</th></tr></thead>
    <tbody>
      ${payments.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:#999">No payments in this period</td></tr>` : payments.map((p) => `
        <tr>
          <td>${new Date(p.payment_date).toLocaleDateString("en-KE")}</td>
          <td>${(p.method || "").replace(/_/g, " ")}</td>
          <td style="color:#666">${p.transaction_ref || "—"}</td>
          <td><span class="status paid">${p.status}</span></td>
          <td class="amount" style="color:#15803d">KES ${Number(p.amount).toLocaleString("en-KE")}</td>
        </tr>`).join("")}
    </tbody>
  </table>

  <div class="footer">Generated by NyumbaHub — ${new Date().toLocaleDateString("en-KE")}</div>
</body>
</html>`;
}

export default function Tenants() {
  const { data: tenants, isLoading } = useTenants();
  const { data: properties } = useProperties();
  const { data: payments } = usePayments();
  const { data: invoices } = useInvoices();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();
  const createLease = useCreateLease();
  const updateLeaseStatus = useUpdateLeaseStatus();

  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [leaseFilter, setLeaseFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [form, setForm] = useState(emptyTenantForm);

  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [leaseOpen, setLeaseOpen] = useState(false);
  const [leaseForm, setLeaseForm] = useState(emptyLeaseForm);

  const [moveOutOpen, setMoveOutOpen] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));
  const [moveOutNotes, setMoveOutNotes] = useState("");
  const [movingOut, setMovingOut] = useState(false);

  const [statementOpen, setStatementOpen] = useState(false);
  const [stmtFrom, setStmtFrom] = useState("");
  const [stmtTo, setStmtTo] = useState(new Date().toISOString().slice(0, 10));

  const [inviteTenant, setInviteTenant] = useState<any>(null);
  const [copiedSignup, setCopiedSignup] = useState(false);

  const allUnits = properties?.flatMap((p) =>
    (p.units ?? []).map((u: any) => ({
      id: u.id,
      label: `${p.name} — Unit ${u.unit_number}`,
      rent_amount: u.rent_amount,
    }))
  ) ?? [];

  const filtered = useMemo(() => {
    let list = tenants ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.full_name.toLowerCase().includes(q) ||
        (t.unit as any)?.property?.name?.toLowerCase().includes(q) ||
        (t.unit as any)?.unit_number?.toLowerCase().includes(q) ||
        (t.phone ?? "").toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q)
      );
    }
    if (propertyFilter !== "all") {
      list = list.filter((t) => (t.unit as any)?.property?.id === propertyFilter);
    }
    if (leaseFilter === "active") {
      list = list.filter((t) => (t.leases as any[])?.some((l) => l.status === "active"));
    } else if (leaseFilter === "none") {
      list = list.filter((t) => !(t.leases as any[])?.some((l) => l.status === "active"));
    } else if (leaseFilter === "unassigned") {
      list = list.filter((t) => !t.unit_id);
    }
    return list;
  }, [tenants, search, propertyFilter, leaseFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openNew = () => { setEditingTenant(null); setForm(emptyTenantForm); setOpen(true); };
  const openEdit = (t: any) => {
    setEditingTenant(t);
    setForm({ full_name: t.full_name, phone: t.phone ?? "", email: t.email ?? "", id_number: t.id_number ?? "", unit_id: t.unit_id ?? "" });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) return toast.error("Tenant name is required");
    try {
      if (editingTenant) {
        await updateTenant.mutateAsync({ id: editingTenant.id, ...form, unit_id: form.unit_id || undefined });
        toast.success("Tenant updated");
        if (selectedTenant?.id === editingTenant.id) setSelectedTenant((s: any) => ({ ...s, ...form }));
      } else {
        await createTenant.mutateAsync({ ...form, unit_id: form.unit_id || undefined });
        toast.success("Tenant created");
      }
      setOpen(false);
    } catch (err: any) { toast.error(err.message || "Failed to save tenant"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tenant "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTenant.mutateAsync(id);
      if (selectedTenant?.id === id) setSelectedTenant(null);
      toast.success("Tenant deleted");
    } catch (err: any) { toast.error(err.message || "Failed to delete tenant"); }
  };

  const handleCreateLease = async () => {
    if (!leaseForm.start_date || !leaseForm.end_date || !leaseForm.rent_amount) return toast.error("Start date, end date, and rent are required");
    if (!selectedTenant?.unit_id) return toast.error("Tenant must be assigned to a unit first");
    try {
      await createLease.mutateAsync({
        tenant_id: selectedTenant.id,
        unit_id: selectedTenant.unit_id,
        start_date: leaseForm.start_date,
        end_date: leaseForm.end_date,
        rent_amount: Number(leaseForm.rent_amount),
        deposit_amount: leaseForm.deposit_amount ? Number(leaseForm.deposit_amount) : undefined,
      });
      toast.success("Lease created");
      setLeaseOpen(false);
      setLeaseForm(emptyLeaseForm);
    } catch (err: any) { toast.error(err.message || "Failed to create lease"); }
  };

  const handleMoveOut = async () => {
    if (!selectedTenant) return;
    if (!moveOutDate) return toast.error("Move-out date is required");
    setMovingOut(true);
    try {
      const activeLease = (selectedTenant.leases as any[])?.find((l: any) => l.status === "active");
      if (activeLease) {
        await updateLeaseStatus.mutateAsync({ id: activeLease.id, status: "terminated" });
      }
      await updateTenant.mutateAsync({
        id: selectedTenant.id,
        unit_id: null,
        move_out_date: moveOutDate,
      });
      toast.success(`${selectedTenant.full_name} has been moved out`);
      setMoveOutOpen(false);
      setSelectedTenant(null);
      setMoveOutDate(new Date().toISOString().slice(0, 10));
      setMoveOutNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete move-out");
    } finally {
      setMovingOut(false);
    }
  };

  const handleStatement = () => {
    if (!selectedTenant) return;
    const tenantInvoices = (invoices ?? []).filter((i) => {
      if (i.tenant_id !== selectedTenant.id) return false;
      if (stmtFrom && new Date(i.due_date) < new Date(stmtFrom)) return false;
      if (stmtTo && new Date(i.due_date) > new Date(stmtTo)) return false;
      return true;
    });
    const tenantPayments = (payments ?? []).filter((p) => {
      if (p.tenant_id !== selectedTenant.id) return false;
      if (stmtFrom && new Date(p.payment_date) < new Date(stmtFrom)) return false;
      if (stmtTo && new Date(p.payment_date) > new Date(stmtTo)) return false;
      return true;
    });
    const html = generateStatementHtml(selectedTenant, tenantInvoices, tenantPayments, stmtFrom, stmtTo);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast.success("Statement opened — use Ctrl+P to save as PDF");
    setStatementOpen(false);
  };

  const tenantPayments = payments?.filter((p) => p.tenant_id === selectedTenant?.id) ?? [];
  const tenantInvoices = invoices?.filter((i) => i.tenant_id === selectedTenant?.id) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tenants</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} of {tenants?.length ?? 0} tenants</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={openNew}><Plus className="h-4 w-4" /> Add Tenant</Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, phone, property…" className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={propertyFilter} onValueChange={(v) => { setPropertyFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={leaseFilter} onValueChange={(v) => { setLeaseFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              <SelectItem value="active">Active Lease</SelectItem>
              <SelectItem value="none">No Lease</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">
            {search || propertyFilter !== "all" || leaseFilter !== "all" ? "No tenants match your filters" : "No tenants yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || propertyFilter !== "all" || leaseFilter !== "all" ? "Try adjusting your search or filters" : "Add your first tenant to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="stat-card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Tenant</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Property / Unit</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Rent</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Lease</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((t) => {
                  const unit = t.unit as any;
                  const activeLease = (t.leases as any[])?.find((l) => l.status === "active");
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedTenant(t)}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-card-foreground">{t.full_name}</div>
                        {t.phone && <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{t.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-card-foreground">{unit?.property?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{unit ? `Unit ${unit.unit_number}` : "Unassigned"}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-card-foreground">
                        {activeLease ? `KES ${Number(activeLease.rent_amount).toLocaleString()}` : unit ? `KES ${Number(unit.rent_amount).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={activeLease ? "default" : "secondary"} className={activeLease ? "bg-success/10 text-success hover:bg-success/20 border-0" : ""}>
                          {activeLease ? "Active" : "No Lease"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEdit(t)} className="text-muted-foreground hover:text-foreground transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(t.id, t.full_name)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Tenant Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTenant ? "Edit Tenant" : "Add New Tenant"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Grace Wanjiku" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 7XX XXX XXX" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="grace@email.com" /></div>
            </div>
            <div><Label>ID Number</Label><Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} /></div>
            <div>
              <Label>Assign to Unit</Label>
              <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a unit (optional)" /></SelectTrigger>
                <SelectContent>
                  {allUnits.map((u) => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={createTenant.isPending || updateTenant.isPending} className="w-full">
              {(createTenant.isPending || updateTenant.isPending) ? "Saving…" : editingTenant ? "Save Changes" : "Create Tenant"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant Detail Sheet */}
      <Sheet open={!!selectedTenant} onOpenChange={(o) => { if (!o) setSelectedTenant(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedTenant && (() => {
            const unit = selectedTenant.unit as any;
            const leases = (selectedTenant.leases as any[]) ?? [];
            const activeLease = leases.find((l: any) => l.status === "active");

            return (
              <>
                <SheetHeader className="mb-6">
                  <div className="flex items-start justify-between">
                    <SheetTitle className="font-heading text-xl">{selectedTenant.full_name}</SheetTitle>
                    <button onClick={() => setSelectedTenant(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {selectedTenant.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedTenant.phone}</span>}
                    {selectedTenant.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedTenant.email}</span>}
                  </div>
                </SheetHeader>

                {/* Unit */}
                <div className="mb-4 rounded-lg border p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit</p>
                  {unit ? (
                    <div>
                      <p className="font-medium text-foreground">{unit.property?.name} — Unit {unit.unit_number}</p>
                      <p className="text-sm text-muted-foreground">{unit.property?.city} · KES {Number(unit.rent_amount).toLocaleString()}/mo</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No unit assigned</p>
                  )}
                </div>

                {/* Lease */}
                <div className="mb-4 rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lease</p>
                    {!activeLease && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => {
                        const u = allUnits.find((u) => u.id === selectedTenant.unit_id);
                        setLeaseForm({ ...emptyLeaseForm, rent_amount: u ? String(u.rent_amount) : "" });
                        setLeaseOpen(true);
                      }}><Plus className="h-3 w-3" /> New Lease</Button>
                    )}
                  </div>
                  {activeLease ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-success/10 text-success border-0">{activeLease.status}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{new Date(activeLease.start_date).toLocaleDateString()} – {new Date(activeLease.end_date).toLocaleDateString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Rent</span><span className="font-medium">KES {Number(activeLease.rent_amount).toLocaleString()}/mo</span></div>
                      {Number(activeLease.deposit_amount) > 0 && (
                        <div className="flex justify-between"><span className="text-muted-foreground">Deposit</span><span>KES {Number(activeLease.deposit_amount).toLocaleString()}</span></div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active lease</p>
                  )}
                </div>

                {/* Invoices */}
                <div className="mb-4 rounded-lg border p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Invoices
                  </p>
                  {tenantInvoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices</p> : (
                    <div className="space-y-2">
                      {tenantInvoices.slice(0, 5).map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{inv.invoice_number}</span>
                          <span className="font-medium">KES {Number(inv.amount).toLocaleString()}</span>
                          <Badge variant="secondary" className={`text-xs border-0 capitalize ${inv.status === "paid" ? "bg-success/10 text-success" : inv.status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{inv.status}</Badge>
                        </div>
                      ))}
                      {tenantInvoices.length > 5 && <p className="text-xs text-muted-foreground">+{tenantInvoices.length - 5} more</p>}
                    </div>
                  )}
                </div>

                {/* Payments */}
                <div className="mb-4 rounded-lg border p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" /> Payment History
                  </p>
                  {tenantPayments.length === 0 ? <p className="text-sm text-muted-foreground">No payments</p> : (
                    <div className="space-y-2">
                      {tenantPayments.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</span>
                          <span className="font-medium text-success">KES {Number(p.amount).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground capitalize">{p.method.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                      {tenantPayments.length > 5 && <p className="text-xs text-muted-foreground">+{tenantPayments.length - 5} more</p>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-1.5" onClick={() => openEdit(selectedTenant)}><Pencil className="h-4 w-4" /> Edit</Button>
                  <Button variant="outline" className="gap-1.5" onClick={() => setStatementOpen(true)}><Printer className="h-4 w-4" /> Statement</Button>
                  <Button variant="outline" className="gap-1.5" onClick={() => setInviteTenant(selectedTenant)}><Share2 className="h-4 w-4" /> Share Access</Button>
                  {(selectedTenant.unit_id || (selectedTenant.leases as any[])?.some((l: any) => l.status === "active")) && (
                    <Button variant="outline" className="gap-1.5 text-warning hover:text-warning" onClick={() => setMoveOutOpen(true)}><LogOut className="h-4 w-4" /> Move Out</Button>
                  )}
                  <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive col-span-2" onClick={() => handleDelete(selectedTenant.id, selectedTenant.full_name)}><Trash2 className="h-4 w-4" /> Delete Tenant</Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Create Lease Dialog */}
      <Dialog open={leaseOpen} onOpenChange={setLeaseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Lease — {selectedTenant?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={leaseForm.start_date} onChange={(e) => setLeaseForm({ ...leaseForm, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={leaseForm.end_date} onChange={(e) => setLeaseForm({ ...leaseForm, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Monthly Rent (KES)</Label><Input type="number" value={leaseForm.rent_amount} onChange={(e) => setLeaseForm({ ...leaseForm, rent_amount: e.target.value })} placeholder="25000" /></div>
              <div><Label>Deposit (KES)</Label><Input type="number" value={leaseForm.deposit_amount} onChange={(e) => setLeaseForm({ ...leaseForm, deposit_amount: e.target.value })} placeholder="50000" /></div>
            </div>
            <Button onClick={handleCreateLease} disabled={createLease.isPending} className="w-full">{createLease.isPending ? "Creating…" : "Create Lease"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move-Out Dialog */}
      <Dialog open={moveOutOpen} onOpenChange={setMoveOutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move Out — {selectedTenant?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              This will terminate the active lease and release the unit back to vacant. This action cannot be undone.
            </div>
            <div>
              <Label>Move-Out Date</Label>
              <Input type="date" value={moveOutDate} onChange={(e) => setMoveOutDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={moveOutNotes} onChange={(e) => setMoveOutNotes(e.target.value)} placeholder="e.g. Deposit refunded, keys returned…" rows={3} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setMoveOutOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-warning text-warning-foreground hover:bg-warning/90 gap-2" onClick={handleMoveOut} disabled={movingOut}>
                <LogOut className="h-4 w-4" />{movingOut ? "Processing…" : "Confirm Move-Out"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statement Dialog */}
      <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tenant Statement — {selectedTenant?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Generate a printable statement showing all invoices and payments for this tenant in the selected period.</p>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>From Date</Label><Input type="date" value={stmtFrom} onChange={(e) => setStmtFrom(e.target.value)} /></div>
              <div><Label>To Date</Label><Input type="date" value={stmtTo} onChange={(e) => setStmtTo(e.target.value)} /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStatementOpen(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={handleStatement}>
                <Printer className="h-4 w-4" /> Generate Statement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Portal Access Dialog */}
      <Dialog open={!!inviteTenant} onOpenChange={(o) => { if (!o) { setInviteTenant(null); setCopiedSignup(false); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share Portal Access — {inviteTenant?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Send these instructions to your tenant so they can sign in and view their invoices, payments, and maintenance requests.</p>
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
              <p className="font-medium text-foreground">Steps for {inviteTenant?.full_name}:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                <li>Go to <span className="font-mono font-medium text-foreground">{window.location.origin}/signup</span></li>
                <li>Sign up using: <span className="font-mono font-medium text-foreground">{inviteTenant?.email || "(no email on file)"}</span></li>
                <li>Select <span className="font-medium text-foreground">"Tenant"</span> as account type</li>
                <li>Your account will automatically link to this property</li>
              </ol>
            </div>
            {!inviteTenant?.email && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
                No email saved for this tenant. Edit the tenant first and add their email.
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/signup`);
                setCopiedSignup(true);
                setTimeout(() => setCopiedSignup(false), 2000);
              }}>{copiedSignup ? "Copied!" : "Copy Link"}</Button>
              {inviteTenant?.email && (
                <Button className="flex-1 gap-2" onClick={() => {
                  const subject = encodeURIComponent("Your NyumbaHub Tenant Portal Access");
                  const body = encodeURIComponent(`Hi ${inviteTenant.full_name},\n\nYour landlord has set up a NyumbaHub tenant portal for you.\n\n1. Go to: ${window.location.origin}/signup\n2. Sign up with this email: ${inviteTenant.email}\n3. Select "Tenant" as your account type\n\nYou can then view your invoices, payments, and submit maintenance requests.`);
                  window.open(`mailto:${inviteTenant.email}?subject=${subject}&body=${body}`);
                }}>Send Email</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
