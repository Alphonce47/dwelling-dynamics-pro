import { useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayments } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { useProperties } from "@/hooks/useProperties";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "#f59e0b"];

export default function Reports() {
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: properties } = useProperties();

  const isLoading = loadingPayments || loadingInvoices;

  // Monthly collection data (last 6 months)
  const monthlyData = useMemo(() => {
    if (!payments) return [];
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return { start: startOfMonth(date), end: endOfMonth(date), label: format(date, "MMM yyyy") };
    });

    return months.map(({ start, end, label }) => {
      const monthPayments = payments.filter(
        (p) => p.status === "confirmed" && isWithinInterval(new Date(p.payment_date), { start, end })
      );
      return { month: label, collected: monthPayments.reduce((sum, p) => sum + p.amount, 0) };
    });
  }, [payments]);

  // Invoice status breakdown
  const invoiceBreakdown = useMemo(() => {
    if (!invoices) return [];
    const counts: Record<string, number> = {};
    invoices.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  // Summary stats
  const stats = useMemo(() => {
    const totalCollected = payments?.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amount, 0) || 0;
    const totalOutstanding = invoices?.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + i.amount, 0) || 0;
    const overdueCount = invoices?.filter((i) => i.status === "overdue").length || 0;
    const totalProperties = properties?.length || 0;
    return { totalCollected, totalOutstanding, overdueCount, totalProperties };
  }, [payments, invoices, properties]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Financial overview and collection trends</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="font-heading text-lg font-bold text-foreground">KES {stats.totalCollected.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="font-heading text-lg font-bold text-foreground">KES {stats.totalOutstanding.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue Invoices</p>
              <p className="font-heading text-lg font-bold text-foreground">{stats.overdueCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Properties</p>
              <p className="font-heading text-lg font-bold text-foreground">{stats.totalProperties}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Collections (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.some((d) => d.collected > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Collected"]} />
                  <Bar dataKey="collected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">No payment data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            {invoiceBreakdown.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={invoiceBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {invoiceBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">No invoice data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
