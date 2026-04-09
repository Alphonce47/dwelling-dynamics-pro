import { useState, useMemo } from "react";
import { Shield, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  INSERT: "bg-success/10 text-success",
  UPDATE: "bg-info/10 text-info",
  DELETE: "bg-destructive/10 text-destructive",
};

const SKIP_FIELDS = new Set(["created_at", "updated_at", "id"]);
const DISPLAY_FIELDS = ["name", "full_name", "title", "status", "amount", "email", "phone", "unit_number", "invoice_number", "method", "role", "action"];

function summariseValues(values: Record<string, any> | null): string {
  if (!values) return "—";
  const entries = Object.entries(values)
    .filter(([k]) => !SKIP_FIELDS.has(k))
    .sort(([a], [b]) => {
      const ai = DISPLAY_FIELDS.indexOf(a);
      const bi = DISPLAY_FIELDS.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .slice(0, 4)
    .map(([k, v]) => {
      const label = k.replace(/_/g, " ");
      const val = v === null ? "–" : typeof v === "object" ? JSON.stringify(v).slice(0, 30) : String(v);
      return `${label}: ${val}`;
    });
  return entries.join(" · ") || "—";
}

function renderChanges(log: { action: string; old_values: any; new_values: any }) {
  if (log.action === "INSERT") {
    return (
      <span className="text-success/80">
        {summariseValues(log.new_values)}
      </span>
    );
  }

  if (log.action === "DELETE") {
    return (
      <span className="text-destructive/80">
        {summariseValues(log.old_values)}
      </span>
    );
  }

  if (log.action === "UPDATE" && log.old_values && log.new_values) {
    const changed = Object.entries(log.new_values)
      .filter(([k, v]) => !SKIP_FIELDS.has(k) && JSON.stringify(log.old_values[k]) !== JSON.stringify(v))
      .slice(0, 3)
      .map(([k, v]) => {
        const label = k.replace(/_/g, " ");
        const oldVal = log.old_values[k] === null ? "–" : String(log.old_values[k]);
        const newVal = v === null ? "–" : String(v);
        return (
          <span key={k}>
            <span className="text-muted-foreground">{label}: </span>
            <span className="text-destructive/70 line-through">{oldVal.slice(0, 20)}</span>
            {" → "}
            <span className="text-success/80">{newVal.slice(0, 20)}</span>
          </span>
        );
      });

    return changed.length ? (
      <span className="flex flex-wrap gap-x-3 gap-y-1">{changed}</span>
    ) : (
      <span className="text-muted-foreground/60 italic">minor update</span>
    );
  }

  return <span className="text-muted-foreground">—</span>;
}

export default function AuditLog() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const isAdmin = profile?.roles?.includes("admin") ?? false;

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit_logs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = logs ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.table_name.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.record_id ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System activity log{!isAdmin && " — showing changes related to your account"}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by table, action, or record ID…" className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">No audit logs</h3>
          <p className="mt-1 text-sm text-muted-foreground">Activity will appear here as changes are made</p>
        </div>
      ) : (
        <>
          <div className="stat-card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Table</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Record</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Changes</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map(log => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge className={actionColors[log.action] ?? "bg-muted text-muted-foreground"} variant="secondary">{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground capitalize">{log.table_name.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{log.record_id?.slice(0, 8) ?? "—"}</td>
                    <td className="px-4 py-3 text-xs max-w-[320px]">
                      {renderChanges(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({filtered.length} entries)</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-md border p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
