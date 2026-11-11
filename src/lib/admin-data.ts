// Admin data. Every database function re-checks the admin role server-side; the UI checks are only for display.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function fetchIsAdmin() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return false;
  const { data, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
  if (error) return false;
  return Boolean(data);
}

export const isAdminQuery = () =>
  queryOptions({ queryKey: ["is-admin"], queryFn: fetchIsAdmin, staleTime: 5 * 60 * 1000 });

export type AdminOverview = {
  users: number;
  new_users_7d: number;
  edits_succeeded: number;
  edits_failed: number;
  edits_24h: number;
  pending_requests: number;
};

export const adminOverviewQuery = () =>
  queryOptions({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview");
      if (error) throw new Error("Couldn't load the overview.");
      return data as unknown as AdminOverview;
    },
  });

export const adminUsersQuery = () =>
  queryOptions({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw new Error("Couldn't load users.");
      return data ?? [];
    },
  });

export const adminGenerationsQuery = () =>
  queryOptions({
    queryKey: ["admin", "generations"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recent_generations", { _limit: 100 });
      if (error) throw new Error("Couldn't load recent edits.");
      return data ?? [];
    },
  });

export const adminRequestsQuery = () =>
  queryOptions({
    queryKey: ["admin", "requests"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_credit_requests");
      if (error) throw new Error("Couldn't load credit requests.");
      return data ?? [];
    },
  });

export async function adjustCredits(userId: string, amount: number, reason: string) {
  const { data, error } = await supabase.rpc("admin_adjust_credits", { _user_id: userId, _amount: amount, _reason: reason });
  if (error) throw new Error(error.message.includes("invalid_amount") ? "Enter a number between -10000 and 10000 (not 0)." : "Couldn't change credits.");
  return data as number;
}

export async function resolveRequest(id: string, approve: boolean) {
  const { error } = await supabase.rpc("admin_resolve_credit_request", { _id: id, _approve: approve });
  if (error) throw new Error(error.message.includes("not_found") ? "This request was already handled." : "Couldn't update the request.");
}

export const myCreditRequestsQuery = () =>
  queryOptions({
    queryKey: ["my-credit-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_requests")
        .select("id, pack, credits, price_cents, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error("Couldn't load your requests.");
      return data ?? [];
    },
  });
