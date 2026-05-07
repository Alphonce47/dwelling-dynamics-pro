import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, refetch } = useProfile();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!form.full_name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: form.full_name, phone: form.phone || null })
        .eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Profile updated");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (passwordForm.password !== passwordForm.confirm) return toast.error("Passwords do not match");
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (error) throw error;
      toast.success("Password updated");
      setPasswordForm({ password: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="stat-card space-y-4">
        <h2 className="font-heading text-lg font-semibold text-card-foreground">Profile</h2>
        <div>
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled className="bg-muted" />
        </div>
        <div>
          <Label>Full Name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 7XX XXX XXX" />
        </div>
        {profile?.roles?.length ? (
          <div>
            <Label>Role</Label>
            <div className="mt-1 text-sm capitalize text-card-foreground">{profile.roles.join(", ")}</div>
          </div>
        ) : null}
        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="stat-card space-y-4">
        <h2 className="font-heading text-lg font-semibold text-card-foreground">Change Password</h2>
        <div>
          <Label>New Password</Label>
          <Input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} />
        </div>
        <div>
          <Label>Confirm Password</Label>
          <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
        </div>
        <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline">
          {changingPassword ? "Updating..." : "Change Password"}
        </Button>
      </div>
    </div>
  );
}
