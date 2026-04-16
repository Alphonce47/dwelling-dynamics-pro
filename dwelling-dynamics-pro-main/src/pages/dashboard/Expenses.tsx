import { useState, useMemo } from "react";
import { DollarSign, Plus, Search, Trash2, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses, useCreateExpense, useDeleteExpense, EXPENSE_CATEGORIES, categoryLabels } from "@/hooks/useExpenses";
import { useProperties } from "@/hooks/useProperties";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const defaultForm = { property_id: "", category: "other", description: "", amount: "", vendor: "", expense_date: new Date().toISOString().slice(0, 10) };

export default function Expenses() {
  const { data: expenses, isLoading } = useExpenses();
  const { data: properties } = useProperties();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = expenses ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.description ?? "").toLowerCase().includes(q) ||
        (e.vendor ?? "").toLowerCase().includes(q) ||
        (e.property as any)?.name?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") list = list.filter(e => e.category === categoryFilter);
    if (propertyFilter !== "all") list = list.filter(e => e.property_id === propertyFilter);
    return list;
  }, [expenses, search, categoryFilter, propertyFilter]);

  const totalExpenses = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const handleSave = async () => {
    if (!form.property_id || !form.amount) return toast.error("Property and amount are required");
    try {
      await createExpense.mutateAsync({
        property_id: form.property_id,
        category: form.category,
        description: form.description || undefined,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        vendor: form.vendor || undefined,
      });
      toast.success("Expense recorded");
      setOpen(false);
      setForm(defaultForm);
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try { await deleteExpense.mutateAsync(id); toast.success("Deleted"); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleExport = () => {
    if (!filtered.length) return toast.error("No data to export");
    const headers = ["Date", "Property", "Category", "Description", "Vendor", "Amount (KES)"];
    const rows = filtered.map(e => [
      e.expense_date, (e.property as any)?.name ?? "", categoryLabels[e.category] ?? e.category,
      e.description ?? "", e.vendor ?? "", Number(e.amount).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Exported");
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track property-related costs and maintenance expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="h-4 w-4" /> Export</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add Expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Property</Label>
                  <Select value={form.property_id} onValueChange={v => setForm({ ...form, property_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>{properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Amount (KES)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Vendor</Label><Input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="ABC Plumbing" /></div>
                  <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} /></div>
                </div>
                <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Pipe repair in unit 3A" /></div>
                <Button onClick={handleSave} disabled={createExpense.isPending} className="w-full">{createExpense.isPending ? "Saving…" : "Record Expense"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card"><div className="text-sm text-muted-foreground">Total Expenses</div><div className="mt-1 font-heading text-xl font-bold text-card-foreground">KES {totalExpenses.toLocaleString()}</div><div className="text-xs text-muted-foreground">{filtered.length} records</div></div>
        <div className="stat-card"><div className="text-sm text-muted-foreground">This Month</div><div className="mt-1 font-heading text-xl font-bold text-card-foreground">KES {filtered.filter(e => new Date(e.expense_date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</div></div>
        <div className="stat-card"><div className="text-sm text-muted-foreground">Categories</div><div className="mt-1 font-heading text-xl font-bold text-card-foreground">{new Set(filtered.map(e => e.category)).size}</div></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search expenses…" className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-card-foreground">No expenses found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Record your first expense to start tracking costs</p>
        </div>
      ) : (
        <div className="stat-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Property</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(e.expense_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-card-foreground">{(e.property as any)?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-xs capitalize">{categoryLabels[e.category] ?? e.category}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{e.description ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.vendor ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-heading font-bold text-destructive">KES {Number(e.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(e.id)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
