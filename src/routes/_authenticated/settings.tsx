import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell, useSignOut } from "@/components/pixora/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { deleteAllPhotos, profileQuery } from "@/lib/pixora-data";

export const Route = createFileRoute("/_authenticated/settings")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Settings — PIXORA AI" },
      { name: "description", content: "Manage your PIXORA AI profile, password and photos." },
      { property: "og:title", content: "Settings — PIXORA AI" },
      { property: "og:description", content: "Manage your PIXORA AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const signOut = useSignOut();
  const profile = useQuery(profileQuery());
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "name" | "password" | "delete">(null);

  useEffect(() => {
    if (profile.data) setName(profile.data.display_name ?? "");
  }, [profile.data]);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    if (!profile.data) return;
    setBusy("name");
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() || null }).eq("id", profile.data.id);
    setBusy(null);
    if (error) {
      toast.error("Couldn't save your name.");
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved");
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) {
      toast.error(error.message || "Couldn't change your password.");
      return;
    }
    setPassword("");
    toast.success("Password changed");
  }

  async function removeAll() {
    if (!window.confirm("Delete all your photos and creations permanently? This can't be undone.")) return;
    setBusy("delete");
    try {
      const n = await deleteAllPhotos();
      await queryClient.invalidateQueries({ queryKey: ["generations"] });
      toast.success(n ? `Deleted ${n} creation${n === 1 ? "" : "s"}` : "You had no photos to delete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete your photos.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>
      <div className="max-w-xl space-y-6">
        <form onSubmit={saveName} className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Profile</h2>
          <p className="text-sm text-muted-foreground">{profile.data?.email}</p>
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" variant="hero" disabled={busy !== null}>
            {busy === "name" ? <Loader2 className="animate-spin" /> : null} Save
          </Button>
        </form>
        <form onSubmit={savePassword} className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Change password</h2>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="glass" disabled={busy !== null}>
            {busy === "password" ? <Loader2 className="animate-spin" /> : null} Update password
          </Button>
        </form>
        <div className="space-y-3 rounded-3xl border border-destructive/40 bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Your photos</h2>
          <p className="text-sm text-muted-foreground">Permanently delete every uploaded photo and AI result.</p>
          <Button variant="destructive" onClick={removeAll} disabled={busy !== null}>
            {busy === "delete" ? <Loader2 className="animate-spin" /> : null} Delete all photos
          </Button>
        </div>
        <Button variant="ghost" onClick={signOut}>Log out</Button>
      </div>
    </AppShell>
  );
}
