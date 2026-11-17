import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Flag,
  Radar,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { resolveConfig } from "@/lib/attempt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CHANNEL_META, RADAR_ICONS } from "@/components/brand/icons";
import { RADAR_CATEGORIES } from "@/lib/scenario/types";
import { formatDate } from "@/lib/utils";
import { BadgePill } from "@/components/brand/badge-grid";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await requireUser();
  const { attemptId } = await params;

  const attempt = await prisma.simulationAttempt.findUnique({
    where: { id: attemptId },
    include: {
      scenario: true,
      responses: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!attempt || attempt.userId !== user.id) notFound();
  if (attempt.status !== "COMPLETED") {
    redirect(`/simulasi/${attempt.scenario.slug}`);
  }

  const { config } = resolveConfig(attempt.scenario, attempt.variantIndex);
  const [allScenarios, completed, badges, assessments] = await Promise.all([
    prisma.scenario.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, title: true, channel: true },
    }),
    prisma.simulationAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      select: { scenarioId: true },
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id, scenarioId: attempt.scenarioId },
      select: { badgeKey: true },
    }),
    prisma.assessment.findMany({
      where: { userId: user.id },
      select: { type: true },
    }),
  ]);

  const completedIds = new Set(completed.map((item) => item.scenarioId));
  const next =
    allScenarios.find((scenario) => scenario.id !== attempt.scenarioId && !completedIds.has(scenario.id)) ??
    allScenarios.find((scenario) => scenario.slug !== attempt.scenario.slug) ??
    allScenarios[0];

  const safe = attempt.outcome === "SAFE";
  const categories = (attempt.vulnerableCategories as string[] | null) ?? [];
  const hasPostTest = assessments.some((item) => item.type === "POST");
  const channel = CHANNEL_META[attempt.scenario.channel];
  const ChannelIcon = channel.icon;

  return (
    <div className="page-shell max-w-4xl">
      <div
        className={`overflow-hidden rounded-4xl p-5 shadow-card sm:p-7 ${
          safe ? "bg-brand-mint" : "bg-brand-blush"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                safe ? "bg-white text-primary" : "bg-white text-[#B91C2D]"
              }`}
            >
              {safe ? <ShieldCheck className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-ink/40">
                Hasil simulasi
              </p>
              <h1 className="mt-0.5 text-3xl font-extrabold leading-tight sm:text-4xl">
                {safe ? "Aman!" : "Rentan terjebak"}
              </h1>
              <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-brand-ink/60">
                {safe
                  ? "Kamu berhasil menolak jebakan. Pola ini sudah masuk radar kesiapsiagaanmu."
                  : "Tidak apa-apa. Mode Bongkar membedah mengapa jebakan ini bekerja, agar kamu tidak jatuh pada modus serupa."}
              </p>
            </div>
          </div>
          <Badge variant={safe ? "safe" : "danger"} className="bg-white/70">
            {attempt.outcome}
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/65 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wide text-brand-ink/40">Skor</p>
            <p className="text-2xl font-extrabold">{attempt.score}</p>
          </div>
          <div className="rounded-2xl bg-white/65 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wide text-brand-ink/40">XP</p>
            <p className="text-2xl font-extrabold">+{attempt.xpEarned}</p>
          </div>
          <div className="rounded-2xl bg-white/65 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wide text-brand-ink/40">Red flag</p>
            <p className="text-2xl font-extrabold">
              {attempt.redFlagsIdentified}/{attempt.redFlagsTotal}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold ${channel.fg}`}
          >
            <ChannelIcon className="h-3.5 w-3.5" /> {channel.label}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-semibold text-brand-ink/55">
            {attempt.scenario.title}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-semibold text-brand-ink/45">
            {attempt.completedAt ? formatDate(attempt.completedAt, true) : ""}
          </span>
          {badges.map((badge) => (
            <BadgePill key={badge.badgeKey} badgeKey={badge.badgeKey} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-white bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <Target className="h-4 w-4 text-primary" /> Keputusanmu
          </h2>
          <div className="mt-3 space-y-2">
            {attempt.responses.length === 0 ? (
              <p className="rounded-xl bg-brand-cream p-3 text-[11.5px] text-brand-ink/50">
                Tidak ada respons tercatat.
              </p>
            ) : (
              attempt.responses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-start gap-2.5 rounded-2xl bg-[#F7F4EA] p-3"
                >
                  {response.verdict === "SAFE" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C2D]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold leading-snug text-brand-ink/75">
                      {response.label}
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-brand-ink/35">
                      {response.verdict === "SAFE" ? "Tindakan aman" : "Tindakan berisiko"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-brand-ink/45">
            <span>Ketepatan keputusan</span>
            <span className="font-bold text-brand-ink/65">{attempt.score}%</span>
          </div>
          <Progress value={attempt.score} className="mt-1 h-2" />
        </section>

        <section className="rounded-3xl border border-white bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <Radar className="h-4 w-4 text-primary" /> Dampak ke radar
          </h2>
          <p className="mt-1.5 text-[11px] leading-relaxed text-brand-ink/50">
            {safe
              ? "Tidak ada parameter kerentanan yang bertambah pada latihan ini."
              : "Parameter berikut ditandai sebagai titik lemah dari keputusanmu."}
          </p>
          <div className="mt-3 space-y-2">
            {RADAR_CATEGORIES.map((category) => {
              const exposed = categories.includes(category.key);
              const Icon = RADAR_ICONS[category.key];
              return (
                <div
                  key={category.key}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
                    exposed ? "bg-brand-blush/60" : "bg-brand-cream/70"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      exposed ? "bg-white text-[#B91C2D]" : "bg-white text-primary"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-bold">{category.label}</p>
                    <p className="text-[8.5px] text-brand-ink/40">{category.description}</p>
                  </div>
                  {exposed ? (
                    <span className="shrink-0 rounded-full bg-[#E11D48] px-2 py-0.5 text-[8px] font-bold text-white">
                      terpapar
                    </span>
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-3xl bg-brand-ink p-5 text-white sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-white">
          <Sparkles className="h-4 w-4 text-amber-300" /> Tiga hal yang perlu diingat
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {config.takeaways.map((item, index) => (
            <li
              key={item}
              className="rounded-2xl bg-white/[0.07] p-3 text-[11px] leading-relaxed text-white/70"
            >
              <span className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-amber-300">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="soft">
            <Link href="/radar">
              <Radar className="h-4 w-4" /> Buka radar modus
            </Link>
          </Button>
          {!hasPostTest ? (
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link href="/kab/post-test">
                <Award className="h-4 w-4" /> Isi post-test KAB
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white">
            <Link href={`/simulasi/${attempt.scenario.slug}?restart=1`}>
              <RotateCcw className="h-4 w-4" /> Ulangi
            </Link>
          </Button>
        </div>
      </section>

      {next ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white bg-white p-4 shadow-card">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-brand-ink/35">
              Latihan berikutnya
            </p>
            <p className="text-sm font-extrabold">{next.title}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/simulasi">
                <Flag className="h-4 w-4" /> Dasbor
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/simulasi/${next.slug}`}>
                Mulai <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
