import { useState } from "react";
import { Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTenantRecord, useMyMaintenance, useSubmitMaintenance } from "@/hooks/useTenantRecord";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning border-0",
  in_progress: "bg-info/10 text-info border-0",
  resolved: "bg-success/10 text-success border-0",
  closed: "bg-muted text-muted-foreground border-0",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-0",
  medium: "bg-warning/10 text-warning border-0",
  high: "bg-destructive/10 text-destructive border-0",
  urgent: "bg-destructive text-destructive-foreground border-0",
};

const emptyForm = { title: "", description: "", priority: "medium" };

export default function TenantMaintenance() {
  const { data: tenant } = useTenantRecord();
  const { data: requests, isLoading } = useMyMaintenance(tenant?.id);
  const submitRequest = useSubmitMaintenance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const unit = tenant?.unit as any;

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Please describe the issue");
    if (!tenant?.id || !unit?.id) return toast.error("You must be assigned to a unit to submit a request");
    try {
      await submitRequest.mutateAsync({
        tenant_id: tenant.id,
        unit_id: unit.id,
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
      });
      toast.success("Maintenance request submitted");
      setOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const open_count = requests?.filter((r) => r.status === "open").length ?? 0;
  const in_progress = requests?.filter((r) => r.status === "in_progress").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Maintenance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Submit and track repair requests for your unit</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={() => setOpen(true)} disabled={!unit?.id}>
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      {!unit?.id && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
          You need to be assigned to a unit before submitting maintenance requests. Contact your landlord.
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card text-center">
          <div className="font-heading text-3xl font-bold text-warning">{open_count}</div>
          <div className="mt-1 text-sm text-muted-foreground">Open</div>
        </div>
        <div className="stat-card text-center">
          <div className="font-heading text-3xl font-bold text-info">{in_progress}</div>
          <div className="mt-1 text-sm text-muted-foreground">In Progress</div>
        </div>
        <div className="stat-card text-center">
          <div className="font-heading text-3xl font-bold text-success">
            {requests?.filter((r) => r.status === "resolved").length ?? 0}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">Resolved</div>
        </div>
      </div>

      {/* Requests list */}
      {!requests?.length ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">No requests yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Submit a maintenance request and we'll track it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="stat-card space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-medium text-card-foreground">{req.title}</h3>
                <div className="flex shrink-0 gap-2">
                  <Badge variant="secondary" className={`${priorityColors[req.priority] ?? ""} capitalize text-xs`}>
                    {req.priority}
                  </Badge>
                  <Badge variant="secondary" className={`${statusColors[req.status] ?? ""} capitalize text-xs`}>
                    {req.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              {req.description && (
                <p className="text-sm text-muted-foreground">{req.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Submitted {new Date(req.created_at).toLocaleDateString()}</span>
                {req.resolved_at && (
                  <span>Resolved {new Date(req.resolved_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New request dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Maintenance Request</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Issue Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Leaking tap in bathroom, Broken window latch"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide any additional details about the issue..."
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — Not urgent</SelectItem>
                  <SelectItem value="medium">Medium — Needs attention</SelectItem>
                  <SelectItem value="high">High — Affecting daily life</SelectItem>
                  <SelectItem value="urgent">Urgent — Safety issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} disabled={submitRequest.isPending} className="w-full">
              {submitRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
