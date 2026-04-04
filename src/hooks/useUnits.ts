import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnits(propertyId?: string) {
  return useQuery({
    queryKey: ["units", propertyId],
    queryFn: async () => {
      let query = supabase.from("units").select("*").order("unit_number");
      if (propertyId) query = query.eq("property_id", propertyId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
  });
}

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

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      unit_number?: string;
      rent_amount?: number;
      bedrooms?: number;
      bathrooms?: number;
      status?: string;
    }) => {
      const { error } = await supabase.from("units").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
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

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("units").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
