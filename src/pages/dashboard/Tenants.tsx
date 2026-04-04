import { useState } from "react";
import { Users, Plus, Search, Phone, Mail, Pencil, Trash2, X, FileText, CreditCard, Share2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant } from "@/hooks/useTenants";
import { useCreateLease } from "@/hooks/useLeases";
import { useProperties } from "@/hooks/useProperties";
import { usePayments } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "sonner";

const emptyTenantForm = { full_name: "", phone: "", email: "", id_number: "", unit_id: "" };
const emptyLeaseForm = { start_date: "", end_date: "", rent_amount: "", deposit_amount: "" };

export default function Tenants() {
  const { data: tenants, isLoading } = useTenants();
  const { data: properties } = useProperties();
  const { data: payments } = usePayments();
  const { data: invoices } = useInvoices();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();
  const createLease = useCreateLease();

  const [search, setSearch] = useState("");
  const [inviteTenant, setInviteTenant] = useState<any>(null);
  const [copiedSignup, setCopiedSignup] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [form, setForm] = useState(emptyTenantForm);

  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [leaseOpen, setLeaseOpen] = useState(false);
  const [leaseForm, setLeaseForm] = useState(emptyLeaseForm);

  const allUnits = properties?.flatMap((p) =>
    (p.units ?? []).map((u: any) => ({
      id: u.id,
      label: `${p.name} — Unit ${u.unit_number}`,
      rent_amount: u.rent_amount,
    }))
  ) ?? [];

  const filtered = tenants?.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.unit as any)?.property?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (t.unit as any)?.unit_number?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const openNew = () => {
    setEditingTenant(null);
    setForm(emptyTenantForm);
    setOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingTenant(t);
    setForm({
      full_name: t.full_name,
      phone: t.phone ?? "",
      email: t.email ?? "",
      id_number: t.id_number ?? "",
      unit_id: t.unit_id ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) return toast.error("Tenant name is required");
    try {
      if (editingTenant) {
        await updateTenant.mutateAsync({ id: editingTenant.id, ...form, unit_id: form.unit_id || undefined });
        toast.success("Tenant updated");
      } else {
        await createTenant.mutateAsync({ ...form, unit_id: form.unit_id || undefined });
        toast.success("Tenant created");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save tenant");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tenant "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTenant.mutateAsync(id);
      if (selectedTenant?.id === id) setSelectedTenant(null);
      toast.success("Tenant deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tenant");
    }
  };

  const handleCreateLease = async () => {
    if (!leaseForm.start_date || !leaseForm.end_date || !leaseForm.rent_amount) {
      return toast.error("Start date, end date, and rent amount are required");
    }
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
      // Refresh selected tenant data
      setSelectedTenant((prev: any) => ({ ...prev }));
    } catch (err: any) {
      toast.error(err.message || "Failed to create lease");
    }
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
          <p className="mt-1 text-sm text-muted-foreground">{tenants?.length ?? 0} tenants across all properties</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Tenant
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tenants, properties, or units..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">
            {search ? "No tenants match your search" : "No tenants yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? "Try a different search term" : "Add your first tenant to get started"}
          </p>
        </div>
      ) : (
        <div className="stat-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Tenant</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Property / Unit</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Rent</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Lease Status</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const unit = t.unit as any;
                const activeLease = (t.leases as any[])?.find((l) => l.status === "active");
                return (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedTenant(t)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-card-foreground">{t.full_name}</div>
                      {t.phone && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />{t.phone}
                        </div>
                      )}
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
                        <button
                          onClick={() => openEdit(t)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.full_name)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Tenant Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTenant ? "Edit Tenant" : "Add New Tenant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Grace Wanjiku" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 7XX XXX XXX" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="grace@email.com" /></div>
            </div>
            <div><Label>ID Number</Label><Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} /></div>
            <div>
              <Label>Assign to Unit</Label>
              <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a unit (optional)" /></SelectTrigger>
                <SelectContent>
                  {allUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={createTenant.isPending || updateTenant.isPending} className="w-full">
              {(createTenant.isPending || updateTenant.isPending) ? "Saving..." : editingTenant ? "Save Changes" : "Create Tenant"}
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
                    <button onClick={() => setSelectedTenant(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {selectedTenant.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedTenant.phone}</span>
                    )}
                    {selectedTenant.email && (
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedTenant.email}</span>
                    )}
                  </div>
                </SheetHeader>

                {/* Unit */}
                <div className="mb-6 rounded-lg border p-4">
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
                <div className="mb-6 rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lease</p>
                    {!activeLease && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => {
                        const u = allUnits.find((u) => u.id === selectedTenant.unit_id);
                        setLeaseForm({ ...emptyLeaseForm, rent_amount: u ? String(u.rent_amount) : "" });
                        setLeaseOpen(true);
                      }}>
                        <Plus className="h-3 w-3" /> New Lease
                      </Button>
                    )}
                  </div>
                  {activeLease ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge className="bg-success/10 text-success border-0 capitalize">{activeLease.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Period</span>
                        <span>{new Date(activeLease.start_date).toLocaleDateString()} – {new Date(activeLease.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rent</span>
                        <span className="font-medium">KES {Number(activeLease.rent_amount).toLocaleString()}/mo</span>
                      </div>
                      {activeLease.deposit_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deposit</span>
                          <span>KES {Number(activeLease.deposit_amount).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active lease</p>
                  )}
                </div>

                {/* Invoices */}
                <div className="mb-6 rounded-lg border p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Invoices
                  </p>
                  {tenantInvoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No invoices</p>
                  ) : (
                    <div className="space-y-2">
                      {tenantInvoices.slice(0, 5).map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{inv.invoice_number}</span>
                          <span className="font-medium">KES {Number(inv.amount).toLocaleString()}</span>
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 capitalize ${inv.status === "paid" ? "bg-success/10 text-success" : inv.status === "overdue" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}
                          >
                            {inv.status}
                          </Badge>
                        </div>
                      ))}
                      {tenantInvoices.length > 5 && (
                        <p className="text-xs text-muted-foreground">+{tenantInvoices.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Payments */}
                <div className="rounded-lg border p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" /> Payment History
                  </p>
                  {tenantPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments</p>
                  ) : (
                    <div className="space-y-2">
                      {tenantPayments.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</span>
                          <span className="font-medium text-success">KES {Number(p.amount).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground capitalize">{p.method.replace("_", " ")}</span>
                        </div>
                      ))}
                      {tenantPayments.length > 5 && (
                        <p className="text-xs text-muted-foreground">+{tenantPayments.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={() => openEdit(selectedTenant)}>
                    <Pencil className="h-4 w-4" /> Edit Tenant
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    title="Share portal access"
                    onClick={() => setInviteTenant(selectedTenant)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => handleDelete(selectedTenant.id, selectedTenant.full_name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Create Lease Dialog */}
      <Dialog open={leaseOpen} onOpenChange={setLeaseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Lease for {selectedTenant?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={leaseForm.start_date} onChange={(e) => setLeaseForm({ ...leaseForm, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={leaseForm.end_date} onChange={(e) => setLeaseForm({ ...leaseForm, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Monthly Rent (KES)</Label><Input type="number" value={leaseForm.rent_amount} onChange={(e) => setLeaseForm({ ...leaseForm, rent_amount: e.target.value })} placeholder="25000" /></div>
              <div><Label>Deposit (KES)</Label><Input type="number" value={leaseForm.deposit_amount} onChange={(e) => setLeaseForm({ ...leaseForm, deposit_amount: e.target.value })} placeholder="50000" /></div>
            </div>
            <Button onClick={handleCreateLease} disabled={createLease.isPending} className="w-full">
              {createLease.isPending ? "Creating..." : "Create Lease"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite / Share Portal Access Dialog */}
      <Dialog open={!!inviteTenant} onOpenChange={(o) => { if (!o) { setInviteTenant(null); setCopiedSignup(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Portal Access — {inviteTenant?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Send these instructions to your tenant so they can sign in and view their invoices, payments, and maintenance requests.
            </p>

            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
              <p className="font-medium text-foreground">Steps for {inviteTenant?.full_name}:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                <li>Go to <span className="font-mono font-medium text-foreground">{window.location.origin}/signup</span></li>
                <li>
                  Sign up using this email:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {inviteTenant?.email || "(no email on file — please edit tenant and add an email first)"}
                  </span>
                </li>
                <li>Select <span className="font-medium text-foreground">"Tenant"</span> as your account type</li>
                <li>Your account will automatically link to this property</li>
              </ol>
            </div>

            {!inviteTenant?.email && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
                No email saved for this tenant. Edit the tenant first and add their email address.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  const link = `${window.location.origin}/signup`;
                  navigator.clipboard.writeText(link);
                  setCopiedSignup(true);
                  setTimeout(() => setCopiedSignup(false), 2000);
                }}
              >
                {copiedSignup ? (
                  <><CheckCircle2 className="h-4 w-4 text-success" /> Copied!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy Signup Link</>
                )}
              </Button>
              {inviteTenant?.email && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    const body = `Hi ${inviteTenant.full_name},\n\nYou can now access your tenant portal on NyumbaHub to view your invoices, payments, and maintenance requests.\n\n1. Go to ${window.location.origin}/signup\n2. Sign up using this email: ${inviteTenant.email}\n3. Select "Tenant" as your account type\n\nYour account will automatically link to your rental unit.`;
                    window.open(`mailto:${inviteTenant.email}?subject=Access your NyumbaHub tenant portal&body=${encodeURIComponent(body)}`);
                  }}
                >
                  <Mail className="h-4 w-4" /> Open Email
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
