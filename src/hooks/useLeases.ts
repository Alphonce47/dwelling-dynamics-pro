import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLeases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["leases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          *,
          tenant:tenants(full_name),
          unit:units(unit_number, property:properties(name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lease: {
      tenant_id: string;
      unit_id: string;
      start_date: string;
      end_date: string;
      rent_amount: number;
      deposit_amount?: number;
      currency?: string;
      terms?: string;
    }) => {
      const { data, error } = await supabase
        .from("leases")
        .insert({ status: "active", currency: "KES", ...lease })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useUpdateLeaseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "expired" | "terminated" | "pending" }) => {
      const { error } = await supabase.from("leases").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
