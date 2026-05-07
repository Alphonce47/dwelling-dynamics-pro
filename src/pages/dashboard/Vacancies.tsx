import { useState } from "react";
import { DoorOpen, Plus, Link as LinkIcon, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListings, useCreateListing, useToggleListing } from "@/hooks/useListings";
import { useUnits } from "@/hooks/useUnits";
import { useProperties } from "@/hooks/useProperties";
import { useToast } from "@/hooks/use-toast";

export default function Vacancies() {
  const { data: listings, isLoading } = useListings();
  const { data: properties } = useProperties();
  const { toast } = useToast();
  const createListing = useCreateListing();
  const toggleListing = useToggleListing();

  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const { data: units } = useUnits(selectedProperty);
  const [form, setForm] = useState({ unit_id: "", title: "", description: "", price: "" });

  const vacantUnits = units?.filter((u) => u.status === "vacant") || [];

  const handleCreate = async () => {
    if (!form.unit_id || !form.title || !form.price) return;
    try {
      await createListing.mutateAsync({
        unit_id: form.unit_id,
        title: form.title,
        description: form.description || undefined,
        price: Number(form.price),
      });
      toast({ title: "Listing created" });
      setOpen(false);
      setForm({ unit_id: "", title: "", description: "", price: "" });
      setSelectedProperty("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleListing.mutateAsync({ id, is_active: !currentActive });
      toast({ title: currentActive ? "Listing deactivated" : "Listing activated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/listing/${token}`);
    toast({ title: "Link copied to clipboard" });
  };

  const activeCount = listings?.filter((l) => l.is_active).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Vacancies & Listings</h1>
          <p className="text-sm text-muted-foreground">{activeCount} active listing{activeCount !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Listing</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Listing</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProperty && (
                <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select vacant unit" /></SelectTrigger>
                  <SelectContent>
                    {vacantUnits.length ? vacantUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id}>Unit {u.unit_number} — {u.currency} {u.rent_amount?.toLocaleString()}</SelectItem>
                    )) : <SelectItem value="_none" disabled>No vacant units</SelectItem>}
                  </SelectContent>
                </Select>
              )}
              <Input placeholder="Listing title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input type="number" placeholder="Monthly price (KES)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              <Button onClick={handleCreate} disabled={createListing.isPending} className="w-full">
                {createListing.isPending ? "Creating..." : "Create Listing"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !listings?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No listings yet — create one for your vacant units</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(l.unit as any)?.property?.name} — Unit {(l.unit as any)?.unit_number}
                    </TableCell>
                    <TableCell>{l.currency} {l.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={l.is_active ? "default" : "secondary"}>
                        {l.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => copyLink(l.shareable_token)} title="Copy shareable link">
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToggle(l.id, l.is_active)} title={l.is_active ? "Deactivate" : "Activate"}>
                          {l.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
