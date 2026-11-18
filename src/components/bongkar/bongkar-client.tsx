"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  Lightbulb,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BongkarPreview } from "./bongkar-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BrowserScene, EmailScene, ScenarioConfig, SmsScene, WhatsAppScene } from "@/lib/scenario/types";
import { getScene } from "@/lib/scenario/types";
import { cn } from "@/lib/utils";

export function BongkarClient({
  slug,
  title,
  attemptId,
  outcome,
  config,
}: {
  slug: string;
  title: string;
  attemptId: string;
  outcome: "SAFE" | "VULNERABLE";
  config: ScenarioConfig;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [marking, setMarking] = useState(false);
  const markedRef = useRef(false);
  const step = config.bongkar.steps[stepIndex];
  const scene = step ? getScene(config, step.sceneId) : undefined;
  const flags = useMemo(
    () => (step ? step.flagIds.map((id) => config.redFlags.find((flag) => flag.id === id)).filter(Boolean) : []),
    [config, step],
  );
  const total = config.bongkar.steps.length;
  const isLast = stepIndex === total - 1;

  const markBongkar = useCallback(async () => {
    if (markedRef.current) return true;
    markedRef.current = true;
    setMarking(true);
    try {
      const response = await fetch(`/api/attempts/${attemptId}/bongkar`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("mark failed");
      return true;
    } catch {
      markedRef.current = false;
      return false;
    } finally {
      setMarking(false);
    }
  }, [attemptId]);

  // Reviewing the final step counts as completing Mode Bongkar, which unlocks
  // the post-test. The endpoint is idempotent.
  useEffect(() => {
    if (isLast) void markBongkar();
  }, [isLast, markBongkar]);

  const finish = async () => {
    await markBongkar();
    router.push(`/hasil/${attemptId}`);
  };

  const previewScene = scene as
    | WhatsAppScene
    | SmsScene
    | EmailScene
    | BrowserScene
    | undefined;

  const repeat = async () => {
    setPending(true);
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioSlug: slug, restart: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Gagal memulai ulang simulasi.");
        return;
      }
      router.push(`/simulasi/${slug}`);
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  const share = async () => {
    const text = `${config.shareText}\n\nLatihan di WASPADAIN — ${typeof window !== "undefined" ? window.location.origin : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `WASPADAIN — ${title}`,
          text,
          url: typeof window !== "undefined" ? window.location.origin : undefined,
        });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Teks edukasi disalin. Bagikan ke keluarga Anda.");
    } catch {
      // Pengguna membatalkan dialog berbagi.
    }
  };

  if (!step || !previewScene) {
    return (
      <div className="page-shell max-w-3xl">
        <div className="rounded-3xl bg-white p-6 text-sm text-muted-foreground">
          Materi bongkar tidak tersedia.{" "}
          <Link href={`/hasil/${attemptId}`} className="font-semibold text-primary underline">
            Lihat hasil simulasi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-5xl">
      <div className="rounded-3xl bg-brand-mint p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/hasil/${attemptId}`}
            aria-label="Kembali ke hasil"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-white/80"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Bongkar — Layar tadi kita tandai
            </p>
            <h1 className="mt-0.5 text-lg font-extrabold leading-tight sm:text-xl">
              {step.title}
            </h1>
            <p className="mt-0.5 text-[10.5px] text-brand-ink/60">
              Ketuk alur di bawah untuk memahami trik manipulasi penipu.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden rounded-full bg-brand-ink px-3 py-1.5 text-[10px] font-bold text-white sm:inline-flex">
              BONGKAR
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold">
              {stepIndex + 1} / {total}
            </span>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {config.bongkar.steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStepIndex(index)}
              aria-label={`Buka langkah ${index + 1}`}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index <= stepIndex ? "bg-primary" : "bg-white/60",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-24">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Badge variant={outcome === "SAFE" ? "safe" : "danger"}>
              {outcome === "SAFE" ? "Vonis: Aman" : "Vonis: Rentan"}
            </Badge>
            <span className="text-[9px] font-medium text-brand-ink/55">
              Layar tadi kita tandai
            </span>
          </div>
          <BongkarPreview
            scene={previewScene}
            highlights={step.highlights}
            flagLabels={flags.map((flag) => flag?.label ?? "RED FLAG")}
          />

          <div className="mt-3 rounded-2xl bg-brand-butter/70 p-3 text-[10.5px] leading-relaxed text-[#6C5200]">
            <p className="flex items-center gap-1.5 font-bold">
              <Lightbulb className="h-3.5 w-3.5" /> Ciri aman yang bisa kamu pegang
            </p>
            <p className="mt-1 text-[#6C5200]/75">
              Berhenti sejenak, periksa pengirim dan domain, dan jangan pernah menyerahkan
              PIN, OTP, atau dokumen identitas.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
            className="min-w-0 rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5"
          >
            <div className="space-y-4">
              {flags.map((flag) =>
                flag ? (
                  <div key={flag.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-blush px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[#B91C2D]">
                        <Flag className="h-3 w-3" /> {flag.label}
                      </span>
                      <span className="text-[9px] font-semibold text-brand-ink/50">
                        Langkah {stepIndex + 1} dari {total}
                      </span>
                    </div>
                    <h2 className="mt-2.5 text-[20px] font-extrabold leading-tight sm:text-[22px]">
                      {flag.title}
                    </h2>
                    <div className="mt-2 space-y-2 text-[12.5px] leading-relaxed text-brand-ink/65">
                      {flag.body.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-brand-butter/80 p-3.5">
                      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#7C5A00]">
                        <Lightbulb className="h-3.5 w-3.5" /> Fakta resmi
                      </p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-[#6C5200]">
                        {flag.fact}
                      </p>
                    </div>

                    {flag.compare ? (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-start gap-2.5 rounded-2xl bg-brand-mint/70 p-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div>
                            <p className="text-[10.5px] font-bold text-[#0B5E54]">
                              {flag.compare.goodTitle}
                            </p>
                            <p className="mt-0.5 text-[10.5px] leading-relaxed text-brand-ink/65">
                              {flag.compare.good}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 rounded-2xl bg-brand-blush/70 p-3">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C2D]" />
                          <div>
                            <p className="text-[10.5px] font-bold text-[#B91C2D]">
                              {flag.compare.badTitle}
                            </p>
                            <p className="mt-0.5 text-[10.5px] leading-relaxed text-brand-ink/65">
                              {flag.compare.bad}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null,
              )}
            </div>

            {isLast ? (
              <div className="mt-4 rounded-2xl bg-[#F7F4EA] p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-brand-ink/60">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Inti yang perlu diingat
                </p>
                <ul className="mt-2 space-y-1.5">
                  {config.takeaways.map((item) => (
                    <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-brand-ink/65">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="sm:w-auto"
                  onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                >
                  <ArrowLeft className="h-4 w-4" /> Sebelumnya
                </Button>
              ) : null}
              {!isLast ? (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => setStepIndex((index) => Math.min(total - 1, index + 1))}
                >
                  {stepIndex === 0 ? "Lanjut ke Red Flag 2" : "Lanjut"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={finish}
                  disabled={marking || pending}
                >
                  {marking ? "Menyimpan..." : "Selesai & lihat intinya"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isLast ? (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={repeat}
                  disabled={pending}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Ulangi simulasi
                </Button>
                <Button type="button" variant="soft" size="sm" onClick={share}>
                  <Share2 className="h-3.5 w-3.5" /> Bagikan edukasi
                </Button>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-center gap-2">
                {config.bongkar.steps.map((item, index) => (
                  <span
                    key={item.id}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === stepIndex ? "w-6 bg-primary" : "w-1.5 bg-brand-ink/15",
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-4 text-center text-[9.5px] text-brand-ink/50">
        Umpan balik non-punitif · kesalahan adalah bahan belajar, bukan alasan mempermalukan.
      </p>
    </div>
  );
}
