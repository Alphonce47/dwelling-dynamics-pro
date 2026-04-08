import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Home, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { linkTenantByEmail } from "@/hooks/useTenantRecord";

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setStatus("error");
        setMessage("Could not confirm your email. The link may have expired.");
        return;
      }

      const role = session.user.user_metadata?.role ?? "landlord";
      const email = session.user.email ?? "";

      if (role === "tenant") {
        await linkTenantByEmail(session.user.id, email);
      }

      setStatus("success");

      setTimeout(() => {
        navigate(role === "tenant" ? "/tenant" : "/dashboard");
      }, 2000);
    };

    check();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">NyumbaHub</span>
        </Link>

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="font-heading text-xl font-bold text-foreground">Confirming your email…</h1>
            <p className="text-sm text-muted-foreground">Just a moment while we verify your account.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Email confirmed!</h1>
            <p className="text-sm text-muted-foreground">Your account is ready. Taking you to your dashboard…</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
              <h1 className="font-heading text-xl font-bold text-destructive">Confirmation failed</h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            </div>
            <Button asChild variant="hero" className="w-full">
              <Link to="/login">Go to Sign In</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
