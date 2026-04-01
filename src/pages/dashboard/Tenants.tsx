import { Users, Plus, Search, Filter, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const mockTenants = [
  { id: 1, name: "Grace Wanjiku", phone: "+254 712 345 678", email: "grace@email.com", property: "Sunrise Apartments", unit: "A-12", rent: 25000, balance: 0, status: "current", leaseEnd: "2026-12-31" },
  { id: 2, name: "Peter Ochieng", phone: "+254 723 456 789", email: "peter@email.com", property: "Greenview Residences", unit: "B-4", rent: 35000, balance: -35000, status: "arrears", leaseEnd: "2026-09-30" },
  { id: 3, name: "Mary Akinyi", phone: "+254 734 567 890", email: "mary@email.com", property: "Sunrise Apartments", unit: "A-8", rent: 25000, balance: 0, status: "current", leaseEnd: "2027-03-31" },
  { id: 4, name: "James Mwangi", phone: "+254 745 678 901", email: "james@email.com", property: "Coastal Breeze", unit: "C-2", rent: 45000, balance: -90000, status: "arrears", leaseEnd: "2026-06-30" },
  { id: 5, name: "Faith Njeri", phone: "+254 756 789 012", email: "faith@email.com", property: "Greenview Residences", unit: "B-7", rent: 35000, balance: 0, status: "current", leaseEnd: "2027-01-31" },
  { id: 6, name: "David Mutua", phone: "+254 767 890 123", email: "david@email.com", property: "Karen Villas", unit: "V-1", rent: 120000, balance: 0, status: "current", leaseEnd: "2027-06-30" },
  { id: 7, name: "Ann Wambui", phone: "+254 778 901 234", email: "ann@email.com", property: "Lakeview Heights", unit: "L-3", rent: 24000, balance: -24000, status: "arrears", leaseEnd: "2026-08-31" },
];

export default function Tenants() {
  const [search, setSearch] = useState("");
  const filtered = mockTenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.property.toLowerCase().includes(search.toLowerCase()) ||
    t.unit.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tenants</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mockTenants.length} tenants across all properties</p>
        </div>
        <Button variant="hero" className="gap-2">
          <Plus className="h-4 w-4" /> Add Tenant
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenants, properties, or units..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="stat-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Tenant</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Property / Unit</th>
              <th className="px-6 py-3 text-right font-medium text-muted-foreground">Rent</th>
              <th className="px-6 py-3 text-right font-medium text-muted-foreground">Balance</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Lease End</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-card-foreground">{t.name}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-card-foreground">{t.property}</div>
                  <div className="text-xs text-muted-foreground">Unit {t.unit}</div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-card-foreground">
                  KES {t.rent.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${t.balance < 0 ? "text-destructive" : "text-success"}`}>
                    {t.balance === 0 ? "Clear" : `KES ${Math.abs(t.balance).toLocaleString()}`}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={t.status === "current" ? "default" : "destructive"} className={t.status === "current" ? "bg-success/10 text-success hover:bg-success/20 border-0" : ""}>
                    {t.status === "current" ? "Current" : "Arrears"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{t.leaseEnd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
