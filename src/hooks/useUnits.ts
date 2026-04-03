import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unit: {
      property_id: string;
      unit_number: string;
      rent_amount: number;
      bedrooms?: number;
      bathrooms?: number;
      floor?: number;
      size_sqm?: number;
    }) => {
      const { data, error } = await supabase
        .from("units")
        .insert(unit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateUnitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "vacant" | "occupied" | "maintenance" }) => {
      const { error } = await supabase
        .from("units")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
