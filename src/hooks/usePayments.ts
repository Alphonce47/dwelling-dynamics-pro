import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: {
      tenant_id: string;
      amount: number;
      method: "mpesa" | "bank_equity" | "bank_kcb" | "bank_coop" | "cash" | "international_transfer";
      transaction_ref?: string;
      phone_number?: string;
      invoice_id?: string;
      payment_date?: string;
      status?: "confirmed" | "pending" | "failed" | "reversed";
    }) => {
      const { data, error } = await supabase
        .from("payments")
        .insert([{ status: "confirmed" as const, payment_date: new Date().toISOString(), ...payment }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
