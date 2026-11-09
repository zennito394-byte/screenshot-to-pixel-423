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
import { ACCEPTED_EXTENSIONS, MAX_AVOID_CHARS, MAX_PROMPT_CHARS, moderatePrompt, outputSizeFor } from "@/lib/generation-rules";
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
  validateSearch: (s: Record<string, unknown>): StudioSearch => {
    const category = findCategory(typeof s["category"] === "string" ? s["category"] : undefined)?.id;
    const style = typeof s["style"] === "string" ? s["style"] : undefined;
    const from = typeof s["from"] === "string" && /^[0-9a-f-]{36}$/i.test(s["from"]) ? s["from"] : undefined;
    const use = s["use"] === "original" || s["use"] === "result" ? s["use"] : undefined;
    return { category, style, from, use };
  },
  head: () => ({
    meta: [
      { title: "AI Editing Studio — PIXORA AI" },
      { name: "description", content: "Upload a photo, choose a style and let AI transform it." },
      { property: "og:title", content: "AI Editing Studio — PIXORA AI" },
      { property: "og:description", content: "Upload a photo, choose a style and let AI transform it." },
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
  const [aspect, setAspect] = useState<AspectRatioId>("original");
  const [consent, setConsent] = useState(false);

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

  // "Regenerate" / "Edit again" links from My Creations.
  const loadedFrom = useRef<string | null>(null);
  useEffect(() => {
    if (!search.from) return;
    const key = `${search.from}:${search.use ?? "result"}`;
    if (loadedFrom.current === key) return;
    loadedFrom.current = key;
    (async () => {
      setPrepPct(0);
      const { data: gen, error: genError } = await supabase
        .from("generations")
        .select("category, style, custom_prompt, avoid_prompt, aspect_ratio, original_path, result_path")
        .eq("id", search.from!)
        .maybeSingle();
      const path = search.use === "original" ? gen?.original_path : gen?.result_path;
      if (genError || !gen || !path) {
        setPrepPct(null);
        setFileError("Couldn't load that creation. It may have been deleted.");
        return;
      }
      if (search.use === "original" && findStyle(gen.category, gen.style)) {
        setCategoryId(gen.category as CategoryId);
        setStyleId(gen.style);
        setCustomPrompt(gen.custom_prompt ?? "");
        setAvoidPrompt(gen.avoid_prompt ?? "");
        if (ASPECT_RATIOS.some((a) => a.id === gen.aspect_ratio)) setAspect(gen.aspect_ratio as AspectRatioId);
      }
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

  const outOfCredits = credits.data !== undefined && credits.data.credits < 1;
  const needsPrompt = categoryId === "custom" && !customPrompt.trim();
  const canGenerate = Boolean(image) && consent && !needsPrompt && !busy && !outOfCredits && prepPct === null;

  async function generate() {
    if (!image) return;
    const mod = moderatePrompt(`${customPrompt} ${avoidPrompt}`);
    if (!mod.ok) {
      setError({ message: mod.reason, retryable: false });
      return;
    }
    setError(null);
    setPartial(null);
    setResult(null);
    setUploadPct(0);
    setPhase("uploading");
    try {
      const done = await generateImage(
        {
          image: image.blob,
          width: image.width,
          height: image.height,
          category: categoryId,
          style: styleId,
          customPrompt,
          avoidPrompt,
          aspectRatio: aspect,
          consent,
        },
        { onUploadProgress: setUploadPct, onStage: setPhase, onPartial: setPartial },
      );
      queryClient.setQueryData(creditsQuery().queryKey, (old) => ({ plan: old?.plan ?? "free", credits: done.credits }));
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
      const { data, error: urlError } = await supabase.storage.from(BUCKET).createSignedUrl(done.resultPath, 3600);
      if (urlError || !data) throw new GenerateError("Your image was created but couldn't be shown. Find it in My Creations.");
      const size = outputSizeFor(aspect, { width: image.width, height: image.height });
      setResult({
        generationId: done.generationId,
        resultPath: done.resultPath,
        url: data.signedUrl,
        ratio: aspectFromSize(size, image.width / image.height),
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
      const file = await fileFromStorage(result.resultPath, "edit.png");
      await loadFile(file);
      toast.success("Your result is now the starting photo. Pick a new style.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load the result.");
    }
  }

  async function toggleSave() {
    if (!result) return;
    const next = !result.saved;
    try {
      await setSaved(result.generationId, next);
      setResult({ ...result, saved: next });
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
      toast.success(next ? "Saved to favourites" : "Removed from favourites");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  async function download() {
    if (!result) return;
    try {
      await downloadImage(result.url, `pixora-${result.style}-${result.generationId.slice(0, 8)}.png`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed.");
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Studio</p>
          <h1 className="mt-1 text-3xl font-bold">Create with AI</h1>
        </div>
        <p className="text-sm text-muted-foreground">Each generation uses 1 credit. Failed ones are free.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Left: photo, progress and result */}
        <section aria-label="Photo" className="space-y-4">
          {phase === "result" && result && image ? (
            <div className="space-y-4">
              <div className="relative w-full" style={{ aspectRatio: String(result.ratio) }}>
                <BeforeAfter before={image.previewUrl} after={result.url} alt="Your photo" className="h-full w-full" eager />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button variant="hero" onClick={download}>
                  <Download /> Download
                </Button>
                <Button variant="glass" onClick={generate} disabled={!canGenerate}>
                  <RefreshCw /> Regenerate
                </Button>
                <Button variant="glass" onClick={editAgain}>
                  <PencilLine /> Edit again
                </Button>
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
              {image ? (
                <>
                  <img
                    src={busy && partial ? partial : image.previewUrl}
                    alt="Your uploaded photo"
                    className={cn(
                      "absolute inset-0 h-full w-full object-contain transition-[filter] duration-500",
                      busy && (partial ? "blur-md" : "blur-[2px] brightness-75"),
                    )}
                  />
                  {busy ? (
                    <div className="relative z-10 mx-6 w-full max-w-xs rounded-2xl glass border border-border p-5 text-center">
                      <Loader2 className="mx-auto size-7 animate-spin text-primary" />
                      <p className="mt-3 font-semibold">
                        {phase === "uploading" ? "Uploading your photo…" : partial ? "Adding the final details…" : "AI is editing your photo…"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {phase === "uploading" ? `${uploadPct}%` : "This usually takes 20–60 seconds. Keep this page open."}
                      </p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                        {phase === "uploading" ? (
                          <div className="h-full bg-gradient-brand transition-all" style={{ width: `${uploadPct}%` }} />
                        ) : (
                          <div className="h-full w-full bg-gradient-brand shimmer-bar" />
                        )}
                      </div>
                    </div>
                  ) : (
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
                  )}
                </>
              ) : prepPct !== null ? (
                <div className="w-full max-w-xs px-6 text-center">
                  <Loader2 className="mx-auto size-7 animate-spin text-primary" />
                  <p className="mt-3 font-semibold">Preparing your photo…</p>
                  <Progress value={prepPct} className="mt-3" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center"
                >
                  <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-brand-soft">
                    <ImageUp className="size-7 text-primary" />
                  </span>
                  <span className="text-lg font-semibold">Drop a photo here or tap to upload</span>
                  <span className="text-sm text-muted-foreground">JPG, JPEG, PNG or WEBP · up to 15 MB</span>
                  <span className="text-xs text-muted-foreground">Clear, well-lit photos of one person work best.</span>
                </button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={["image/jpeg", "image/png", "image/webp", ...ACCEPTED_EXTENSIONS].join(",")}
                className="sr-only"
                aria-label="Upload a photo"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void loadFile(f);
                }}
              />
            </div>
          )}
          {fileError ? (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" /> {fileError}
            </p>
          ) : null}
        </section>

        {/* Right: settings */}
        <section aria-label="Editing options" className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div>
            <h2 className="text-sm font-semibold">1. Category</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={busy}
                  onClick={() => chooseCategory(c.id)}
                  aria-pressed={c.id === categoryId}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-border text-left transition-all",
                    c.id === categoryId ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100",
                  )}
                >
                  <img src={CATEGORY_IMAGES[c.id]} alt="" className="h-16 w-full object-cover sm:h-20" loading="lazy" />
                  <span className="block bg-surface px-2 py-1.5 text-[11px] font-semibold leading-tight sm:text-xs">{c.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{category.tagline}</p>
          </div>

          {category.id !== "custom" ? (
            <div>
              <h2 className="text-sm font-semibold">2. Style</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {category.styles.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setStyleId(s.id)}
                    aria-pressed={s.id === styleId}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      s.id === styleId ? "border-primary bg-accent" : "border-border bg-surface hover:border-primary/40",
                    )}
                  >
                    <span className="block text-sm font-semibold">{s.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{s.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-prompt" className="text-sm font-semibold">
                {category.id === "custom" ? "2. Describe your edit" : "3. Extra instructions (optional)"}
              </Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                disabled={busy}
                maxLength={MAX_PROMPT_CHARS}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={
                  category.id === "custom"
                    ? "e.g. Put me in a sunlit café in Paris wearing a beige trench coat"
                    : "e.g. Navy suit, warm lighting"
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
                placeholder="e.g. glasses, heavy makeup"
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
              I own this photo or have permission from the person in it to edit it, and I won't use the result to deceive or
              impersonate anyone.
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
              You've used all your free credits. Paid plans are coming soon —{" "}
              <Link to="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
                contact us
              </Link>{" "}
              if you need more now.
            </div>
          ) : null}

          <Button variant="hero" size="xl" className="w-full" disabled={!canGenerate} onClick={generate}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? "Generating…" : phase === "result" ? "Generate another" : "Generate"}
          </Button>
          {!busy && !canGenerate && !outOfCredits ? (
            <p className="-mt-3 text-center text-xs text-muted-foreground">
              {!image ? "Upload a photo to begin." : needsPrompt ? "Describe the edit you want." : !consent ? "Tick the permission box to continue." : ""}
            </p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
