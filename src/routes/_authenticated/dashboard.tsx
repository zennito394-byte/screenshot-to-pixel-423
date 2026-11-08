import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pixora/Logo";
import { supabase } from "@/integrations/supabase/client";
import { creditsQuery, profileQuery } from "@/lib/pixora-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PIXORA AI" },
      { name: "description", content: "Your PIXORA AI dashboard: credits and creations." },
      { property: "og:title", content: "Dashboard — PIXORA AI" },
      { property: "og:description", content: "Your PIXORA AI dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery());
  const credits = useQuery(creditsQuery());

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border glass">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo to="/dashboard" />
          <Button variant="ghost" onClick={signOut}>Log out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <h1 className="text-3xl font-bold">
          Welcome{profile.data?.display_name ? `, ${profile.data.display_name}` : ""}
        </h1>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Remaining credits</p>
          <p className="mt-1 font-display text-4xl font-bold text-gradient">
            {credits.isLoading ? "…" : credits.isError ? "—" : credits.data?.credits}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <Sparkles className="size-6 text-primary" />
          <h2 className="mt-3 text-lg font-bold">Editing studio coming next</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The photo editing studio, results and My Creations gallery are still being built.
          </p>
          <Button asChild variant="glass" className="mt-4">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
