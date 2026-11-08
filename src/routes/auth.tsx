import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/pixora/Logo";
import { GoogleButton } from "@/components/pixora/GoogleButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FREE_SIGNUP_CREDITS } from "@/lib/generation-rules";
import afterPortrait from "@/assets/after-portrait.jpg";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; redirect?: string } => ({
    mode: s.mode === "signup" || s.mode === "forgot" || s.mode === "login" ? s.mode : undefined,
    redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//") ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create an account — PIXORA AI" },
      { name: "description", content: "Log in to PIXORA AI or create a free account to start editing photos with AI." },
      { property: "og:title", content: "Sign in — PIXORA AI" },
      { property: "og:description", content: "Create a free PIXORA AI account and get free credits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Try logging in.";
  if (m.includes("password")) return message;
  if (m.includes("rate")) return "Too many attempts. Please wait a moment and try again.";
  return message || "Something went wrong. Please try again.";
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session, ready } = useAuth();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "signup" | "reset">(null);

  useEffect(() => {
    setMode(search.mode ?? "login");
  }, [search.mode]);

  useEffect(() => {
    if (ready && session) navigate({ to: search.redirect ?? "/dashboard", replace: true });
  }, [ready, session, navigate, search.redirect]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth`, data: { display_name: name.trim() || undefined } },
        });
        if (error) throw error;
        if (!data.session) setSent("signup");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      toast.error(friendlyAuthError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={afterPortrait} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-display text-4xl font-bold leading-tight">
            Your Photo. Your Imagination. <span className="text-gradient">AI.</span>
          </p>
          <p className="mt-3 text-muted-foreground">{FREE_SIGNUP_CREDITS} free credits when you create an account.</p>
        </div>
      </div>
      <div className="relative flex flex-col px-5 py-8 sm:px-10">
        <div className="absolute inset-0 bg-aurora opacity-70 lg:hidden" aria-hidden />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {sent ? (
            <div className="rounded-3xl border border-border bg-card p-7 text-center shadow-card">
              <MailCheck className="mx-auto size-10 text-primary" />
              <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {sent === "signup"
                  ? `We sent a confirmation link to ${email}. Click it to activate your account, then log in.`
                  : `If an account exists for ${email}, we've sent a link to reset your password.`}
              </p>
              <Button variant="glass" className="mt-6 w-full" onClick={() => { setSent(null); setMode("login"); }}>
                Back to login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold">
                {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Log in to continue creating."
                  : mode === "signup"
                    ? `Start with ${FREE_SIGNUP_CREDITS} free AI generations.`
                    : "Enter your email and we'll send you a reset link."}
              </p>

              {mode !== "forgot" && (
                <>
                  <div className="mt-7"><GoogleButton /></div>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              <form onSubmit={onSubmit} className={mode === "forgot" ? "mt-7 space-y-4" : "space-y-4"}>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} className="h-12 rounded-xl" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-12 rounded-xl" />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "login" && (
                        <button type="button" onClick={() => setMode("forgot")} className="text-xs font-medium text-primary hover:underline">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={mode === "signup" ? 8 : undefined}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      className="h-12 rounded-xl"
                    />
                    {mode === "signup" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
                  </div>
                )}
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>New to PIXORA? <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button></>
                ) : (
                  <>Already have an account? <button className="font-semibold text-primary hover:underline" onClick={() => setMode("login")}>Log in</button></>
                )}
              </p>
              {mode === "signup" && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  By creating an account you agree to our <Link to="/terms" className="underline">Terms</Link> and{" "}
                  <Link to="/privacy" className="underline">Privacy Policy</Link>.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
