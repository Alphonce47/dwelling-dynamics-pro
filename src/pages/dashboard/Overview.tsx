import { Building2, Users, CreditCard, AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";

const monthlyData = [
  { month: "Jan", collected: 820000, expected: 900000 },
  { month: "Feb", collected: 870000, expected: 900000 },
  { month: "Mar", collected: 890000, expected: 920000 },
  { month: "Apr", collected: 910000, expected: 920000 },
  { month: "May", collected: 850000, expected: 950000 },
  { month: "Jun", collected: 930000, expected: 950000 },
];

const occupancyData = [
  { name: "Occupied", value: 42, color: "hsl(152, 55%, 36%)" },
  { name: "Vacant", value: 6, color: "hsl(35, 90%, 55%)" },
  { name: "Under Maintenance", value: 2, color: "hsl(210, 80%, 55%)" },
];

const recentPayments = [
  { tenant: "Grace Wanjiku", unit: "Sunrise A-12", amount: 25000, method: "M-Pesa", time: "2 min ago" },
  { tenant: "Peter Ochieng", unit: "Kilimani B-4", amount: 35000, method: "Bank (KCB)", time: "15 min ago" },
  { tenant: "Mary Akinyi", unit: "Sunrise A-8", amount: 25000, method: "M-Pesa", time: "1 hr ago" },
  { tenant: "James Mwangi", unit: "Westlands C-2", amount: 45000, method: "Bank (Equity)", time: "3 hrs ago" },
  { tenant: "Faith Njeri", unit: "Kilimani B-7", amount: 35000, method: "M-Pesa", time: "5 hrs ago" },
];

const formatKES = (v: number) => `KES ${(v / 1000).toFixed(0)}K`;

const stats = [
  { label: "Total Properties", value: "8", icon: Building2, change: "+2", up: true, color: "text-primary" },
  { label: "Total Tenants", value: "42", icon: Users, change: "+5", up: true, color: "text-info" },
  { label: "Collected (Jun)", value: "KES 930K", icon: CreditCard, change: "+9.4%", up: true, color: "text-success" },
  { label: "Outstanding Arrears", value: "KES 185K", icon: AlertTriangle, change: "-12%", up: false, color: "text-warning" },
];

export default function Overview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back, John. Here's your portfolio at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <span className={`flex items-center gap-1 text-xs font-medium ${s.up ? "text-success" : "text-warning"}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {s.change}
              </span>
            </div>
            <div className="mt-3 font-heading text-2xl font-bold text-card-foreground">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="stat-card lg:col-span-2">
          <h3 className="font-heading text-lg font-semibold text-card-foreground">Monthly Collections</h3>
          <p className="text-sm text-muted-foreground">Expected vs collected rent</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                <YAxis tickFormatter={formatKES} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                <Bar dataKey="expected" fill="hsl(210, 15%, 88%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" fill="hsl(152, 55%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="stat-card">
          <h3 className="font-heading text-lg font-semibold text-card-foreground">Occupancy</h3>
          <p className="text-sm text-muted-foreground">50 total units</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                  {occupancyData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {occupancyData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium text-card-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-card-foreground">Recent Payments</h3>
            <p className="text-sm text-muted-foreground">Latest transactions</p>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-3 text-left font-medium">Tenant</th>
                <th className="pb-3 text-left font-medium">Unit</th>
                <th className="pb-3 text-right font-medium">Amount</th>
                <th className="pb-3 text-left font-medium">Method</th>
                <th className="pb-3 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 font-medium text-card-foreground">{p.tenant}</td>
                  <td className="py-3 text-muted-foreground">{p.unit}</td>
                  <td className="py-3 text-right font-medium text-card-foreground">KES {p.amount.toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.method.includes("M-Pesa") ? "bg-success/10 text-success" : "bg-info/10 text-info"
                    }`}>
                      {p.method}
                    </span>
                  </td>
                  <td className="py-3 text-right text-muted-foreground">{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
