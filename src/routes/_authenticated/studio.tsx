import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Download,
  Heart,
  ImageUp,
  Images,
  Loader2,
  PencilLine,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/pixora/AppShell";
import { BeforeAfter } from "@/components/pixora/BeforeAfter";
import { CATEGORY_IMAGES } from "@/components/pixora/showcase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { generateImage, GenerateError } from "@/lib/generate-client";
import { ACCEPTED_EXTENSIONS, CREDITS_PAUSED, DAILY_FREE_CREDITS, MAX_AVOID_CHARS, MAX_PROMPT_CHARS, moderatePrompt, outputSizeFor } from "@/lib/generation-rules";
import { prepareImage, type PreparedImage } from "@/lib/image-prep";
import { ASPECT_RATIOS, CATEGORIES, findCategory, findStyle, type AspectRatioId, type CategoryId } from "@/lib/pixora-catalog";
import { aspectFromSize, BUCKET, creditsQuery, downloadImage, fileFromStorage, setSaved } from "@/lib/pixora-data";
import { cn } from "@/lib/utils";

type StudioSearch = {
  category?: CategoryId | undefined;
  style?: string | undefined;
  from?: string | undefined;
  use?: "original" | "result" | undefined;
};

export const Route = createFileRoute("/_authenticated/studio")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): StudioSearch => {
    const category = findCategory(typeof s["category"] === "string" ? s["category"] : undefined)?.id;
    const style = typeof s["style"] === "string" ? s["style"] : undefined;
    const from = typeof s["from"] === "string" && /^[0-9a-f-]{36}$/i.test(s["from"]) ? s["from"] : undefined;
    const use = s["use"] === "original" || s["use"] === "result" ? s["use"] : undefined;
    return { category, style, from, use };
  },
  head: () => ({
    meta: [
      { title: "Retro Time Machine Studio — Musafa AI" },
      { name: "description", content: "Step back into iconic eras with AI-generated retro cultural portraits." },
      { property: "og:title", content: "Retro Time Machine Studio — Musafa AI" },
      { property: "og:description", content: "Step back into iconic eras with AI-generated retro cultural portraits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Studio,
});

type Phase = "setup" | "uploading" | "generating" | "result";
type Result = { generationId: string; resultPath: string; url: string; ratio: number; saved: boolean; style: string };

function Studio() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const credits = useQuery(creditsQuery());

  const initialCategory = search.category ?? "portraits";
  const [categoryId, setCategoryId] = useState<CategoryId>(initialCategory);
  const [styleId, setStyleId] = useState<string>(
    findStyle(initialCategory, search.style)?.style.id ?? findCategory(initialCategory)!.styles[0]!.id,
  );
  const [customPrompt, setCustomPrompt] = useState("");
  const [avoidPrompt, setAvoidPrompt] = useState("");
  const [aspect, setAspect] = useState<AspectRatioId>("1:1");
  const [consent, setConsent] = useState(true);

  const [image, setImage] = useState<PreparedImage | null>(null);
  const [prepPct, setPrepPct] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("setup");
  const [uploadPct, setUploadPct] = useState(0);
  const [partial, setPartial] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Bring the finished photo into view as soon as it exists.
  useEffect(() => {
    if (phase === "result") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase]);

  const category = findCategory(categoryId)!;
  const busy = phase === "uploading" || phase === "generating";

  const loadFile = useCallback(async (file: File) => {
    setFileError(null);
    setError(null);
    setPrepPct(0);
    try {
      const prepared = await prepareImage(file, setPrepPct);
      setImage((old) => {
        if (old) URL.revokeObjectURL(old.previewUrl);
        return prepared;
      });
      setResult(null);
      setPhase("setup");
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "This photo couldn't be used.");
    } finally {
      setPrepPct(null);
    }
  }, []);

  useEffect(() => {
    if (!search.from) return;
    const path = `${search.from}/${search.use === "result" ? "result.png" : "source.png"}`;
    void (async () => {
      try {
        const file = await fileFromStorage(path, "source.png");
        await loadFile(file);
      } catch (e) {
        setPrepPct(null);
        setFileError(e instanceof Error ? e.message : "Couldn't load that image.");
      }
    })();
  }, [search.from, search.use, loadFile]);

  function chooseCategory(id: CategoryId) {
    setCategoryId(id);
    setStyleId(findCategory(id)!.styles[0]!.id);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  }

  const outOfCredits = !CREDITS_PAUSED && credits.data !== undefined && credits.data.credits < 1;
  const needsPrompt = categoryId === "custom" && !customPrompt.trim();
  const canGenerate = consent && !needsPrompt && !busy && !outOfCredits && prepPct === null;

  async function generate() {
    if (!consent) return;
    const mod = moderatePrompt(`${customPrompt} ${avoidPrompt}`);
    if (!mod.ok) {
      setError({ message: mod.reason, retryable: false });
      return;
    }
    setError(null);
    setPartial(null);
    setResult(null);
    setUploadPct(0);
    setPhase(image ? "uploading" : "generating");
    try {
      const baseWidth = image?.width ?? 1024;
      const baseHeight = image?.height ?? 1024;
      const resolvedAspect = aspect === "original" && !image ? "1:1" : aspect;

      const done = await generateImage(
        {
          image: image?.blob,
          width: baseWidth,
          height: baseHeight,
          category: categoryId,
          style: styleId,
          customPrompt,
          avoidPrompt,
          aspectRatio: resolvedAspect,
          consent,
        },
        { onUploadProgress: setUploadPct, onStage: setPhase, onPartial: setPartial },
      );
      queryClient.setQueryData(creditsQuery().queryKey, (old) => ({ plan: old?.plan ?? "free", credits: done.credits }));
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
      const { data, error: urlError } = await supabase.storage.from(BUCKET).createSignedUrl(done.resultPath, 3600);
      if (urlError || !data) throw new GenerateError("Your image was created but couldn't be shown. Find it in My Creations.");
      const size = outputSizeFor(resolvedAspect, { width: baseWidth, height: baseHeight });
      setResult({
        generationId: done.generationId,
        resultPath: done.resultPath,
        url: data.signedUrl,
        ratio: aspectFromSize(size, baseWidth / baseHeight),
        saved: false,
        style: styleId,
      });
      setPhase("result");
    } catch (e) {
      const err = e instanceof GenerateError ? e : new GenerateError("Something went wrong. Please try again.", "error", true);
      setError({ message: err.message, retryable: err.retryable });
      setPhase("setup");
      void queryClient.invalidateQueries({ queryKey: ["credits"] });
    } finally {
      setPartial(null);
    }
  }

  async function editAgain() {
    if (!result) return;
    try {
      const file = await fileFromStorage(result.resultPath, "previous-edit.png");
      await loadFile(file);
      toast.success("Result loaded for your next edit.");
    } catch {
      toast.error("Couldn't reload that edit. Try uploading a new photo.");
    }
  }

  async function toggleSave() {
    if (!result) return;
    const next = !result.saved;
    setResult((r) => (r ? { ...r, saved: next } : r));
    const ok = await setSaved(result.generationId, next);
    if (!ok) {
      setResult((r) => (r ? { ...r, saved: !next } : r));
      toast.error("Couldn't update save status.");
    } else {
      toast.success(next ? "Saved to your favorites." : "Removed from favorites.");
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
    }
  }

  function download() {
    if (!result) return;
    const active = findStyle(categoryId, styleId)?.style.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "portrait";
    downloadImage(result.url, `pixora-${active}-${Date.now()}.png`);
  }

  return (
    <AppShell
      breadcrumbs={[{ label: "Studio" }]}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/creations">
            <Images /> My Creations
          </Link>
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Canvas / Preview */}
        <section className="lg:col-span-7 xl:col-span-8">
          <div ref={resultRef} />
          {phase === "result" && result ? (
            <div className="space-y-4">
              <div
                className="relative overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-card"
                style={{ aspectRatio: String(result.ratio) }}
              >
                {image ? (
                  <BeforeAfter before={image.previewUrl} after={result.url} alt="Your photo" className="h-full w-full" eager />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black/50 p-2">
                    <img
                      src={result.url}
                      alt="Generated vintage portrait"
                      className="h-full w-full rounded-2xl object-contain shadow-2xl"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button variant="hero" onClick={download}>
                  <Download /> Download
                </Button>
                <Button variant="glass" onClick={generate} disabled={!canGenerate}>
                  <RefreshCw /> Regenerate
                </Button>
                {image ? (
                  <Button variant="glass" onClick={editAgain}>
                    <PencilLine /> Edit again
                  </Button>
                ) : null}
                <Button variant="glass" onClick={toggleSave} aria-pressed={result.saved}>
                  <Heart className={cn(result.saved && "fill-primary text-primary")} /> {result.saved ? "Saved" : "Save"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link to="/creations/$id" params={{ id: result.generationId }}>
                    <Images /> View in My Creations
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-card shadow-card transition-colors sm:min-h-[460px]",
                dragging && "border-primary bg-accent",
                image && "border-solid",
              )}
            >
              {busy ? (
                <div className="relative z-10 mx-6 w-full max-w-xs rounded-2xl glass border border-border p-5 text-center">
                  <Loader2 className="mx-auto size-7 animate-spin text-primary" />
                  <p className="mt-3 font-semibold">
                    {phase === "uploading"
                      ? "Uploading reference photo…"
                      : partial
                        ? "Adding the final film details…"
                        : "Creating your retro portrait with AI…"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {phase === "uploading" ? `${uploadPct}%` : "This takes ~15–25 seconds. Keep this page open."}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                    {phase === "uploading" ? (
                      <div className="h-full bg-gradient-brand transition-all" style={{ width: `${uploadPct}%` }} />
                    ) : (
                      <div className="h-full w-full bg-gradient-brand shimmer-bar" />
                    )}
                  </div>
                </div>
              ) : image ? (
                <>
                  <img
                    src={image.previewUrl}
                    alt="Your uploaded reference photo"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <div className="absolute right-3 top-3 z-10 flex gap-2">
                    <Button size="sm" variant="glass" onClick={() => inputRef.current?.click()}>
                      <Upload /> Replace
                    </Button>
                    <Button
                      size="icon"
                      variant="glass"
                      className="size-9"
                      aria-label="Remove photo"
                      onClick={() => {
                        URL.revokeObjectURL(image.previewUrl);
                        setImage(null);
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                </>
              ) : prepPct !== null ? (
                <div className="w-full max-w-xs px-6 text-center">
                  <Loader2 className="mx-auto size-7 animate-spin text-primary" />
                  <p className="mt-3 font-semibold">Preparing reference photo…</p>
                  <Progress value={prepPct} className="mt-3" />
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-brand-soft shadow-lg">
                    <Sparkles className="size-8 text-primary" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">African Retro Time Machine</h3>
                    <p className="text-sm text-muted-foreground">
                      Pick any historical era or royal archetype on the right and click <strong>Generate</strong> to create an authentic 35mm portrait instantly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface/60 px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                  >
                    <ImageUp className="size-4 text-primary" /> Optional: Upload reference photo
                  </button>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={["image/jpeg", "image/png", "image/webp", ...ACCEPTED_EXTENSIONS].join(",")}
                className="sr-only"
                aria-label="Upload a photo"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void loadFile(f);
                }}
              />
            </div>
          )}
          {fileError ? <p className="mt-2 text-sm text-destructive">{fileError}</p> : null}
        </section>

        {/* Controls Sidebar */}
        <section className="space-y-6 lg:col-span-5 xl:col-span-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Eras & Archetypes</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => {
                const active = c.id === categoryId;
                const img = CATEGORY_IMAGES[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={busy}
                    onClick={() => chooseCategory(c.id)}
                    aria-pressed={active}
                    className={cn(
                      "group relative flex flex-col items-center overflow-hidden rounded-2xl border p-2 text-center transition-all",
                      active
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-xl bg-secondary">
                      <img
                        src={img.src}
                        alt={c.label}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="text-xs font-medium leading-tight line-clamp-1">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Styles in {category.label}</h2>
              <span className="text-xs text-muted-foreground">{category.styles.length} options</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{category.tagline}</p>
            <div className="mt-3 grid gap-2">
              {category.styles.map((s) => {
                const active = s.id === styleId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setStyleId(s.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col rounded-xl border p-3 text-left transition-colors",
                      active ? "border-primary bg-accent text-foreground" : "border-border bg-surface hover:border-primary/40",
                    )}
                  >
                    <span className="text-sm font-semibold">{s.label}</span>
                    <span className="text-xs text-muted-foreground">{s.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="custom-prompt" className="text-sm font-semibold">
                {categoryId === "custom" ? "Describe your vision *" : "Custom character details (optional)"}
              </Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                disabled={busy}
                maxLength={MAX_PROMPT_CHARS}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={
                  categoryId === "custom"
                    ? "e.g. 1970s jazz saxophonist playing in a dimly lit lounge in Gaborone with warm film grain..."
                    : "e.g. smiling warmly, gold necklace, holding vintage sunglasses..."
                }
                className="mt-2 min-h-20"
              />
            </div>
            <div>
              <Label htmlFor="avoid-prompt" className="text-sm font-semibold">
                Things to avoid (optional)
              </Label>
              <Textarea
                id="avoid-prompt"
                value={avoidPrompt}
                disabled={busy}
                maxLength={MAX_AVOID_CHARS}
                onChange={(e) => setAvoidPrompt(e.target.value)}
                placeholder="e.g. modern buildings, bright flash, plastic skin"
                className="mt-2 min-h-14"
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Aspect ratio</h2>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {ASPECT_RATIOS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setAspect(a.id)}
                  aria-pressed={a.id === aspect}
                  className={cn(
                    "rounded-lg border px-1 py-2 text-center transition-colors",
                    a.id === aspect ? "border-primary bg-accent" : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <span className="block text-xs font-semibold">{a.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
            <Checkbox id="consent" checked={consent} disabled={busy} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <Label htmlFor="consent" className="text-xs font-normal leading-relaxed text-muted-foreground">
              I agree to create respectful AI portraits, and I won't use the result to deceive or impersonate anyone.
            </Label>
          </div>

          {error ? (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="flex-1">
                <p>{error.message}</p>
                {error.retryable && canGenerate ? (
                  <Button size="sm" variant="outline" className="mt-2" onClick={generate}>
                    <RefreshCw /> Try again
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {outOfCredits ? (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
              You're out of credits for today. You'll get {DAILY_FREE_CREDITS} free credits at midnight, or{" "}
              <Link to="/pricing" className="font-semibold text-primary underline-offset-4 hover:underline">
                buy more
              </Link>{" "}
              now.
            </div>
          ) : null}

          {phase === "result" && result ? (
            <div className="space-y-3 rounded-2xl border border-primary/40 bg-accent/40 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" /> Your portrait is ready!
              </p>
              <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: String(result.ratio) }}>
                {image ? (
                  <BeforeAfter before={image.previewUrl} after={result.url} alt="Your edited photo" className="h-full w-full" eager />
                ) : (
                  <img src={result.url} alt="Generated vintage portrait" className="h-full w-full object-contain" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="hero" onClick={download}>
                  <Download /> Download
                </Button>
                <Button size="sm" variant="glass" onClick={toggleSave} aria-pressed={result.saved}>
                  <Heart className={cn(result.saved && "fill-primary text-primary")} /> {result.saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          ) : null}

          <Button variant="hero" size="xl" className="w-full" disabled={!canGenerate} onClick={generate}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? "Generating…" : phase === "result" ? "Generate another" : "Generate Portrait"}
          </Button>
          {!busy && !canGenerate && !outOfCredits ? (
            <p className="-mt-3 text-center text-xs text-muted-foreground">
              {needsPrompt ? "Describe the vision you want." : !consent ? "Tick the agreement box to generate." : ""}
            </p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
