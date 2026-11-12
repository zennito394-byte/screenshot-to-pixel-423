import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Coins, Loader2, Mail, Minus, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/pixora/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adjustCredits,
  adminGenerationsQuery,
  adminOverviewQuery,
  adminRequestsQuery,
  adminUsersQuery,
  fetchIsAdmin,
  parseCreditAmount,
  paymentEmailLink,
  resolveRequest,
} from "@/lib/admin-data";
import { formatPrice, getPack } from "@/lib/credit-packs";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  // Display gate only — every admin action is re-checked by the database.
  beforeLoad: async () => {
    if (!(await fetchIsAdmin())) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Admin — PIXORA AI" },
      { name: "description", content: "Approve credit purchases and manage user credits." },
      { property: "og:title", content: "Admin — PIXORA AI" },
      { property: "og:description", content: "PIXORA AI admin panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type UserRow = { user_id: string; email: string; display_name: string | null; credits: number };

function AdminPage() {
  const overview = useQuery(adminOverviewQuery());
  const requests = useQuery(adminRequestsQuery());
  const pending = (requests.data ?? []).filter((r) => r.status === "pending");
  const [creditTarget, setCreditTarget] = useState<UserRow | null>(null);

  const stats = [
    { label: "Waiting to approve", value: overview.data?.pending_requests },
    { label: "Users", value: overview.data?.users },
    { label: "New users (7 days)", value: overview.data?.new_users_7d },
    { label: "Edits (24 hours)", value: overview.data?.edits_24h },
  ];

  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Admin</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Credits &amp; purchases</h1>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{overview.isLoading ? "…" : (s.value ?? "—")}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="requests" className="mt-8">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="requests">
            Buy requests{pending.length ? ` (${pending.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="edits">Recent edits</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-4">
          <RequestsPanel />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersPanel onAddCredits={setCreditTarget} />
        </TabsContent>
        <TabsContent value="edits" className="mt-4">
          <EditsPanel />
        </TabsContent>
      </Tabs>

      <CreditDialog user={creditTarget} onClose={() => setCreditTarget(null)} />
    </AppShell>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-primary/15 text-primary",
  approved: "bg-secondary text-foreground",
  declined: "bg-destructive/15 text-destructive",
  cancelled: "bg-secondary text-muted-foreground",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Waiting",
  approved: "Approved",
  declined: "Declined",
  cancelled: "Cancelled by user",
};

function useRefreshAdmin() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
    void queryClient.invalidateQueries({ queryKey: ["credits"] });
  };
}

function RequestsPanel() {
  const requests = useQuery(adminRequestsQuery());
  const refresh = useRefreshAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  async function act(id: string, approve: boolean, label: string) {
    if (!approve && !window.confirm(`Decline ${label}? No credits will be added.`)) return;
    setBusyId(id);
    try {
      await resolveRequest(id, approve);
      toast.success(approve ? `Approved — credits added to ${label}` : "Request declined");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the request.");
    } finally {
      setBusyId(null);
      refresh();
    }
  }

  if (requests.isLoading) return <Loading />;
  if (requests.isError) return <ErrorNote message={requests.error.message} />;

  const rows = (requests.data ?? []).filter((r) => showAll || r.status === "pending");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Email the buyer payment details, then approve once the money arrives.
        </p>
        <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show waiting only" : "Show all"}
        </Button>
      </div>
      {rows.length === 0 ? (
        <Empty text={showAll ? "No buy requests yet." : "Nothing waiting. New buy requests from the Pricing page show up here."} />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const pack = getPack(r.pack);
            const price = formatPrice(r.price_cents, r.currency);
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.email ?? "Unknown user"}</p>
                    <p className="text-sm">
                      {pack?.name ?? r.pack} · <span className="font-semibold">{r.credits} credits</span> · {price}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status] ?? ""}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
                {r.note ? (
                  <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm">
                    <span className="text-muted-foreground">Note: </span>
                    {r.note}
                  </p>
                ) : null}
                {r.status === "pending" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.email ? (
                      <Button asChild size="sm" variant="glass">
                        <a href={paymentEmailLink({ email: r.email, packName: pack?.name ?? r.pack, credits: r.credits, price })}>
                          <Mail /> Email payment details
                        </a>
                      </Button>
                    ) : null}
                    <Button size="sm" variant="hero" disabled={busyId === r.id} onClick={() => act(r.id, true, r.email ?? "this user")}>
                      {busyId === r.id ? <Loader2 className="animate-spin" /> : <Check />} Paid — add {r.credits} credits
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => act(r.id, false, r.email ?? "this request")}>
                      <X /> Decline
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function UsersPanel({ onAddCredits }: { onAddCredits: (u: UserRow) => void }) {
  const users = useQuery(adminUsersQuery());
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = users.data ?? [];
    if (!term) return list;
    return list.filter((u) => u.email?.toLowerCase().includes(term) || u.display_name?.toLowerCase().includes(term));
  }, [users.data, q]);

  if (users.isLoading) return <Loading />;
  if (users.isError) return <ErrorNote message={users.error.message} />;

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or name" className="pl-9" aria-label="Search users" />
      </div>
      {filtered.length === 0 ? (
        <Empty text="No users match." />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {filtered.map((u) => (
            <li key={u.user_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {u.email}
                  {u.is_admin ? <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">Admin</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {u.display_name ? `${u.display_name} · ` : ""}
                  {Number(u.edits_succeeded)} edits · joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                  <Coins className="size-4 text-primary" aria-hidden /> {u.credits}
                </span>
                <Button size="sm" variant="glass" onClick={() => onAddCredits({ user_id: u.user_id, email: u.email, display_name: u.display_name, credits: u.credits })}>
                  <Plus /> Credits
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreditDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const refresh = useRefreshAdmin();
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(sign: 1 | -1) {
    if (!user) return;
    const parsed = parseCreditAmount(amount);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setBusy(true);
    try {
      const left = await adjustCredits(user.user_id, parsed.value * sign, reason);
      toast.success(`${user.email} now has ${left} credits`);
      setReason("");
      refresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't change credits.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={Boolean(user)} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>Change credits</DialogTitle>
          <DialogDescription>
            {user?.email} has {user?.credits} credits right now.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="credit-amount" className="text-sm font-medium">How many credits</label>
            <Input id="credit-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="credit-reason" className="text-sm font-medium">
              Reason <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input id="credit-reason" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="e.g. bank transfer received" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => submit(-1)}>
            <Minus /> Remove
          </Button>
          <Button variant="hero" disabled={busy} onClick={() => submit(1)}>
            {busy ? <Loader2 className="animate-spin" /> : <Plus />} Add credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditsPanel() {
  const edits = useQuery(adminGenerationsQuery());
  if (edits.isLoading) return <Loading />;
  if (edits.isError) return <ErrorNote message={edits.error.message} />;
  if (!edits.data?.length) return <Empty text="No edits yet." />;
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {edits.data.map((g) => (
        <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold">{g.email}</p>
            <p className="text-xs text-muted-foreground">
              {g.category} · {g.style} · {new Date(g.created_at).toLocaleString()}
            </p>
            {g.status === "failed" && g.error_message ? <p className="mt-1 text-xs text-destructive">{g.error_message}</p> : null}
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${g.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-secondary"}`}>
            {g.status === "completed" ? `Done · ${g.credits_charged} credit${g.credits_charged === 1 ? "" : "s"}` : g.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Loading() {
  return (
    <div className="grid place-items-center py-16 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" aria-label="Loading" />
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</p>;
}
function ErrorNote({ message }: { message: string }) {
  return <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{message}</p>;
}
