import { Building2, Plus, MapPin, Users, DoorOpen, Pencil, Trash2, MoreVertical, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/useProperties";
import { useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/useUnits";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const propertyTypes = ["apartment", "townhouse", "villa", "bedsitter", "commercial"];
const PAGE_SIZE = 12;

const emptyPropertyForm = { name: "", address: "", city: "Nairobi", property_type: "apartment" };
const emptyUnitForm = { unit_number: "", rent_amount: "", bedrooms: "1", bathrooms: "1" };

export default function Properties() {
  const { data: properties, isLoading } = useProperties();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();

  const [open, setOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);

  const [unitOpen, setUnitOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [unitForm, setUnitForm] = useState(emptyUnitForm);

  const openNewProperty = () => {
    setEditingProperty(null);
    setPropertyForm(emptyPropertyForm);
    setOpen(true);
  };

  const openEditProperty = (p: any) => {
    setEditingProperty(p);
    setPropertyForm({ name: p.name, address: p.address ?? "", city: p.city, property_type: p.property_type });
    setOpen(true);
  };

  const openNewUnit = (propertyId: string) => {
    setEditingUnit(null);
    setSelectedPropertyId(propertyId);
    setUnitForm(emptyUnitForm);
    setUnitOpen(true);
  };

  const openEditUnit = (unit: any, propertyId: string) => {
    setEditingUnit(unit);
    setSelectedPropertyId(propertyId);
    setUnitForm({
      unit_number: unit.unit_number,
      rent_amount: String(unit.rent_amount),
      bedrooms: String(unit.bedrooms ?? 1),
      bathrooms: String(unit.bathrooms ?? 1),
    });
    setUnitOpen(true);
  };

  const handleSaveProperty = async () => {
    if (!propertyForm.name.trim()) return toast.error("Property name is required");
    try {
      if (editingProperty) {
        await updateProperty.mutateAsync({ id: editingProperty.id, ...propertyForm });
        toast.success("Property updated");
      } else {
        await createProperty.mutateAsync(propertyForm);
        toast.success("Property created");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save property");
    }
  };

  const handleDeleteProperty = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its units? This cannot be undone.`)) return;
    try {
      await deleteProperty.mutateAsync(id);
      toast.success("Property deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete property");
    }
  };

  const handleSaveUnit = async () => {
    if (!unitForm.unit_number.trim()) return toast.error("Unit number is required");
    try {
      if (editingUnit) {
        await updateUnit.mutateAsync({
          id: editingUnit.id,
          unit_number: unitForm.unit_number,
          rent_amount: Number(unitForm.rent_amount) || 0,
          bedrooms: Number(unitForm.bedrooms) || 1,
          bathrooms: Number(unitForm.bathrooms) || 1,
        });
        toast.success("Unit updated");
      } else {
        await createUnit.mutateAsync({
          property_id: selectedPropertyId,
          unit_number: unitForm.unit_number,
          rent_amount: Number(unitForm.rent_amount) || 0,
          bedrooms: Number(unitForm.bedrooms) || 1,
          bathrooms: Number(unitForm.bathrooms) || 1,
        });
        toast.success("Unit added");
      }
      setUnitOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save unit");
    }
  };

  const handleDeleteUnit = async (id: string, number: string) => {
    if (!confirm(`Delete unit ${number}? This cannot be undone.`)) return;
    try {
      await deleteUnit.mutateAsync(id);
      toast.success("Unit deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete unit");
    }
  };

  const filtered = useMemo(() => {
    let list = properties ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.address ?? "").toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") list = list.filter((p) => p.property_type === typeFilter);
    return list;
  }, [properties, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} of {properties?.length ?? 0} properties · {totalUnits} total units</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={openNewProperty}>
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>

      {/* Search + Filter */}
      {(properties?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, or city…"
              className="pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {propertyTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">
            {search || typeFilter !== "all" ? "No matching properties" : "No properties yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || typeFilter !== "all" ? "Try adjusting your search or filter" : "Add your first property to get started"}
          </p>
        </div>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageData?.map((p) => {
            const units = p.units ?? [];
            const occupied = units.filter((u: any) => u.status === "occupied").length;
            const totalRent = units.reduce((a: number, u: any) => a + Number(u.rent_amount ?? 0), 0);

            return (
              <div key={p.id} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">{p.property_type}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditProperty(p)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Property
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProperty(p.id, p.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Property
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

                {units.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {units.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs">
                        <span className="font-medium text-card-foreground">Unit {u.unit_number}</span>
                        <span className="text-muted-foreground">KES {Number(u.rent_amount).toLocaleString()}</span>
                        <span className={`capitalize ${u.status === "occupied" ? "text-success" : u.status === "maintenance" ? "text-warning" : "text-muted-foreground"}`}>
                          {u.status}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditUnit(u, p.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteUnit(u.id, u.unit_number)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-1.5 text-xs"
                  onClick={() => openNewUnit(p.id)}
                >
                  <DoorOpen className="h-3.5 w-3.5" /> Add Unit
                </Button>
              </div>
            );
          })}
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

      {/* Property dialog (create/edit) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Property Name</Label>
              <Input value={propertyForm.name} onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })} placeholder="e.g. Sunrise Apartments" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={propertyForm.address} onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })} placeholder="e.g. Ngong Road, Kilimani" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={propertyForm.city} onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={propertyForm.property_type} onValueChange={(v) => setPropertyForm({ ...propertyForm, property_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSaveProperty}
              disabled={createProperty.isPending || updateProperty.isPending}
              className="w-full"
            >
              {(createProperty.isPending || updateProperty.isPending) ? "Saving..." : editingProperty ? "Save Changes" : "Create Property"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unit dialog (create/edit) */}
      <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUnit ? "Edit Unit" : "Add Unit"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Unit Number</Label><Input value={unitForm.unit_number} onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })} placeholder="e.g. A1" /></div>
              <div><Label>Rent (KES)</Label><Input type="number" value={unitForm.rent_amount} onChange={(e) => setUnitForm({ ...unitForm, rent_amount: e.target.value })} placeholder="25000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Bedrooms</Label><Input type="number" value={unitForm.bedrooms} onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })} /></div>
              <div><Label>Bathrooms</Label><Input type="number" value={unitForm.bathrooms} onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })} /></div>
            </div>
            <Button onClick={handleSaveUnit} disabled={createUnit.isPending || updateUnit.isPending} className="w-full">
              {(createUnit.isPending || updateUnit.isPending) ? "Saving..." : editingUnit ? "Save Changes" : "Add Unit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
