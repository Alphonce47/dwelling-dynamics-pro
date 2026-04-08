import { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, CreditCard, FileText, Wrench, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInvoices } from "@/hooks/useInvoices";
import { useLeases } from "@/hooks/useLeases";
import { useMaintenance } from "@/hooks/useMaintenance";
import { usePayments } from "@/hooks/usePayments";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  type: "warning" | "error" | "info" | "success";
  link: string;
  time: Date;
};

export default function NotificationCenter() {
  const { data: invoices } = useInvoices();
  const { data: leases } = useLeases();
  const { data: maintenance } = useMaintenance();
  const { data: payments } = usePayments();
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("nyumbahub-dismissed-notifs") || "[]");
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("nyumbahub-dismissed-notifs", JSON.stringify(dismissed));
  }, [dismissed]);

  const now = new Date();
  const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

  const notifications: Notification[] = [];

  // Overdue invoices
  (invoices ?? []).filter(i => i.status === "overdue").slice(0, 5).forEach(inv => {
    notifications.push({
      id: `inv-overdue-${inv.id}`,
      icon: FileText,
      title: "Overdue Invoice",
      description: `${inv.invoice_number} — KES ${Number(inv.amount).toLocaleString()}`,
      type: "error",
      link: "/dashboard/invoices",
      time: new Date(inv.due_date),
    });
  });

  // Expiring leases
  (leases ?? []).filter(l => {
    if (l.status !== "active") return false;
    const diff = new Date(l.end_date).getTime() - now.getTime();
    return diff > 0 && diff <= DAYS_30;
  }).forEach(l => {
    notifications.push({
      id: `lease-exp-${l.id}`,
      icon: Clock,
      title: "Lease Expiring",
      description: `Expires ${new Date(l.end_date).toLocaleDateString()}`,
      type: "warning",
      link: "/dashboard/tenants",
      time: new Date(l.end_date),
    });
  });

  // Open maintenance requests
  (maintenance ?? []).filter(m => m.status === "open").slice(0, 3).forEach(m => {
    notifications.push({
      id: `maint-${m.id}`,
      icon: Wrench,
      title: "Open Request",
      description: m.title,
      type: "info",
      link: "/dashboard/maintenance",
      time: new Date(m.created_at),
    });
  });

  // Recent payments
  (payments ?? []).filter(p => {
    const diff = now.getTime() - new Date(p.payment_date).getTime();
    return p.status === "confirmed" && diff < 2 * 24 * 60 * 60 * 1000;
  }).slice(0, 3).forEach(p => {
    notifications.push({
      id: `pay-${p.id}`,
      icon: CreditCard,
      title: "Payment Received",
      description: `KES ${Number(p.amount).toLocaleString()} via ${p.method}`,
      type: "success",
      link: "/dashboard/payments",
      time: new Date(p.payment_date),
    });
  });

  const visible = notifications.filter(n => !dismissed.includes(n.id));
  const unread = visible.length;

  const typeStyles = {
    error: "border-destructive/20 bg-destructive/5",
    warning: "border-warning/20 bg-warning/5",
    info: "border-info/20 bg-info/5",
    success: "border-success/20 bg-success/5",
  };

  const iconStyles = {
    error: "text-destructive",
    warning: "text-warning",
    info: "text-info",
    success: "text-success",
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-heading text-sm font-semibold text-foreground">Notifications</h4>
          {unread > 0 && (
            <button
              onClick={() => setDismissed(d => [...d, ...visible.map(n => n.id)])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {visible.map(n => (
                <div key={n.id} className={cn("flex items-start gap-3 rounded-lg border p-3", typeStyles[n.type])}>
                  <n.icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconStyles[n.type])} />
                  <Link to={n.link} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDismissed(d => [...d, n.id]); }}
                    className="shrink-0 rounded p-0.5 opacity-40 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
