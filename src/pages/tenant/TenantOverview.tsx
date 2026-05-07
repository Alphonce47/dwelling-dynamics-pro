import { useTenantRecord, useMyInvoices, useMyPayments } from "@/hooks/useTenantRecord";
import { Link } from "react-router-dom";
import { Home, Calendar, CreditCard, Wrench, ArrowUpRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantOverview() {
  const { data: tenant, isLoading } = useTenantRecord();
  const { data: invoices } = useMyInvoices(tenant?.id);
  const { data: payments } = useMyPayments(tenant?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tenant) return null;

  const unit = tenant.unit as any;
  const property = unit?.property;
  const leases = (tenant.leases as any[]) ?? [];
  const activeLease = leases.find((l) => l.status === "active");

  const pendingInvoices = invoices?.filter((i) => i.status === "pending" || i.status === "overdue") ?? [];
  const totalDue = pendingInvoices.reduce((a, i) => a + Number(i.amount), 0);
  const nextDue = pendingInvoices.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  const overdueInvoices = invoices?.filter((i) => i.status === "overdue") ?? [];
  const totalPaid = (payments ?? []).filter((p) => p.status === "confirmed").reduce((a, p) => a + Number(p.amount), 0);

  const leaseEnd = activeLease ? new Date(activeLease.end_date) : null;
  const daysUntilLeaseEnd = leaseEnd ? Math.ceil((leaseEnd.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Welcome, {tenant.full_name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's everything you need to know about your rental</p>
      </div>

      {/* Overdue alert */}
      {overdueInvoices.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              KES {overdueInvoices.reduce((a, i) => a + Number(i.amount), 0).toLocaleString()} past due. Please contact your landlord.
            </p>
            <Link to="/tenant/rent" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline">
              View invoices <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Outstanding Balance</div>
          <div className={`mt-2 font-heading text-2xl font-bold ${totalDue > 0 ? "text-warning" : "text-success"}`}>
            KES {totalDue.toLocaleString()}
          </div>
          {nextDue && (
            <div className="mt-1 text-xs text-muted-foreground">Due {new Date(nextDue.due_date).toLocaleDateString()}</div>
          )}
        </div>

        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Total Paid (All Time)</div>
          <div className="mt-2 font-heading text-2xl font-bold text-success">KES {totalPaid.toLocaleString()}</div>
          <div className="mt-1 text-xs text-muted-foreground">{(payments ?? []).filter((p) => p.status === "confirmed").length} payments</div>
        </div>

        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Monthly Rent</div>
          <div className="mt-2 font-heading text-2xl font-bold text-card-foreground">
            KES {Number(activeLease?.rent_amount ?? unit?.rent_amount ?? 0).toLocaleString()}
          </div>
          {activeLease && (
            <div className="mt-1 text-xs text-muted-foreground">Active lease</div>
          )}
        </div>

        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Lease Ends</div>
          {leaseEnd ? (
            <>
              <div className={`mt-2 font-heading text-2xl font-bold ${daysUntilLeaseEnd! < 30 ? "text-warning" : "text-card-foreground"}`}>
                {daysUntilLeaseEnd} days
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{leaseEnd.toLocaleDateString()}</div>
            </>
          ) : (
            <div className="mt-2 font-heading text-lg font-bold text-muted-foreground">No active lease</div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Unit */}
        <div className="stat-card space-y-4">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-lg font-semibold text-card-foreground">My Unit</h3>
          </div>
          {unit && property ? (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Property</div>
                <div className="font-medium text-card-foreground">{property.name}</div>
                {property.address && (
                  <div className="text-sm text-muted-foreground">{property.address}, {property.city}</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                <div className="text-center">
                  <div className="font-medium text-card-foreground">Unit {unit.unit_number}</div>
                  <div className="text-xs text-muted-foreground">Unit #</div>
                </div>
                {unit.bedrooms && (
                  <div className="text-center">
                    <div className="font-medium text-card-foreground">{unit.bedrooms}</div>
                    <div className="text-xs text-muted-foreground">Bedrooms</div>
                  </div>
                )}
                {unit.floor && (
                  <div className="text-center">
                    <div className="font-medium text-card-foreground">{unit.floor}</div>
                    <div className="text-xs text-muted-foreground">Floor</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No unit assigned yet</p>
          )}
        </div>

        {/* Active Lease */}
        <div className="stat-card space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-lg font-semibold text-card-foreground">My Lease</h3>
          </div>
          {activeLease ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Start Date</div>
                  <div className="font-medium text-card-foreground">{new Date(activeLease.start_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">End Date</div>
                  <div className="font-medium text-card-foreground">{new Date(activeLease.end_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Monthly Rent</div>
                  <div className="font-medium text-card-foreground">KES {Number(activeLease.rent_amount).toLocaleString()}</div>
                </div>
                {activeLease.deposit_amount > 0 && (
                  <div>
                    <div className="text-muted-foreground">Security Deposit</div>
                    <div className="font-medium text-card-foreground">KES {Number(activeLease.deposit_amount).toLocaleString()}</div>
                  </div>
                )}
              </div>
              {daysUntilLeaseEnd !== null && daysUntilLeaseEnd < 60 && daysUntilLeaseEnd > 0 && (
                <div className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
                  Lease ends in {daysUntilLeaseEnd} days — contact your landlord about renewal
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active lease on file</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="stat-card">
        <h3 className="mb-4 font-heading text-lg font-semibold text-card-foreground">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/tenant/rent">
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" /> View My Invoices
            </Button>
          </Link>
          <Link to="/tenant/maintenance">
            <Button variant="outline" className="gap-2">
              <Wrench className="h-4 w-4" /> Submit Maintenance Request
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
