import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Expense = {
  id: string;
  property_id: string;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  expense_date: string;
  vendor: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  property?: { name: string } | null;
};

export const EXPENSE_CATEGORIES = [
  "maintenance",
  "repairs",
  "utilities",
  "insurance",
  "taxes",
  "management_fees",
  "legal",
  "marketing",
  "cleaning",
  "landscaping",
  "supplies",
  "other",
] as const;

export const categoryLabels: Record<string, string> = {
  maintenance: "Maintenance",
  repairs: "Repairs",
  utilities: "Utilities",
  insurance: "Insurance",
  taxes: "Taxes",
  management_fees: "Management Fees",
  legal: "Legal",
  marketing: "Marketing",
  cleaning: "Cleaning",
  landscaping: "Landscaping",
  supplies: "Supplies",
  other: "Other",
};

export function useExpenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expenses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses" as any)
        .select("*, property:properties(name)")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Expense[];
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: {
      property_id: string;
      category: string;
      description?: string;
      amount: number;
      currency?: string;
      expense_date?: string;
      vendor?: string;
    }) => {
      const { error } = await supabase.from("expenses" as any).insert(vals as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
