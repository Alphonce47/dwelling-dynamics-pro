import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTenantRecord() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-tenant-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenants")
        .select(`
          *,
          unit:units(
            id, unit_number, rent_amount, status, floor, bedrooms, bathrooms,
            property:properties(id, name, address, city, country)
          ),
          leases(*)
        `)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!user,
  });
}

export function useMyInvoices(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["my-invoices", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useMyPayments(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["my-payments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useMyMaintenance(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["my-maintenance", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useSubmitMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: {
      tenant_id: string;
      unit_id: string;
      title: string;
      description?: string;
      priority?: string;
    }) => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .insert({ status: "open", priority: "medium", ...req })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useUpdateTenantProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      phone?: string;
      email?: string;
      emergency_contact?: string;
      emergency_phone?: string;
    }) => {
      const { error } = await supabase.from("tenants").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tenant-record"] });
    },
  });
}

export async function linkTenantByEmail(userId: string, email: string) {
  const { error } = await supabase
    .from("tenants")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null);
  return !error;
}
