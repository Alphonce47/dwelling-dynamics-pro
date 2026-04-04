import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantRecord } from "@/hooks/useTenantRecord";

export default function TenantRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: tenantRecord, isLoading: loadingTenant } = useTenantRecord();

  if (loading || loadingTenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!tenantRecord) return <Navigate to="/tenant/not-linked" replace />;

  return <>{children}</>;
}
