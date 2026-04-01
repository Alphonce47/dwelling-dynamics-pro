import { Building2, Plus, MapPin, Users, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const mockProperties = [
  { id: 1, name: "Sunrise Apartments", location: "Kilimani, Nairobi", units: 16, occupied: 14, revenue: 400000, type: "Apartments" },
  { id: 2, name: "Greenview Residences", location: "Westlands, Nairobi", units: 12, occupied: 11, revenue: 540000, type: "Apartments" },
  { id: 3, name: "Lakeview Heights", location: "Kisumu CBD", units: 8, occupied: 7, revenue: 168000, type: "Apartments" },
  { id: 4, name: "Coastal Breeze", location: "Nyali, Mombasa", units: 6, occupied: 5, revenue: 180000, type: "Townhouses" },
  { id: 5, name: "Karen Villas", location: "Karen, Nairobi", units: 4, occupied: 3, revenue: 360000, type: "Villas" },
  { id: 6, name: "Parklands Suites", location: "Parklands, Nairobi", units: 4, occupied: 2, revenue: 80000, type: "Bedsitters" },
];

export default function Properties() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mockProperties.length} properties, {mockProperties.reduce((a, p) => a + p.units, 0)} total units</p>
        </div>
        <Button variant="hero" className="gap-2">
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockProperties.map((p) => (
          <div key={p.id} className="stat-card cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{p.type}</span>
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">{p.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {p.location}
            </div>
            <div className="mt-4 flex items-center gap-4 border-t pt-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-card-foreground font-medium">{p.occupied}/{p.units}</span>
                <span className="text-muted-foreground">units</span>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                <div className="font-heading text-sm font-bold text-card-foreground">KES {(p.revenue / 1000).toFixed(0)}K</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(p.occupied / p.units) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{Math.round((p.occupied / p.units) * 100)}% occupied</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
