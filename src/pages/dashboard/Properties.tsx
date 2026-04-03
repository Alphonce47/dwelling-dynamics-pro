import { Building2, Plus, MapPin, Users, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useProperties, useCreateProperty } from "@/hooks/useProperties";
import { useCreateUnit } from "@/hooks/useUnits";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Properties() {
  const { data: properties, isLoading } = useProperties();
  const createProperty = useCreateProperty();
  const createUnit = useCreateUnit();
  const [open, setOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [form, setForm] = useState({ name: "", address: "", city: "Nairobi", property_type: "apartment" });
  const [unitForm, setUnitForm] = useState({ unit_number: "", rent_amount: "", bedrooms: "1", bathrooms: "1" });

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Property name is required");
    try {
      await createProperty.mutateAsync(form);
      toast.success("Property created successfully");
      setOpen(false);
      setForm({ name: "", address: "", city: "Nairobi", property_type: "apartment" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create property");
    }
  };

  const handleCreateUnit = async () => {
    if (!unitForm.unit_number.trim()) return toast.error("Unit number is required");
    try {
      await createUnit.mutateAsync({
        property_id: selectedPropertyId,
        unit_number: unitForm.unit_number,
        rent_amount: Number(unitForm.rent_amount) || 0,
        bedrooms: Number(unitForm.bedrooms) || 1,
        bathrooms: Number(unitForm.bathrooms) || 1,
      });
      toast.success("Unit added");
      setUnitOpen(false);
      setUnitForm({ unit_number: "", rent_amount: "", bedrooms: "1", bathrooms: "1" });
    } catch (err: any) {
      toast.error(err.message || "Failed to add unit");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalUnits = properties?.reduce((a, p) => a + (p.units?.length ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">{properties?.length ?? 0} properties, {totalUnits} total units</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="gap-2">
              <Plus className="h-4 w-4" /> Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Property Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sunrise Apartments" />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Ngong Road, Kilimani" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="bedsitter">Bedsitter</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createProperty.isPending} className="w-full">
                {createProperty.isPending ? "Creating..." : "Create Property"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {properties?.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">No properties yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add your first property to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties?.map((p) => {
            const units = p.units ?? [];
            const occupied = units.filter((u: any) => u.status === "occupied").length;
            const totalRent = units.reduce((a: number, u: any) => a + Number(u.rent_amount ?? 0), 0);

            return (
              <div key={p.id} className="stat-card cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">{p.property_type}</span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">{p.name}</h3>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {p.address ? `${p.address}, ` : ""}{p.city}
                </div>
                <div className="mt-4 flex items-center gap-4 border-t pt-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-card-foreground font-medium">{occupied}/{units.length}</span>
                    <span className="text-muted-foreground">units</span>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs text-muted-foreground">Expected Rent</div>
                    <div className="font-heading text-sm font-bold text-card-foreground">KES {(totalRent / 1000).toFixed(0)}K</div>
                  </div>
                </div>
                {units.length > 0 && (
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${(occupied / units.length) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{Math.round((occupied / units.length) * 100)}% occupied</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
