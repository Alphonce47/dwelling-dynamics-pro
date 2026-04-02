import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProperties() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["properties", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, units(id, unit_number, status, rent_amount)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (property: {
      name: string;
      address?: string;
      city: string;
      country?: string;
      property_type: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("properties")
        .insert({ ...property, owner_id: user!.id })
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
