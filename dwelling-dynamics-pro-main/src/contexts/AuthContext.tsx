import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// --- What the context exposes to the rest of the app ---
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: "landlord" | "tenant" | null; // NEW: who is this person?
  tenantId: string | null;                // NEW: their tenant row ID if they're a tenant
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  userRole: null,
  tenantId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]     = useState<Session | null>(null);
  const [loading, setLoading]     = useState(true);
  const [userRole, setUserRole]   = useState<"landlord" | "tenant" | null>(null);
  const [tenantId, setTenantId]   = useState<string | null>(null);

  // --- This runs every time login state changes ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        linkAndIdentifyUser(session.user);
      } else {
        // Logged out — reset everything
        setUserRole(null);
        setTenantId(null);
        setLoading(false);
      }
    });

    // Also check on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        linkAndIdentifyUser(session.user);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setSession(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- The linking logic ---
  async function linkAndIdentifyUser(user: User) {
    try {
      // 1. Check if this user's ID is already in the tenants table
      const { data: tenantByUid } = await supabase
        .from("tenants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (tenantByUid) {
        // Already linked — they're a tenant, we're done
        setUserRole("tenant");
        setTenantId(tenantByUid.id);
        setLoading(false);
        return;
      }

      // 2. Not found by user_id — check if their EMAIL is in tenants
      //    (This is the case where landlord pre-added them but they just signed up)
      const { data: tenantByEmail } = await supabase
        .from("tenants")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (tenantByEmail) {
        // Found by email — now WRITE their user_id into the row (the linking step)
        await supabase
          .from("tenants")
          .update({ user_id: user.id })
          .eq("id", tenantByEmail.id);

        setUserRole("tenant");
        setTenantId(tenantByEmail.id);
        setLoading(false);
        return;
      }

      // 3. Not in tenants at all — they must be a landlord
      setUserRole("landlord");
      setTenantId(null);
      setLoading(false);

    } catch (err) {
      console.error("Error during user linking:", err);
      setLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setTenantId(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, userRole, tenantId, signOut }}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
