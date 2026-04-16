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
            property:properties(id, name, address, city, country, owner_id)
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

export function useMyMessages(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-messages", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with names from profiles
      const userIds = [...new Set(data.flatMap((m) => [m.sender_id, m.receiver_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.full_name]));

      return data.map((m) => ({
        ...m,
        sender_name: profileMap[m.sender_id] ?? "Unknown",
        receiver_name: profileMap[m.receiver_id] ?? "Unknown",
      }));
    },
    enabled: !!userId,
  });
}

export function useSendTenantMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (msg: {
      receiver_id: string;
      subject?: string;
      body: string;
      tenant_id?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({ ...msg, sender_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-messages"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
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
      priority?: "low" | "medium" | "high" | "urgent";
    }) => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .insert([{ status: "open" as const, priority: "medium" as const, ...req }])
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

export async function linkTenantByEmail(userId: string, email: string): Promise<string | null> {
  // Step 1: Find tenant row by user_id first (already linked)
  const { data: byUid } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUid) return byUid.id; // already linked, return their tenant ID

  // Step 2: Find by email (new login, not yet linked)
  const { data: byEmail } = await supabase
    .from("tenants")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (!byEmail) return null; // no tenant row for this email = they're a landlord

  // Step 3: Write their user_id into the row
  const { error } = await supabase
    .from("tenants")
    .update({ user_id: userId })
    .eq("id", byEmail.id);

  if (error) {
    console.error("Linking failed:", error.message);
    return null;
  }

  return byEmail.id; // return the tenant ID to confirm success
}