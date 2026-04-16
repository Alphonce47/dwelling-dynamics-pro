import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Receipt, Wrench, User, LogOut, Building2, Menu, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantRecord, useMyMessages } from "@/hooks/useTenantRecord";

const navItems = [
  { path: "/tenant", label: "My Home", icon: Home, exact: true },
  { path: "/tenant/rent", label: "My Rent", icon: Receipt },
  { path: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { path: "/tenant/profile", label: "My Profile", icon: User },
];

export default function TenantLayout() {
  const { user, signOut } = useAuth();
  const { data: tenant } = useTenantRecord();
  const { data: messages } = useMyMessages(user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unit = tenant?.unit as any;
  const property = unit?.property;

  const unreadCount = messages?.filter((m) => !m.is_read && m.receiver_id === user?.id).length ?? 0;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-heading text-sm font-bold text-foreground">NyumbaHub</div>
            <div className="text-xs text-muted-foreground">Tenant Portal</div>
          </div>
        </div>
      </div>

      {/* Tenant info */}
      {tenant && (
        <div className="border-b px-6 py-4">
          <div className="font-medium text-foreground">{tenant.full_name}</div>
          {property && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {property.name} — Unit {unit.unit_number}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          const isMessages = item.path === "/tenant/messages";
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isMessages && unreadCount > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}>
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t px-3 py-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r bg-card">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="h-6 w-6" />
          </button>
          <div className="font-heading text-sm font-bold text-foreground">NyumbaHub</div>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
