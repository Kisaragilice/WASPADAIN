"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { KabQuestion } from "@/lib/kab";
import { SCALE_OPTIONS } from "@/lib/kab";
import { getBadge } from "@/lib/gamification";
import { cn } from "@/lib/utils";

type Answer = boolean | number;

const DIMENSIONS = [
  {
    key: "knowledge" as const,
    label: "Pengetahuan",
    icon: Brain,
    description: "Pemahaman tentang taktik penipuan dan kanal resmi.",
  },
  {
    key: "attitude" as const,
    label: "Sikap",
    icon: HeartHandshake,
    description: "Kecenderungan menilai dan merespons risiko.",
  },
  {
    key: "behavior" as const,
    label: "Perilaku",
    icon: Activity,
    description: "Kebiasaan nyata dalam menjaga data dan melapor.",
  },
];

export function KabTest({
  type,
  questions,
  previous,
  nextHref,
  locked,
}: {
  type: "PRE" | "POST";
  questions: KabQuestion[];
  previous: {
    kabIndex: number;
    knowledge: number;
    attitude: number;
    behavior: number;
    createdAt: string;
  } | null;
  nextHref: string;
  locked?: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    kabIndex: number;
    knowledge: number;
    attitude: number;
    behavior: number;
    xpEarned: number;
    newBadges: string[];
  } | null>(null);

  const answered = Object.keys(answers).length;
  const total = questions.length;
  const complete = answered === total;

  const grouped = useMemo(
    () =>
      DIMENSIONS.map((dimension) => ({
        ...dimension,
        questions: questions.filter((question) => question.dimension === dimension.key),
      })),
    [questions],
  );

  const submit = async () => {
    if (!complete) {
      toast.error("Jawab seluruh pertanyaan terlebih dahulu.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, answers }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Gagal menyimpan jawaban.");
        return;
      }
      setResult({ ...data.result, xpEarned: data.xpEarned, newBadges: data.newBadges });
      if (data.xpEarned > 0) toast.success(`+${data.xpEarned} XP`);
      if (data.newBadges?.length) {
        toast.success(
          `Lencana baru: ${data.newBadges
            .map((key: string) => getBadge(key)?.name ?? key)
            .join(", ")}`,
        );
      }
      router.refresh();
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  if (locked) {
    return (
      <div className="rounded-3xl border border-white bg-white p-6 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-butter text-[#8A6200]">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-lg font-extrabold">Post-test masih terkunci</h2>
        <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-brand-ink/65">
          {locked}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/simulasi">Pilih simulasi</Link>
          </Button>
          <Button asChild>
            <Link href="/kab">Kembali ke instrumen</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (result) {
    const delta = previous ? result.kabIndex - previous.kabIndex : null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="rounded-4xl bg-brand-mint p-5 text-center sm:p-7">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
            {type === "PRE" ? "Pre-test" : "Post-test"} selesai
          </p>
          <h2 className="mt-1 text-3xl font-extrabold">{result.kabIndex}</h2>
          <p className="text-[11px] font-semibold text-brand-ink/55">Indeks KAB dari 100</p>
          {delta !== null ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold text-brand-ink/65">
              {delta >= 0 ? "+" : ""}
              {delta} poin dibanding {type === "PRE" ? "pre-test" : "pre-test sebelumnya"}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {DIMENSIONS.map((dimension) => {
            const value = result[dimension.key];
            const Icon = dimension.icon;
            return (
              <div key={dimension.key} className="rounded-2xl bg-white p-3.5 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-mint text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] font-bold">{dimension.label}</p>
                  <span className="ml-auto text-sm font-extrabold">{value}</span>
                </div>
                <Progress value={value} className="mt-2 h-1.5" />
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white bg-white p-4 text-[11.5px] leading-relaxed text-brand-ink/65 shadow-card">
          {type === "PRE"
            ? "Pre-test menjadi garis dasar. Setelah berlatih dan membongkar modus, isi post-test untuk mengukur perubahan."
            : "Post-test menjadi bahan evaluasi. Bandingkan skor dengan pre-test dan radar untuk menentukan latihan berikutnya."}
          {result.xpEarned > 0 ? (
            <span className="ml-1 inline-flex items-center gap-1 font-bold text-primary">
              <Sparkles className="h-3 w-3" /> +{result.xpEarned} XP
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg" className="flex-1">
            <Link href={nextHref}>
              {type === "PRE" ? "Lanjut ke simulasi" : "Buka radar modus"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/kab">Lihat instrumen</Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3.5 shadow-card">
        <div className="flex items-center justify-between text-[10px] font-semibold text-brand-ink/55">
          <span>
            {answered} dari {total} pertanyaan terjawab
          </span>
          <span>{Math.round((answered / total) * 100)}%</span>
        </div>
        <Progress value={(answered / total) * 100} className="mt-1.5 h-2" />
      </div>

      {grouped.map((dimension) => {
        const Icon = dimension.icon;
        return (
          <section
            key={dimension.key}
            className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5"
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-lavender text-[#4C56A3]">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[15px] font-extrabold">{dimension.label}</h2>
                <p className="text-[10.5px] text-brand-ink/55">{dimension.description}</p>
              </div>
              <Badge variant="secondary" className="ml-auto shrink-0">
                {dimension.questions.length} butir
              </Badge>
            </div>

            <div className="mt-3 space-y-3">
              {dimension.questions.map((question, index) => {
                const value = answers[question.id];
                return (
                  <div key={question.id} className="rounded-2xl bg-brand-cream/60 p-3">
                    <p className="text-[12px] font-semibold leading-relaxed text-brand-ink/80">
                      <span className="mr-1.5 text-[10px] font-black text-brand-ink/30">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {question.text}
                    </p>
                    {question.type === "boolean" ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[
                          { answer: true, label: "Benar" },
                          { answer: false, label: "Salah" },
                        ].map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() =>
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: option.answer,
                              }))
                            }
                            className={cn(
                              "min-h-[40px] rounded-xl border px-3 py-2 text-[11px] font-bold transition",
                              value === option.answer
                                ? "border-primary bg-brand-mint text-[#0B5E54]"
                                : "border-brand-ink/10 bg-white text-brand-ink/65 hover:border-primary/30",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 grid grid-cols-5 gap-1">
                        {SCALE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            title={option.label}
                            aria-label={option.label}
                            onClick={() =>
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: option.value,
                              }))
                            }
                            className={cn(
                              "flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-1 text-[9px] font-bold transition",
                              value === option.value
                                ? "border-primary bg-brand-mint text-[#0B5E54]"
                                : "border-brand-ink/10 bg-white text-brand-ink/55 hover:border-primary/30",
                            )}
                          >
                            <span className="text-sm">{option.value}</span>
                            <span className="hidden text-[7px] sm:block">
                              {option.label.replace("Sangat ", "S. ").replace(" tidak", " tdk")}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="rounded-3xl bg-brand-ink p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" /> {type === "PRE" ? "Garis dasar" : "Pengukuran akhir"}
            </p>
            <p className="mt-1 text-[11px] text-white/65">
              {answered < total
                ? `Masih ada ${total - answered} pertanyaan yang belum dijawab.`
                : "Semua pertanyaan sudah dijawab. Simpan untuk melihat hasilmu."}
            </p>
          </div>
          <Button
            type="button"
            variant="soft"
            size="lg"
            onClick={submit}
            disabled={pending}
            className="min-w-[150px]"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                Simpan jawaban <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {previous ? (
        <div className="flex items-start gap-2 rounded-2xl bg-white/70 p-3 text-[10.5px] text-brand-ink/60">
          {type === "PRE" ? (
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B58A00]" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          <p>
            Kamu sudah pernah mengisi {type === "PRE" ? "pre-test" : "post-test"} dengan
            indeks {previous.kabIndex}. Jawaban baru akan dicatat sebagai riwayat terbaru
            tanpa XP tambahan.
          </p>
        </div>
      ) : null}
    </div>
  );
}
