import { Users, Plus, Search, Filter, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTenants, useCreateTenant } from "@/hooks/useTenants";
import { useProperties } from "@/hooks/useProperties";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Tenants() {
  const { data: tenants, isLoading } = useTenants();
  const { data: properties } = useProperties();
  const createTenant = useCreateTenant();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", id_number: "", unit_id: "" });

  const filtered = tenants?.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.unit as any)?.property?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (t.unit as any)?.unit_number?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const allUnits = properties?.flatMap((p) =>
    (p.units ?? []).map((u: any) => ({
      id: u.id,
      label: `${p.name} — Unit ${u.unit_number}`,
    }))
  ) ?? [];

  const handleCreate = async () => {
    if (!form.full_name.trim()) return toast.error("Tenant name is required");
    try {
      await createTenant.mutateAsync({
        ...form,
        unit_id: form.unit_id || undefined,
      });
      toast.success("Tenant created");
      setOpen(false);
      setForm({ full_name: "", phone: "", email: "", id_number: "", unit_id: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create tenant");
    }
  };

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="gap-2">
              <Plus className="h-4 w-4" /> Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
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
              <Button onClick={handleCreate} disabled={createTenant.isPending} className="w-full">
                {createTenant.isPending ? "Creating..." : "Create Tenant"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tenants, properties, or units..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const unit = t.unit as any;
                const activeLease = (t.leases as any[])?.find((l) => l.status === "active");
                return (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
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
