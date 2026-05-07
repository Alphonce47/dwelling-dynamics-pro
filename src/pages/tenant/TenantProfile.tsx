import { useState, useEffect } from "react";
import { useTenantRecord, useUpdateTenantProfile } from "@/hooks/useTenantRecord";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Shield, Home } from "lucide-react";
import { toast } from "sonner";

export default function TenantProfile() {
  const { user } = useAuth();
  const { data: tenant, isLoading } = useTenantRecord();
  const updateProfile = useUpdateTenantProfile();

  const [form, setForm] = useState({
    phone: "",
    email: "",
    emergency_contact: "",
    emergency_phone: "",
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        phone: tenant.phone ?? "",
        email: tenant.email ?? "",
        emergency_contact: tenant.emergency_contact ?? "",
        emergency_phone: tenant.emergency_phone ?? "",
      });
    }
  }, [tenant?.id]);

  const handleSave = async () => {
    if (!tenant) return;
    try {
      await updateProfile.mutateAsync({ id: tenant.id, ...form });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const unit = tenant?.unit as any;
  const property = unit?.property;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Keep your contact information up to date</p>
      </div>

      {/* Account info */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-card-foreground">Account</h2>
        </div>
        <div>
          <Label>Full Name</Label>
          <Input value={tenant?.full_name ?? ""} disabled className="mt-1 bg-muted" />
        </div>
        <div>
          <Label>Login Email</Label>
          <Input value={user?.email ?? ""} disabled className="mt-1 bg-muted" />
          <p className="mt-1 text-xs text-muted-foreground">Login email cannot be changed here</p>
        </div>
        {tenant?.id_number && (
          <div>
            <Label>ID / Passport Number</Label>
            <Input value={tenant.id_number} disabled className="mt-1 bg-muted" />
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-card-foreground">Contact Information</h2>
        </div>
        <div>
          <Label>Phone Number</Label>
          <Input
            className="mt-1"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+254 7XX XXX XXX"
          />
        </div>
        <div>
          <Label>Personal Email</Label>
          <Input
            className="mt-1"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Emergency contact */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-card-foreground">Emergency Contact</h2>
        </div>
        <div>
          <Label>Emergency Contact Name</Label>
          <Input
            className="mt-1"
            value={form.emergency_contact}
            onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
            placeholder="e.g. Jane Kamau (Sister)"
          />
        </div>
        <div>
          <Label>Emergency Contact Phone</Label>
          <Input
            className="mt-1"
            value={form.emergency_phone}
            onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
            placeholder="+254 7XX XXX XXX"
          />
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending} variant="outline">
          {updateProfile.isPending ? "Saving..." : "Save Emergency Contact"}
        </Button>
      </div>

      {/* Rental info */}
      <div className="stat-card space-y-3">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-card-foreground">Rental Details</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b py-1.5">
            <span className="text-muted-foreground">Property</span>
            <span className="font-medium text-card-foreground">{property?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between border-b py-1.5">
            <span className="text-muted-foreground">Unit</span>
            <span className="font-medium text-card-foreground">{unit ? `Unit ${unit.unit_number}` : "—"}</span>
          </div>
          {property?.address && (
            <div className="flex justify-between border-b py-1.5">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-card-foreground">{property.address}, {property.city}</span>
            </div>
          )}
          {tenant?.move_in_date && (
            <div className="flex justify-between border-b py-1.5">
              <span className="text-muted-foreground">Move-in Date</span>
              <span className="font-medium text-card-foreground">{new Date(tenant.move_in_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
