import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
              <Route path="messages" element={<Placeholder />} />
              <Route path="vacancies" element={<Placeholder />} />
              <Route path="reports" element={<Placeholder />} />
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
