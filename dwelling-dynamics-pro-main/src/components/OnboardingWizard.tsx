import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Building2, Home, Users, FileText, ChevronRight, X } from "lucide-react";
import { useCreateProperty } from "@/hooks/useProperties";
import { useCreateUnit } from "@/hooks/useUnits";
import { useCreateTenant } from "@/hooks/useTenants";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Property", icon: Building2, description: "Add your first property" },
  { id: 2, label: "Unit", icon: Home, description: "Add a rentable unit" },
  { id: 3, label: "Tenant", icon: Users, description: "Add a tenant" },
  { id: 4, label: "Invoice", icon: FileText, description: "Generate first invoice" },
];

interface Props {
  onDismiss: () => void;
}

export default function OnboardingWizard({ onDismiss }: Props) {
  const { user } = useAuth();
  const createProperty = useCreateProperty();
  const createUnit = useCreateUnit();
  const createTenant = useCreateTenant();
  const createInvoice = useCreateInvoice();

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [tenantId, setTenantId] = useState("");

  const [propertyForm, setPropertyForm] = useState({ name: "", address: "", city: "Nairobi", property_type: "apartment" });
  const [unitForm, setUnitForm] = useState({ unit_number: "", bedrooms: "1", rent_amount: "", currency: "KES" });
  const [tenantForm, setTenantForm] = useState({ full_name: "", phone: "", email: "" });
  const [invoiceForm, setInvoiceForm] = useState({ amount: "", due_date: "", notes: "" });

  const handleProperty = async () => {
    if (!propertyForm.name.trim()) return toast.error("Property name is required");
    try {
      const data = await createProperty.mutateAsync({
        name: propertyForm.name,
        address: propertyForm.address,
        city: propertyForm.city,
        property_type: propertyForm.property_type,
      });
      setPropertyId(data.id);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to create property");
    }
  };

  const handleUnit = async () => {
    if (!unitForm.unit_number.trim() || !unitForm.rent_amount) return toast.error("Unit number and rent are required");
    try {
      const data = await createUnit.mutateAsync({
        property_id: propertyId,
        unit_number: unitForm.unit_number,
        bedrooms: Number(unitForm.bedrooms),
        rent_amount: Number(unitForm.rent_amount),
        currency: unitForm.currency,
      });
      setUnitId(data.id);
      setInvoiceForm((f) => ({ ...f, amount: unitForm.rent_amount }));
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Failed to create unit");
    }
  };

  const handleTenant = async () => {
    if (!tenantForm.full_name.trim()) return toast.error("Tenant name is required");
    try {
      const data = await createTenant.mutateAsync({
        full_name: tenantForm.full_name,
        phone: tenantForm.phone || undefined,
        email: tenantForm.email || undefined,
        unit_id: unitId,
      });
      setTenantId(data.id);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      setInvoiceForm((f) => ({ ...f, due_date: nextMonth.toISOString().slice(0, 10) }));
      setStep(4);
    } catch (err: any) {
      toast.error(err.message || "Failed to create tenant");
    }
  };

  const handleInvoice = async () => {
    if (!invoiceForm.amount || !invoiceForm.due_date) return toast.error("Amount and due date are required");
    try {
      await createInvoice.mutateAsync({
        tenant_id: tenantId,
        amount: Number(invoiceForm.amount),
        due_date: invoiceForm.due_date,
        invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
        notes: invoiceForm.notes || "Monthly Rent",
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  const skipStep = () => setStep((s) => s + 1);

  if (done) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center space-y-4">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h2 className="font-heading text-2xl font-bold text-foreground">You're all set!</h2>
        <p className="text-muted-foreground">Your property, unit, tenant, and first invoice are ready. Start exploring your dashboard.</p>
        <Button onClick={onDismiss} variant="hero">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card shadow-lg overflow-hidden">
      <div className="bg-primary/5 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Welcome to NyumbaHub!</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Let's set up your first property in 4 quick steps</p>
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors" title="Dismiss">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors ${step > s.id ? "bg-success text-white" : step === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
              </div>
              {!step || <span className={`text-xs font-medium hidden sm:block ${step === s.id ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>}
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${step > s.id ? "bg-success" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {step === 1 && (
          <>
            <h3 className="font-heading text-lg font-semibold">Add your first property</h3>
            <div><Label>Property Name *</Label><Input value={propertyForm.name} onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })} placeholder="e.g. Kilimani Apartments" /></div>
            <div><Label>Address</Label><Input value={propertyForm.address} onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })} placeholder="e.g. Ngong Road, Kilimani" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={propertyForm.city} onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })} placeholder="Nairobi" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={propertyForm.property_type} onValueChange={(v) => setPropertyForm({ ...propertyForm, property_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="bedsitter">Bedsitter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleProperty} disabled={createProperty.isPending} className="w-full gap-2">
              {createProperty.isPending ? "Saving…" : <><span>Continue</span><ChevronRight className="h-4 w-4" /></>}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="font-heading text-lg font-semibold">Add a unit to rent out</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Unit Number *</Label><Input value={unitForm.unit_number} onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })} placeholder="e.g. A1" /></div>
              <div>
                <Label>Bedrooms</Label>
                <Select value={unitForm.bedrooms} onValueChange={(v) => setUnitForm({ ...unitForm, bedrooms: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Bedsitter", "1", "2", "3", "4", "5+"].map((b, i) => (
                      <SelectItem key={b} value={i === 0 ? "0" : b}>{b === "0" ? "Bedsitter" : `${b} Bed`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Monthly Rent (KES) *</Label><Input type="number" value={unitForm.rent_amount} onChange={(e) => setUnitForm({ ...unitForm, rent_amount: e.target.value })} placeholder="25000" /></div>
            <div className="flex gap-2">
              <Button onClick={handleUnit} disabled={createUnit.isPending} className="flex-1 gap-2">
                {createUnit.isPending ? "Saving…" : <><span>Continue</span><ChevronRight className="h-4 w-4" /></>}
              </Button>
              <Button variant="outline" onClick={skipStep}>Skip</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="font-heading text-lg font-semibold">Add your first tenant</h3>
            <div><Label>Full Name *</Label><Input value={tenantForm.full_name} onChange={(e) => setTenantForm({ ...tenantForm, full_name: e.target.value })} placeholder="e.g. Grace Wanjiku" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={tenantForm.phone} onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })} placeholder="+254 7XX XXX" /></div>
              <div><Label>Email</Label><Input type="email" value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} placeholder="grace@email.com" /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTenant} disabled={createTenant.isPending} className="flex-1 gap-2">
                {createTenant.isPending ? "Saving…" : <><span>Continue</span><ChevronRight className="h-4 w-4" /></>}
              </Button>
              <Button variant="outline" onClick={skipStep}>Skip</Button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="font-heading text-lg font-semibold">Generate the first invoice</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Amount (KES) *</Label><Input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} placeholder="25000" /></div>
              <div><Label>Due Date *</Label><Input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} /></div>
            </div>
            <div><Label>Notes</Label><Input value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Rent for August 2026" /></div>
            <div className="flex gap-2">
              <Button onClick={handleInvoice} disabled={createInvoice.isPending} className="flex-1 gap-2">
                {createInvoice.isPending ? "Saving…" : <><span>Finish Setup</span><CheckCircle2 className="h-4 w-4" /></>}
              </Button>
              <Button variant="outline" onClick={() => setDone(true)}>Skip</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
