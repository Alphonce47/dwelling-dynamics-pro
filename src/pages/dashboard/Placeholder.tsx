import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

export default function Placeholder() {
  const { pathname } = useLocation();
  const pageName = pathname.split("/").pop() || "Page";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Construction className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-heading text-2xl font-bold capitalize text-foreground">{pageName}</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        This module is coming soon. Connect Lovable Cloud to enable database, authentication, and backend features.
      </p>
    </div>
  );
}
