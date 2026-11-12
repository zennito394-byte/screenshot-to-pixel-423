import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Heart, Loader2, PencilLine, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/pixora/AppShell";
import { BeforeAfter } from "@/components/pixora/BeforeAfter";
import { styleLabel } from "@/components/pixora/CreationCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ASPECT_RATIOS } from "@/lib/pixora-catalog";
import {
  aspectFromSize,
  deleteGeneration,
  downloadImage,
  downloadName,
  generationQuery,
  setSaved,
  signedUrlsQuery,
} from "@/lib/pixora-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/creations/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Creation — PIXORA AI" },
      { name: "description", content: "Compare, download or keep editing your AI photo." },
      { property: "og:title", content: "Creation — PIXORA AI" },
      { property: "og:description", content: "Compare, download or keep editing your AI photo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreationDetail,
});

function CreationDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const gen = useQuery(generationQuery(id));
  const paths = [gen.data?.original_path, gen.data?.result_path].filter((p): p is string => Boolean(p));
  const urls = useQuery(signedUrlsQuery(paths));
  const [deleting, setDeleting] = useState(false);

  const g = gen.data;
  const before = g?.original_path ? urls.data?.[g.original_path] : undefined;
  const after = g?.result_path ? urls.data?.[g.result_path] : undefined;

  async function toggleSave() {
    if (!g) return;
    try {
      await setSaved(g.id, !g.saved);
      await queryClient.invalidateQueries({ queryKey: ["generation", id] });
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
      toast.success(!g.saved ? "Saved to favourites" : "Removed from favourites");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  async function remove() {
    if (!g) return;
    setDeleting(true);
    try {
      await deleteGeneration(g);
      queryClient.removeQueries({ queryKey: ["generation", id] });
      await queryClient.invalidateQueries({ queryKey: ["generations"] });
      toast.success("Creation deleted");
      navigate({ to: "/creations" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete.");
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <Button asChild variant="ghost" className="mb-4 -ml-3">
        <Link to="/creations">
          <ArrowLeft /> My Creations
        </Link>
      </Button>

      {gen.isLoading ? (
        <div className="aspect-[4/5] max-w-xl animate-pulse rounded-3xl bg-surface" />
      ) : gen.isError || !g || g.status !== "succeeded" ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <h1 className="text-xl font-bold">This creation isn't available</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may have been deleted.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative w-full" style={{ aspectRatio: String(aspectFromSize(g.output_size, 0.8)) }}>
            {before && after ? (
              <BeforeAfter before={before} after={after} alt={styleLabel(g)} className="h-full w-full" eager />
            ) : after ? (
              <img src={after} alt={styleLabel(g)} className="h-full w-full rounded-3xl object-cover" />
            ) : (
              <div className="h-full w-full animate-pulse rounded-3xl bg-surface" />
            )}
          </div>
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold">{styleLabel(g)}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(g.created_at).toLocaleString()} · {ASPECT_RATIOS.find((a) => a.id === g.aspect_ratio)?.hint ?? g.aspect_ratio}
              </p>
            </div>
            {g.custom_prompt || g.avoid_prompt ? (
              <dl className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
                {g.custom_prompt ? (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">Instructions</dt>
                    <dd className="mt-0.5">{g.custom_prompt}</dd>
                  </div>
                ) : null}
                {g.avoid_prompt ? (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">Avoided</dt>
                    <dd className="mt-0.5">{g.avoid_prompt}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="hero"
                disabled={!after}
                onClick={() =>
                  after && downloadImage(after, downloadName(g)).catch((e: Error) => toast.error(e.message))
                }
              >
                <Download /> Download
              </Button>
              <Button variant="glass" onClick={toggleSave} aria-pressed={g.saved}>
                <Heart className={cn(g.saved && "fill-primary text-primary")} /> {g.saved ? "Saved" : "Save"}
              </Button>
              <Button asChild variant="glass">
                <Link to="/studio" search={{ from: g.id, use: "original" }}>
                  <RefreshCw /> Regenerate
                </Link>
              </Button>
              <Button asChild variant="glass">
                <Link to="/studio" search={{ from: g.id, use: "result" }}>
                  <PencilLine /> Edit again
                </Link>
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={deleting}>
                  {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete creation
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this creation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The original photo and the AI result will be permanently removed. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </AppShell>
  );
}
