import Link from "next/link";
import { Suspense } from "react";
import { Compass, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { CatalogFilters } from "@/components/brand/catalog-filters";
import { ScenarioCard } from "@/components/brand/scenario-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Channel, Difficulty, Prisma } from "@prisma/client";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    kanal?: string;
    kategori?: string;
    sulit?: string;
    q?: string;
  }>;
}) {
  const user = await requireUser();
  const query = await searchParams;

  const channel = ["WHATSAPP", "SMS", "EMAIL", "BROWSER"].includes(
    query.kanal ?? "",
  )
    ? (query.kanal as Channel)
    : undefined;
  const difficulty = ["MUDAH", "SEDANG", "SULIT"].includes(query.sulit ?? "")
    ? (query.sulit as Difficulty)
    : undefined;
  const category = query.kategori?.trim() || undefined;
  const term = query.q?.trim() || undefined;

  const where: Prisma.ScenarioWhereInput = {
    isPublished: true,
    ...(channel ? { channel } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(category ? { category } : {}),
    ...(term
      ? {
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { subtitle: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { category: { contains: term, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [scenarios, attempts, totalPublished] = await Promise.all([
    prisma.scenario.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    }),
    prisma.simulationAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      select: { scenarioId: true, outcome: true },
    }),
    prisma.scenario.count({ where: { isPublished: true } }),
  ]);

  const stats = new Map<string, { completed: number; safe: number }>();
  for (const attempt of attempts) {
    const current = stats.get(attempt.scenarioId) ?? { completed: 0, safe: 0 };
    current.completed += 1;
    if (attempt.outcome === "SAFE") current.safe += 1;
    stats.set(attempt.scenarioId, current);
  }

  const totalVariants = scenarios.reduce(
    (sum, scenario) => sum + scenario.variantCount,
    0,
  );

  return (
    <div className="page-shell">
      <PageHeader
        backHref="/simulasi"
        eyebrow="Katalog skenario"
        title="Modus yang dekat dengan keseharianmu"
        description="Kesetiaan konteks: skenario dibuat menyerupai pesan yang bisa masuk ke ponselmu besok pagi. Semua data sintetis dan aman."
        action={
          <Badge variant="safe">
            <ShieldCheck className="h-3 w-3" /> {totalPublished} skenario
          </Badge>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="lavender">
          <Layers className="h-3 w-3" /> {totalVariants} variasi pada hasil ini
        </Badge>
        <Badge variant="secondary">
          <Compass className="h-3 w-3" /> WhatsApp · SMS · Email · Browser
        </Badge>
        <Badge variant="warning">
          <Sparkles className="h-3 w-3" /> Mode Bongkar di setiap skenario
        </Badge>
      </div>

      <div className="mt-4">
        <Suspense
          fallback={<div className="h-32 animate-pulse rounded-3xl border border-white bg-white/70 shadow-card" />}
        >
          <CatalogFilters />
        </Suspense>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-brand-ink/55">
          Menampilkan {scenarios.length} skenario
        </p>
        <Link
          href="/modul"
          className="text-[11px] font-bold text-primary hover:underline"
        >
          Belajar pola dulu →
        </Link>
      </div>

      {scenarios.length === 0 ? (
        <div className="mt-3 rounded-3xl border border-dashed border-brand-ink/15 bg-white/60 p-8 text-center">
          <p className="text-sm font-bold">Tidak ada skenario yang cocok.</p>
          <p className="mt-1 text-[11px] text-brand-ink/60">
            Coba hapus filter atau gunakan kata kunci lain.
          </p>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/simulasi/katalog">Reset filter</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {scenarios.map((scenario) => {
            const progress = stats.get(scenario.id);
            return (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                completed={progress?.completed ?? 0}
                safe={progress?.safe ?? 0}
              />
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-brand-ink p-5 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
          Prinsip sandbox
        </p>
        <h2 className="mt-1 text-lg font-extrabold text-white">
          Latihan tanpa risiko, literasi tanpa menghakimi.
        </h2>
        <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed text-white/70">
          Kami tidak mengirim pesan nyata, tidak menjalankan malware, dan tidak
          mengumpulkan kredensial asli. Semua nomor, situs, dan dokumen adalah data
          sintetis untuk pembelajaran.
        </p>
      </div>
    </div>
  );
}
