import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, MapPin, BedDouble, Bath, DollarSign, Phone, Mail, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Listing() {
  const { token } = useParams<{ token: string }>();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["public-listing", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          unit:units(
            unit_number, bedrooms, bathrooms, size_sqm, floor, rent_amount, currency,
            property:properties(name, address, city, country, description)
          )
        `)
        .eq("shareable_token", token!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="font-heading text-2xl font-bold text-foreground">Listing Not Found</h1>
        <p className="text-muted-foreground">This listing may have been removed or is no longer active.</p>
        <Link to="/">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to NyumbaHub</Button>
        </Link>
      </div>
    );
  }

  const unit = listing.unit as any;
  const property = unit?.property;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">NyumbaHub</span>
          </Link>
          <Link to="/signup">
            <Button size="sm">Create Account</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        {/* Title + Badge */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="font-heading text-3xl font-bold text-foreground flex-1">{listing.title}</h1>
            <Badge className="bg-success/10 text-success border-0 text-sm px-3 py-1">Available</Badge>
          </div>
          {property && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{property.address ? `${property.address}, ` : ""}{property.city}{property.country && property.country !== "KE" ? `, ${property.country}` : ""}</span>
            </div>
          )}
        </div>

        {/* Price + Key Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <DollarSign className="mx-auto h-5 w-5 text-primary mb-2" />
            <div className="font-heading text-2xl font-bold text-foreground">
              {listing.currency} {listing.price.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">per month</div>
          </div>
          {unit?.bedrooms != null && (
            <div className="rounded-xl border bg-card p-5 text-center">
              <BedDouble className="mx-auto h-5 w-5 text-primary mb-2" />
              <div className="font-heading text-2xl font-bold text-foreground">{unit.bedrooms}</div>
              <div className="text-xs text-muted-foreground mt-1">{unit.bedrooms === 1 ? "Bedroom" : "Bedrooms"}</div>
            </div>
          )}
          {unit?.bathrooms != null && (
            <div className="rounded-xl border bg-card p-5 text-center">
              <Bath className="mx-auto h-5 w-5 text-primary mb-2" />
              <div className="font-heading text-2xl font-bold text-foreground">{unit.bathrooms}</div>
              <div className="text-xs text-muted-foreground mt-1">{unit.bathrooms === 1 ? "Bathroom" : "Bathrooms"}</div>
            </div>
          )}
          {unit?.size_sqm != null && (
            <div className="rounded-xl border bg-card p-5 text-center">
              <Building2 className="mx-auto h-5 w-5 text-primary mb-2" />
              <div className="font-heading text-2xl font-bold text-foreground">{unit.size_sqm}</div>
              <div className="text-xs text-muted-foreground mt-1">sqm</div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">About This Unit</h2>
            <div className="rounded-xl border bg-card p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium text-foreground">{property?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit</span>
                <span className="font-medium text-foreground">Unit {unit?.unit_number ?? "—"}</span>
              </div>
              {unit?.floor != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Floor</span>
                  <span className="font-medium text-foreground">{unit.floor}</span>
                </div>
              )}
              {unit?.bedrooms != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedrooms</span>
                  <span className="font-medium text-foreground">{unit.bedrooms}</span>
                </div>
              )}
              {unit?.bathrooms != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bathrooms</span>
                  <span className="font-medium text-foreground">{unit.bathrooms}</span>
                </div>
              )}
              {unit?.size_sqm != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium text-foreground">{unit.size_sqm} sqm</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent</span>
                <span className="font-bold text-primary">{listing.currency} {listing.price.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">Interested?</h2>
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a free NyumbaHub tenant account to apply for this unit, track your rent, and communicate with your landlord.
              </p>
              <Link to="/signup" className="block">
                <Button className="w-full" size="lg">Apply Now — Create Account</Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">Already have an account? Sign In</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Description */}
        {(listing.description || property?.description) && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Description</h2>
            <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {listing.description || property?.description}
            </div>
          </div>
        )}

        {/* Location */}
        {property && (property.address || property.city) && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Location</h2>
            <div className="rounded-xl border bg-card p-5 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{property.name}</div>
                {property.address && <div>{property.address}</div>}
                <div>{property.city}{property.country && property.country !== "KE" ? `, ${property.country}` : ""}</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 text-center space-y-3">
          <h3 className="font-heading text-lg font-semibold text-foreground">Ready to move in?</h3>
          <p className="text-sm text-muted-foreground">Sign up to apply for this unit and manage your tenancy online.</p>
          <Link to="/signup">
            <Button size="lg" className="mt-2">Get Started Free</Button>
          </Link>
        </div>
      </main>

      <footer className="border-t bg-card mt-12 px-6 py-6 text-center text-xs text-muted-foreground">
        <p>Powered by <span className="font-semibold text-foreground">NyumbaHub</span> — Property Management for East Africa</p>
      </footer>
    </div>
  );
}
