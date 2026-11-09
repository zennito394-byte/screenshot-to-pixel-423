import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Images, LayoutDashboard, LogOut, Settings, Wand2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pixora/Logo";
import { supabase } from "@/integrations/supabase/client";
import { creditsQuery } from "@/lib/pixora-data";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/studio", label: "Studio", icon: Wand2 },
  { to: "/creations", label: "My Creations", icon: Images },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function CreditsBadge() {
  const credits = useQuery(creditsQuery());
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border glass px-3 py-1.5 text-xs font-semibold">
      <Coins className="size-3.5 text-primary" aria-hidden />
      {credits.isLoading ? "…" : credits.isError ? "—" : credits.data?.credits}
      <span className="text-muted-foreground">credits</span>
    </span>
  );
}

export function useSignOut() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const signOut = useSignOut();
  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo to="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="App">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <CreditsBadge />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Log out" className="hidden md:inline-flex">
              <LogOut />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="App mobile"
      >
        <div className="grid grid-cols-4">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
