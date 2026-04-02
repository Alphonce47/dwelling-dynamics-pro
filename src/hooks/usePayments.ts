import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          tenant:tenants(full_name, phone, unit:units(unit_number, property:properties(name)))
        `)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
