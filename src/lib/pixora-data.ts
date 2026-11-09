// Browser data access. Row-level security limits every read and write to the signed-in user.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "pixora-images";

export type Generation = {
  id: string;
  category: string;
  style: string;
  custom_prompt: string | null;
  avoid_prompt: string | null;
  aspect_ratio: string;
  status: string;
  error_message: string | null;
  original_path: string | null;
  result_path: string | null;
  output_size: string | null;
  saved: boolean;
  created_at: string;
};

const GEN_COLUMNS =
  "id, category, style, custom_prompt, avoid_prompt, aspect_ratio, status, error_message, original_path, result_path, output_size, saved, created_at";

export const creditsQuery = () =>
  queryOptions({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("credit_balances").select("credits, plan").maybeSingle();
      if (error) throw new Error("Couldn't load your credits.");
      return data ?? { credits: 0, plan: "free" };
    },
  });

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw new Error("Couldn't load your profile.");
      return { email: user.email ?? "", id: user.id, display_name: data?.display_name ?? null, avatar_url: data?.avatar_url ?? null };
    },
  });

export const creationsQuery = (opts: { savedOnly: boolean; limit?: number }) =>
  queryOptions({
    queryKey: ["generations", opts],
    queryFn: async () => {
      let q = supabase
        .from("generations")
        .select(GEN_COLUMNS)
        .eq("status", "succeeded")
        .order("created_at", { ascending: false });
      if (opts.savedOnly) q = q.eq("saved", true);
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw new Error("Couldn't load your creations.");
      return (data ?? []) as Generation[];
    },
  });

export const generationQuery = (id: string) =>
  queryOptions({
    queryKey: ["generation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("generations").select(GEN_COLUMNS).eq("id", id).maybeSingle();
      if (error) throw new Error("Couldn't load this creation.");
      return (data as Generation | null) ?? null;
    },
  });

export const signedUrlsQuery = (paths: string[]) =>
  queryOptions({
    queryKey: ["signed-urls", paths],
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
      if (error) throw new Error("Couldn't load images.");
      const map: Record<string, string> = {};
      for (const item of data ?? []) if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
      return map;
    },
  });

export async function setSaved(id: string, saved: boolean) {
  const { error } = await supabase.from("generations").update({ saved }).eq("id", id);
  if (error) throw new Error("Couldn't update this creation.");
}

export async function deleteGeneration(gen: Pick<Generation, "id" | "original_path" | "result_path">) {
  const paths = [gen.original_path, gen.result_path].filter((p): p is string => Boolean(p));
  if (paths.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) throw new Error("Couldn't delete the image files. Please try again.");
  }
  const { error } = await supabase.from("generations").delete().eq("id", gen.id);
  if (error) throw new Error("Couldn't delete this creation.");
}

export async function deleteAllPhotos() {
  const { data, error } = await supabase.from("generations").select("id, original_path, result_path");
  if (error) throw new Error("Couldn't load your photos.");
  const paths = (data ?? []).flatMap((g) => [g.original_path, g.result_path]).filter((p): p is string => Boolean(p));
  for (let i = 0; i < paths.length; i += 100) {
    const { error: rmError } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (rmError) throw new Error("Couldn't delete some image files. Please try again.");
  }
  const ids = (data ?? []).map((g) => g.id);
  if (ids.length) {
    const { error: delError } = await supabase.from("generations").delete().in("id", ids);
    if (delError) throw new Error("Couldn't delete your history.");
  }
  return ids.length;
}

export async function downloadImage(url: string, filename: string) {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Download failed. Check your connection and try again.");
  }
  if (!res.ok) throw new Error("Download failed. The link may have expired — please refresh and try again.");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

/** Width/height ratio of a stored result, e.g. "1024x1280" -> 0.8. Falls back to 1. */
export function aspectFromSize(size: string | null | undefined, fallback = 1) {
  const m = /^(\d+)x(\d+)$/.exec(size ?? "");
  if (!m) return fallback;
  const w = Number(m[1]);
  const h = Number(m[2]);
  return w > 0 && h > 0 ? w / h : fallback;
}

/** Downloads one of the user's stored images and returns it as a File for re-editing. */
export async function fileFromStorage(path: string, name: string): Promise<File> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error("Couldn't load that image. Please try again.");
  return new File([data], name, { type: data.type || "image/png" });
}

export function downloadName(gen: Pick<Generation, "id" | "style">) {
  return `pixora-${gen.style}-${gen.id.slice(0, 8)}.png`;
}
