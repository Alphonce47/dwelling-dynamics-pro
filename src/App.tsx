import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import TenantRoute from "@/components/TenantRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Properties from "./pages/dashboard/Properties";
import Tenants from "./pages/dashboard/Tenants";
import Payments from "./pages/dashboard/Payments";
import Invoices from "./pages/dashboard/Invoices";
import Maintenance from "./pages/dashboard/Maintenance";
import Settings from "./pages/dashboard/Settings";
import Messages from "./pages/dashboard/Messages";
import Vacancies from "./pages/dashboard/Vacancies";
import Reports from "./pages/dashboard/Reports";
import TenantLayout from "./components/TenantLayout";
import TenantOverview from "./pages/tenant/TenantOverview";
import TenantRent from "./pages/tenant/TenantRent";
import TenantMaintenance from "./pages/tenant/TenantMaintenance";
import TenantProfile from "./pages/tenant/TenantProfile";
import TenantNotLinked from "./pages/tenant/TenantNotLinked";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Tenant portal */}
            <Route
              path="/tenant"
              element={
                <TenantRoute>
                  <TenantLayout />
                </TenantRoute>
              }
            >
              <Route index element={<TenantOverview />} />
              <Route path="rent" element={<TenantRent />} />
              <Route path="maintenance" element={<TenantMaintenance />} />
              <Route path="profile" element={<TenantProfile />} />
            </Route>

            {/* Tenant not linked page (protected but no tenant record required) */}
            <Route
              path="/tenant/not-linked"
              element={
                <ProtectedRoute>
                  <TenantNotLinked />
                </ProtectedRoute>
              }
            />

            {/* Landlord / manager dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="properties" element={<Properties />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="payments" element={<Payments />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="messages" element={<Messages />} />
              <Route path="vacancies" element={<Vacancies />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
