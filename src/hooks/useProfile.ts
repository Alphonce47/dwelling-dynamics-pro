import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
      ]);

      if (profileRes.error) throw profileRes.error;

      return {
        ...profileRes.data,
        roles: rolesRes.data?.map((r) => r.role) ?? [],
      };
    },
    enabled: !!user,
  });
}
