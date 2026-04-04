import { Link } from "react-router-dom";
import { Home, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function TenantNotLinked() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
        </div>

        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Account Not Linked</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account (<span className="font-medium">{user?.email}</span>) isn't connected to a tenant profile yet.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5 text-left space-y-3">
          <h2 className="font-heading text-base font-semibold text-card-foreground">How to get connected</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
            <li>Contact your landlord or property manager</li>
            <li>Ask them to add your email (<span className="font-medium text-foreground">{user?.email}</span>) to your tenant profile in NyumbaHub</li>
            <li>Once they save your email, your account will automatically link on next login</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              window.location.href = "/login";
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Sign Out & Try Again
          </Button>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
