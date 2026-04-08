import { useState, useMemo } from "react";
import { Wrench, Plus, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMaintenanceRequests, useCreateMaintenanceRequest, useUpdateMaintenanceStatus } from "@/hooks/useMaintenance";
import { useTenants } from "@/hooks/useTenants";
import FileUpload from "@/components/FileUpload";
import { toast } from "sonner";

const PAGE_SIZE = 18;

const statusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning border-0",
  assigned: "bg-info/10 text-info border-0",
  in_progress: "bg-primary/10 text-primary border-0",
  resolved: "bg-success/10 text-success border-0",
  closed: "bg-muted text-muted-foreground border-0",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-0",
  medium: "bg-warning/10 text-warning border-0",
  high: "bg-destructive/10 text-destructive border-0",
  urgent: "bg-destructive text-destructive-foreground border-0",
};

export default function Maintenance() {
  const { data: requests, isLoading } = useMaintenanceRequests();
  const { data: tenants } = useTenants();
  const createRequest = useCreateMaintenanceRequest();
  const updateStatus = useUpdateMaintenanceStatus();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tenant_id: "", title: "", description: "", priority: "medium" as const });
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);

  const tenantsWithUnits = tenants?.filter((t) => t.unit_id) ?? [];

  const filtered = useMemo(() => {
    let list = requests ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const tenant = r.tenant as any;
        const unit = r.unit as any;
        return (
          r.title.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q) ||
          tenant?.full_name?.toLowerCase().includes(q) ||
          unit?.property?.name?.toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (priorityFilter !== "all") list = list.filter((r) => r.priority === priorityFilter);
    return list;
  }, [requests, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async () => {
    if (!form.tenant_id || !form.title.trim()) return toast.error("Select a tenant and provide a title");
    const tenant = tenants?.find((t) => t.id === form.tenant_id);
    if (!tenant?.unit_id) return toast.error("Selected tenant has no unit assigned");
    try {
      await createRequest.mutateAsync({
        tenant_id: form.tenant_id,
        unit_id: tenant.unit_id,
        title: form.title,
        description: photoUrl
          ? `${form.description || ""}${form.description ? "\n\n" : ""}Photo: ${photoUrl}`
          : form.description || undefined,
        priority: form.priority,
      });
      toast.success("Maintenance request created");
      setOpen(false);
      setForm({ tenant_id: "", title: "", description: "", priority: "medium" });
      setPhotoUrl(undefined);
    } catch (err: any) {
      toast.error(err.message || "Failed to create request");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const openCount = requests?.filter((r) => r.status === "open" || r.status === "assigned" || r.status === "in_progress").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Maintenance</h1>
          <p className="mt-1 text-sm text-muted-foreground">{openCount} open · {requests?.length ?? 0} total requests</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="gap-2"><Plus className="h-4 w-4" /> New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Tenant</Label>
                <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                  <SelectContent>
                    {tenantsWithUnits.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Leaking tap in kitchen" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue…" rows={3} /></div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Photo (optional)</Label>
                <div className="mt-1.5">
                  <FileUpload
                    bucket="documents"
                    folder="maintenance"
                    accept="image/*"
                    maxSizeMb={5}
                    label="Attach photo of the issue"
                    onUploaded={(url) => setPhotoUrl(url)}
                    onRemove={() => setPhotoUrl(undefined)}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createRequest.isPending} className="w-full">
                {createRequest.isPending ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, tenant, or property…"
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
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!filtered.length ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">
            {search || statusFilter !== "all" || priorityFilter !== "all" ? "No matching requests" : "No maintenance requests"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || statusFilter !== "all" || priorityFilter !== "all" ? "Try adjusting your filters" : "All caught up! Create a request when something needs fixing."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageData.map((r) => {
              const tenant = r.tenant as any;
              const unit = r.unit as any;
              const hasPhoto = r.description?.includes("Photo: http");
              const photoMatch = r.description?.match(/Photo: (https?:\/\/\S+)/);
              const description = r.description?.replace(/\n?\nPhoto: https?:\/\/\S+/, "") ?? "";

              return (
                <div key={r.id} className="stat-card">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-sm font-semibold text-card-foreground line-clamp-1">{r.title}</h3>
                    <Badge className={priorityColors[r.priority]} variant="secondary">{r.priority}</Badge>
                  </div>
                  {description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>}
                  {hasPhoto && photoMatch && (
                    <a href={photoMatch[1]} target="_blank" rel="noopener noreferrer">
                      <img src={photoMatch[1]} alt="Issue photo" className="mt-2 h-28 w-full rounded-md object-cover border" />
                    </a>
                  )}
                  <div className="mt-3 text-xs text-muted-foreground">
                    <div>{tenant?.full_name} — {unit?.property?.name}, Unit {unit?.unit_number}</div>
                    <div className="mt-0.5">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge className={statusColors[r.status]} variant="secondary">{r.status.replace("_", " ")}</Badge>
                    {r.status !== "resolved" && r.status !== "closed" && (
                      <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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
