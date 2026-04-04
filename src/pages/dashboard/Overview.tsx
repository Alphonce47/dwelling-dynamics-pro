import { Building2, Users, CreditCard, ArrowUpRight, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { usePayments } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "react-router-dom";

const formatKES = (v: number) =>
  v >= 1_000_000 ? `KES ${(v / 1_000_000).toFixed(1)}M` : `KES ${(v / 1000).toFixed(0)}K`;

export default function Overview() {
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();
  const { data: payments } = usePayments();
  const { data: invoices } = useInvoices();
  const { data: profile } = useProfile();

  const allUnits = properties?.flatMap((p) => p.units ?? []) ?? [];
  const occupied = allUnits.filter((u: any) => u.status === "occupied").length;
  const vacant = allUnits.filter((u: any) => u.status === "vacant").length;
  const maintenance = allUnits.filter((u: any) => u.status === "maintenance").length;

  const confirmed = payments?.filter((p) => p.status === "confirmed") ?? [];
  const totalCollected = confirmed.reduce((a, p) => a + Number(p.amount), 0);

  // This month's collection
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCollected = confirmed
    .filter((p) => new Date(p.payment_date) >= monthStart)
    .reduce((a, p) => a + Number(p.amount), 0);

  // Expected rent = sum of all occupied unit rents
  const expectedRent = allUnits
    .filter((u: any) => u.status === "occupied")
    .reduce((a: number, u: any) => a + Number(u.rent_amount ?? 0), 0);

  const collectionPct = expectedRent > 0 ? Math.min(100, Math.round((monthCollected / expectedRent) * 100)) : 0;

  // Overdue invoices
  const overdueInvoices = invoices?.filter((i) => i.status === "overdue") ?? [];
  const overdueAmount = overdueInvoices.reduce((a, i) => a + Number(i.amount), 0);

  const occupancyData = [
    { name: "Occupied", value: occupied, color: "hsl(152, 55%, 36%)" },
    { name: "Vacant", value: vacant, color: "hsl(35, 90%, 55%)" },
    { name: "Maintenance", value: maintenance, color: "hsl(210, 80%, 55%)" },
  ].filter((d) => d.value > 0);

  const stats = [
    { label: "Total Properties", value: String(properties?.length ?? 0), icon: Building2, color: "text-primary" },
    { label: "Total Tenants", value: String(tenants?.length ?? 0), icon: Users, color: "text-info" },
    { label: "All-time Collected", value: formatKES(totalCollected), icon: CreditCard, color: "text-success" },
    { label: "Total Units", value: String(allUnits.length), icon: Building2, color: "text-warning" },
  ];

  const recentPayments = (payments ?? []).slice(0, 5);
  const monthName = now.toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}. Here's your portfolio at a glance.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="mt-3 font-heading text-2xl font-bold text-card-foreground">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* This month collection progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="stat-card lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-card-foreground">{monthName} Collection</h3>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="font-heading text-2xl font-bold text-card-foreground">{formatKES(monthCollected)}</span>
              <span className="text-sm text-muted-foreground">of {formatKES(expectedRent)}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-3 rounded-full bg-success transition-all duration-500"
                style={{ width: `${collectionPct}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{collectionPct}% collected this month</p>
          </div>
          {overdueInvoices.length > 0 && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
              <p className="text-sm font-medium text-destructive">{overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? "s" : ""}</p>
              <p className="text-xs text-muted-foreground">KES {overdueAmount.toLocaleString()} outstanding</p>
              <Link to="/dashboard/invoices" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline">
                View invoices <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Occupancy */}
        <div className="stat-card lg:col-span-1">
          <h3 className="font-heading text-lg font-semibold text-card-foreground">Occupancy</h3>
          <p className="text-sm text-muted-foreground">{allUnits.length} total units</p>
          {allUnits.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Add properties to see occupancy</div>
          ) : (
            <div className="mt-2 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none">
                    {occupancyData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 space-y-1.5">
            {occupancyData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium text-card-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="stat-card lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-card-foreground">Recent Payments</h3>
            <Link to="/dashboard/payments" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No payments yet</div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentPayments.map((p) => {
                const tenant = p.tenant as any;
                return (
                  <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-card-foreground">{tenant?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</div>
                    </div>
                    <div className="font-heading text-sm font-bold text-success">KES {Number(p.amount).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
