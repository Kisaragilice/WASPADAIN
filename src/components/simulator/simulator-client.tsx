"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Flag,
  Info,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSimulatorStore } from "./simulator-store";
import { SceneView } from "./scene-view";
import { CHANNEL_META } from "@/components/brand/icons";
import { getBadge } from "@/lib/gamification";
import {
  DIFFICULTY_LABEL,
  getScene,
  type ScenarioConfig,
} from "@/lib/scenario/types";
import { cn } from "@/lib/utils";

export function SimulatorClient({
  slug,
  title,
  subtitle,
  channel,
  difficulty,
  estimatedMinutes,
  level,
  config,
  attemptId,
  currentSceneId,
}: {
  slug: string;
  title: string;
  subtitle: string;
  channel: keyof typeof CHANNEL_META;
  difficulty: keyof typeof DIFFICULTY_LABEL;
  estimatedMinutes: number;
  level: number;
  config: ScenarioConfig;
  attemptId: string;
  currentSceneId: string | null;
}) {
  const store = useSimulatorStore();
  const active = store.attemptId === attemptId;
  const sceneId = active ? store.sceneId : (currentSceneId ?? config.startSceneId);
  const scene = sceneId ? getScene(config, sceneId) : undefined;
  const pending = active ? store.pending : false;
  const completed = active && store.completed;
  const result = active ? store.result : null;
  const feedback = active ? store.feedback : null;
  const channelMeta = CHANNEL_META[channel];
  const ChannelIcon = channelMeta.icon;
  const tip =
    scene?.type === "phone-home" && scene.tip ? scene.tip : null;
  const [dismissedResult, setDismissedResult] = useState(false);
  const showResultDialog = completed && !dismissedResult;

  useEffect(() => {
    if (!completed) setDismissedResult(false);
  }, [completed]);

  useEffect(() => {
    store.init({
      attemptId,
      slug,
      startSceneId: config.startSceneId,
      currentSceneId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, slug, config.startSceneId, currentSceneId]);

  const choose = (choiceId: string) => {
    if (!scene) return;
    void store.submit(scene.id, choiceId);
  };
  const action = (actionId: string) => {
    if (!scene) return;
    void store.submit(scene.id, actionId);
  };

  if (!scene && !completed) {
    return (
      <div className="page-shell">
        <p className="rounded-2xl bg-white p-6 text-sm text-muted-foreground">
          Simulasi tidak dapat dimuat.{" "}
          <Link href="/simulasi" className="font-semibold text-primary underline">
            Kembali ke dasbor
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        backHref="/simulasi"
        eyebrow="Ruang simulasi"
        title={title}
        description={subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{DIFFICULTY_LABEL[difficulty]}</Badge>
            <Badge variant="warning">Level {level}</Badge>
          </div>
        }
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 rounded-3xl bg-[#EEF3FD] p-4 lg:hidden">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FCF3C8] text-[#8A6200]">
                <Info className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                  Misi edukasi
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-brand-ink/70">
                  {config.intro.mission}
                </p>
              </div>
            </div>
          </div>

          {feedback ? (
            <div
              role="status"
              className="mb-4 flex items-start gap-2.5 rounded-2xl border border-primary/15 bg-brand-mint/70 p-3.5 text-[12px] leading-relaxed text-[#0B5E54]"
            >
              <Flag className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="min-w-0 flex-1">{feedback}</p>
              <button
                type="button"
                onClick={store.dismissFeedback}
                className="shrink-0 text-[10px] font-bold uppercase tracking-wide underline-offset-2 hover:underline"
              >
                Tutup
              </button>
            </div>
          ) : null}

          {completed && result ? (
            <div className="rounded-3xl border border-white bg-white p-5 shadow-card">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                    result.outcome === "SAFE"
                      ? "bg-brand-mint text-primary"
                      : "bg-brand-blush text-[#B91C2D]",
                  )}
                >
                  {result.outcome === "SAFE" ? (
                    <ShieldCheck className="h-6 w-6" />
                  ) : (
                    <TriangleAlert className="h-6 w-6" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-extrabold leading-tight">
                    {result.outcome === "SAFE"
                      ? "Aman! Simulasi selesai."
                      : "Simulasi selesai — saatnya belajar."}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-brand-ink/60">
                    {result.feedback}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-brand-cream p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-ink/40">
                    Skor
                  </p>
                  <p className="text-xl font-extrabold">{result.score}</p>
                </div>
                <div className="rounded-2xl bg-brand-cream p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-ink/40">
                    XP diperoleh
                  </p>
                  <p className="text-xl font-extrabold">+{result.xpEarned}</p>
                </div>
              </div>

              {result.newBadges.length ? (
                <div className="mt-2 rounded-2xl bg-brand-butter/70 p-3 text-center text-[11px] font-semibold text-[#6C5200]">
                  Lencana baru:{" "}
                  {result.newBadges
                    .map((key) => getBadge(key)?.name ?? key)
                    .join(", ")}
                </div>
              ) : null}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button asChild size="lg" className="w-full">
                  <Link href={`/simulasi/${slug}/bongkar/${attemptId}`}>
                    Bongkar modus penipuan <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/hasil/${attemptId}`}>Lihat hasil ringkas</Link>
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setDismissedResult(false)}
                className="mt-2 w-full text-center text-[10.5px] font-semibold text-brand-ink/45 underline-offset-2 hover:underline"
              >
                Buka lagi ringkasan hasil
              </button>
            </div>
          ) : scene ? (
            <SceneView
              scene={scene}
              slug={slug}
              onChoose={choose}
              onAction={action}
              pending={pending}
            />
          ) : null}

          {tip ? (
            <div className="mt-4 rounded-3xl bg-[#EEF3FD] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FCF3C8] text-[#8A6200]">
                  <Info className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-extrabold">{tip.title}</h3>
                    {tip.tag ? <Badge variant="danger">{tip.tag}</Badge> : null}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-brand-ink/65">
                    {tip.body}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-3xl border border-white bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  channelMeta.bg,
                  channelMeta.fg,
                )}
              >
                <ChannelIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">
                  Kanal simulasi
                </p>
                <p className="text-sm font-extrabold">{channelMeta.label}</p>
              </div>
            </div>
            <h2 className="mt-4 text-base font-extrabold">Misi edukasi</h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-ink/65">
              {config.intro.mission}
            </p>
            {config.intro.tip ? (
              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-brand-butter/70 p-3 text-[11px] leading-relaxed text-[#6C5200]">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {config.intro.tip}
              </div>
            ) : null}
            <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-brand-cream p-2.5">
                <dt className="flex items-center gap-1 text-brand-ink/45">
                  <Clock3 className="h-3 w-3" /> Estimasi
                </dt>
                <dd className="mt-0.5 font-bold">{estimatedMinutes} menit</dd>
              </div>
              <div className="rounded-xl bg-brand-cream p-2.5">
                <dt className="flex items-center gap-1 text-brand-ink/45">
                  <TriangleAlert className="h-3 w-3" /> Level
                </dt>
                <dd className="mt-0.5 font-bold">Level {level}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl bg-brand-ink p-5 text-white">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-emerald-300" />
              <h2 className="text-sm font-extrabold text-white">Zona aman</h2>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-white/60">
              Seluruh pesan, nomor, situs, dan data di sini sintetis. Tidak ada pesan
              sungguhan yang dikirim dan tidak ada kredensial asli yang diminta.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[10px] text-white/70">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Privacy by design · UU PDP No. 27/2022
            </div>
          </div>

          <div className="rounded-3xl border border-white bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <BookOpenCheck className="h-4 w-4 text-primary" /> Alur latihan
            </h2>
            <ol className="mt-3 space-y-2.5 text-[11.5px] text-brand-ink/60">
              {[
                "Amati pesan, tautan, dan permintaan datanya.",
                "Pilih tindakan yang paling aman.",
                "Bongkar pola manipulasi di Mode Bongkar.",
              ].map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-mint text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <Dialog
        open={showResultDialog}
        onOpenChange={(open) => {
          if (!open) setDismissedResult(true);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto">
          <DialogHeader>
            <div
              className={cn(
                "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
                result?.outcome === "SAFE"
                  ? "bg-brand-mint text-primary"
                  : "bg-brand-blush text-[#B91C2D]",
              )}
            >
              {result?.outcome === "SAFE" ? (
                <ShieldCheck className="h-8 w-8" />
              ) : (
                <TriangleAlert className="h-8 w-8" />
              )}
            </div>
            <DialogTitle className="text-center text-2xl">
              {result?.outcome === "SAFE" ? "Aman!" : "Kamu hampir terjebak"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {result?.feedback}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-brand-cream p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-ink/40">
                Skor
              </p>
              <p className="text-xl font-extrabold">{result?.score ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-brand-cream p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-ink/40">
                XP diperoleh
              </p>
              <p className="text-xl font-extrabold">+{result?.xpEarned ?? 0}</p>
            </div>
          </div>

          {result?.newBadges?.length ? (
            <div className="rounded-2xl bg-brand-butter/70 p-3 text-center text-[11px] font-semibold text-[#6C5200]">
              Lencana baru:{" "}
              {result.newBadges
                .map((key) => getBadge(key)?.name ?? key)
                .join(", ")}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Button asChild size="lg" className="w-full">
              <Link href={`/simulasi/${slug}/bongkar/${attemptId}`}>
                Bongkar modus penipuan <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/hasil/${attemptId}`}>Lihat hasil ringkas</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-brand-ink/55"
              onClick={() => setDismissedResult(true)}
            >
              Tutup ringkasan
            </Button>
          </div>
          <p className="text-center text-[10px] text-brand-ink/40">
            Mode Bongkar wajib dipelajari agar pola jebakan ini melekat.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
