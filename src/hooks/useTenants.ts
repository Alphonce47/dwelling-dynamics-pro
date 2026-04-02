import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTenants() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenants", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          unit:units(
            id, unit_number, rent_amount, status,
            property:properties(id, name, city)
          ),
          leases(id, start_date, end_date, status, rent_amount)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenant: {
      full_name: string;
      phone?: string;
      email?: string;
      id_number?: string;
      unit_id?: string;
      move_in_date?: string;
    }) => {
      const { data, error } = await supabase
        .from("tenants")
        .insert(tenant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
