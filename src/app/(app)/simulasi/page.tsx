import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  ChevronRight,
  Clock3,
  FileWarning,
  Flame,
  GraduationCap,
  Landmark,
  Link2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getRank } from "@/lib/gamification";
import { QUICK_REFLEX_QUESTIONS } from "@/lib/scenario";
import { CHANNEL_META } from "@/components/brand/icons";
import { StatTile } from "@/components/brand/stat-tile";
import { QuickReflex } from "@/components/brand/quick-reflex";
import { BadgeGrid } from "@/components/brand/badge-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const CORE_SLUGS = ["etle-apk", "sms-poin-bank", "pajak-coretax"];

const PATTERNS = [
  {
    title: "Format Jebakan",
    subtitle: "File Berbahaya (.APK)",
    icon: FileWarning,
    tone: "bg-[#FCF3C8]",
    iconTone: "bg-white/70 text-[#9A6B00]",
    href: "/simulasi/katalog?kategori=Format+Jebakan",
  },
  {
    title: "Umpan Link",
    subtitle: "Pancingan Web Palsu",
    icon: Link2,
    tone: "bg-[#E8EAFB]",
    iconTone: "bg-white/70 text-[#4C56A3]",
    href: "/simulasi/katalog?kategori=Umpan+Link",
  },
  {
    title: "Tekanan Emosi",
    subtitle: "Buru-buru / Panik",
    icon: BellRing,
    tone: "bg-[#FCE3E5]",
    iconTone: "bg-white/70 text-[#C2334A]",
    href: "/modul/tekanan-psikologis",
  },
  {
    title: "Identitas Palsu",
    subtitle: "Catut Instansi",
    icon: Landmark,
    tone: "bg-[#DDF4EE]",
    iconTone: "bg-white/70 text-[#0B7A62]",
    href: "/modul/data-rahasia",
  },
];

export default async function DashboardPage() {
  const user = await requireUser();

  const [
    scenarios,
    completedAttempts,
    assessments,
    badges,
    moduleProgress,
    moduleCount,
    correctReflex,
    weekAttempts,
  ] = await Promise.all([
    prisma.scenario.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.simulationAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      include: {
        scenario: { select: { slug: true, channel: true, title: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      orderBy: { awardedAt: "desc" },
    }),
    prisma.moduleProgress.findMany({ where: { userId: user.id } }),
    prisma.educationModule.count({ where: { isPublished: true } }),
    prisma.reflexAttempt.findMany({
      where: { userId: user.id, isCorrect: true },
      select: { questionId: true },
    }),
    prisma.simulationAttempt.findMany({
      where: {
        startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { scenarioId: true },
    }),
  ]);

  const rank = getRank(user.xp);
  const preTest = assessments.find((item) => item.type === "PRE");
  const postTest = assessments.find((item) => item.type === "POST");
  const kabIndex = postTest?.kabIndex ?? preTest?.kabIndex ?? null;

  const completedSlugs = new Set(completedAttempts.map((item) => item.scenario.slug));
  const coreDone = CORE_SLUGS.filter((slug) => completedSlugs.has(slug)).length;
  const safeCount = completedAttempts.filter((item) => item.outcome === "SAFE").length;

  const attemptsByScenario = new Map<string, { completed: number; safe: number }>();
  for (const attempt of completedAttempts) {
    const current = attemptsByScenario.get(attempt.scenarioId) ?? {
      completed: 0,
      safe: 0,
    };
    current.completed += 1;
    if (attempt.outcome === "SAFE") current.safe += 1;
    attemptsByScenario.set(attempt.scenarioId, current);
  }

  const trendCounts = new Map<string, number>();
  for (const attempt of weekAttempts) {
    trendCounts.set(
      attempt.scenarioId,
      (trendCounts.get(attempt.scenarioId) ?? 0) + 1,
    );
  }
  const trending =
    [...scenarios].sort(
      (a, b) =>
        (trendCounts.get(b.id) ?? 0) - (trendCounts.get(a.id) ?? 0) ||
        a.sortOrder - b.sortOrder,
    )[0] ?? null;

  const reflexAnswered = new Set(correctReflex.map((item) => item.questionId));
  const reflexQuestion =
    QUICK_REFLEX_QUESTIONS.find((item) => !reflexAnswered.has(item.id)) ??
    QUICK_REFLEX_QUESTIONS[0];
  const publicReflex = {
    id: reflexQuestion.id,
    channel: reflexQuestion.channel,
    prompt: reflexQuestion.prompt,
    quote: reflexQuestion.quote,
    options: reflexQuestion.options.map((option) => ({
      id: option.id,
      label: option.label,
    })),
  };

  const channelCards = (["WHATSAPP", "SMS", "EMAIL"] as const).map((channel) => {
    const meta = CHANNEL_META[channel];
    const channelScenarios = scenarios.filter((item) => item.channel === channel);
    const variants = channelScenarios.reduce(
      (sum, item) => sum + item.variantCount,
      0,
    );
    const channelAttempts = completedAttempts.filter(
      (item) => item.scenario.channel === channel,
    );
    const subtitle = {
      WHATSAPP: "Tilang ETLE, resi paket & QRIS",
      SMS: "Poin bank hangus & tautan palsu",
      EMAIL: "Pemadanan NPWP & panen identitas",
    }[channel];
    return {
      channel,
      meta,
      variants,
      count: channelScenarios.length,
      safe: channelAttempts.filter((item) => item.outcome === "SAFE").length,
      completed: channelAttempts.length,
      subtitle,
      badge:
        channel === "WHATSAPP" ? "Populer" : channel === "SMS" ? "Urgensi Tinggi" : "Pencurian Data",
    };
  });

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-lavender text-[#4C56A3]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold leading-tight">Simulasi</p>
            <p className="text-[11px] font-semibold text-primary">Latihan Anti-Modus</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">Level {rank.level}</Badge>
          <Badge variant="secondary">{rank.current.name}</Badge>
        </div>
      </div>

      {!preTest ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl bg-brand-ink p-4 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <GraduationCap className="h-5 w-5 text-emerald-300" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">Mulai dari pre-test KAB</p>
            <p className="text-[11px] text-white/60">
              Isi 12 butir instrumen singkat agar radar dan progresmu terukur.
            </p>
          </div>
          <Button asChild size="sm" variant="soft">
            <Link href="/kab/pre-test">Isi pre-test</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section className="rounded-4xl bg-white/55 p-4 sm:p-6">
            <h1 className="max-w-xl text-[30px] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-[38px]">
              Jangan tunggu kena tipu baru belajar.
            </h1>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-brand-ink/60">
              Kenali pola jebakan penipu lewat simulasi interaktif yang aman.
              Ceritanya ganti-ganti,{" "}
              <span className="rounded bg-[#FCD5D9] px-1 font-semibold text-[#B91C2D]">
                polanya itu-itu aja
              </span>
              .
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {PATTERNS.map((pattern) => {
                const Icon = pattern.icon;
                return (
                  <Link
                    key={pattern.title}
                    href={pattern.href}
                    className={`group rounded-2xl p-3 transition hover:-translate-y-0.5 ${pattern.tone}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pattern.iconTone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-brand-ink/45">
                          {pattern.title}
                        </p>
                        <p className="mt-0.5 text-[11.5px] font-extrabold leading-snug text-brand-ink sm:text-[12.5px]">
                          {pattern.subtitle}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile
              label="Indeks KAB"
              value={kabIndex ?? "—"}
              suffix={kabIndex !== null ? "/100" : undefined}
              hint={postTest ? "Post-test terbaru" : preTest ? "Dari pre-test" : "Belum diukur"}
              tone="mint"
            />
            <StatTile
              label="Total XP"
              value={user.xp}
              suffix="XP"
              hint={`${rank.xpForNext > 0 ? `${rank.xpForNext} XP ke jenjang berikutnya` : "Pangkat tertinggi"}`}
              tone="butter"
            />
            <StatTile
              label="Simulasi"
              value={completedAttempts.length}
              suffix="selesai"
              hint={`${safeCount} hasil aman`}
              tone="lavender"
            />
            <StatTile
              label="Lencana"
              value={badges.length}
              suffix={`/ 9`}
              hint={moduleProgress.length > 0 ? `${moduleProgress.length}/${moduleCount} modul` : "Mulai koleksi"}
              tone="white"
            />
          </div>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-[13px] font-extrabold">
                  <span className="text-primary">{coreDone} dari 3</span> situasi selesai
                </p>
              </div>
              <span className="text-[10px] font-medium text-brand-ink/40">
                nggak harus buru-buru
              </span>
            </div>
            <Progress
              value={(coreDone / 3) * 100}
              className="mt-2.5 h-2.5"
              indicatorClassName="bg-primary"
            />
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9.5px] text-brand-ink/40">
              {scenarios
                .filter((scenario) => CORE_SLUGS.includes(scenario.slug))
                .map((scenario) => (
                  <span
                    key={scenario.id}
                    className={completedSlugs.has(scenario.slug) ? "font-bold text-primary" : ""}
                  >
                    {completedSlugs.has(scenario.slug) ? "✓ " : "○ "}
                    {CHANNEL_META[scenario.channel].label}
                  </span>
                ))}
            </div>
          </section>

          {trending ? (
            <Link
              href={`/simulasi/${trending.slug}`}
              className="group flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#FCE3E5] via-[#FBF3D6] to-[#FCF3C8] p-3.5 shadow-card transition hover:-translate-y-0.5 sm:p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#D2153B]">
                <Flame className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#B91C2D]">
                  Trending minggu ini
                </p>
                <p className="mt-0.5 truncate text-[15px] font-extrabold sm:text-base">
                  {trending.title}
                </p>
                <p className="truncate text-[10.5px] text-brand-ink/50">
                  {trending.subtitle}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-brand-ink/35 transition group-hover:translate-x-0.5" />
            </Link>
          ) : null}

          <section>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h2 className="text-[19px] font-extrabold">Latihan di aplikasi harianmu</h2>
              <Link
                href="/simulasi/katalog"
                className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary hover:underline"
              >
                Lihat semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-2.5">
              {channelCards.map((card) => {
                const Icon = card.meta.icon;
                return (
                  <Link
                    key={card.channel}
                    href={`/simulasi/katalog?kanal=${card.channel}`}
                    className="group flex items-center gap-3 rounded-3xl border border-white bg-white p-3.5 shadow-card transition hover:-translate-y-0.5"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.meta.bg} ${card.meta.fg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[15px] font-extrabold">{card.meta.label}</p>
                        <Badge variant={card.channel === "SMS" ? "danger" : "warning"}>
                          {card.badge}
                        </Badge>
                      </div>
                      <p className="truncate text-[10px] text-brand-ink/50">{card.subtitle}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-primary">
                        {card.variants} variasi · {card.count} skenario
                        {card.completed > 0 ? ` · ${card.safe}/${card.completed} aman` : ""}
                      </p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-ink/[0.04] text-brand-ink/40 transition group-hover:bg-brand-mint group-hover:text-primary">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <QuickReflex
            question={publicReflex}
            alreadyCorrect={reflexAnswered.has(reflexQuestion.id)}
          />

          <div className="rounded-3xl bg-[#EEF3FD] p-4 text-center">
            <p className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-primary">
              <ShieldCheck className="h-4 w-4" /> 100% Simulasi Aman
              <span className="h-1 w-1 rounded-full bg-brand-ink/20" /> Bebas Malware
            </p>
            <p className="mt-1 text-[10px] text-brand-ink/45">
              Tanpa meminta password, OTP, atau data pribadi apa pun.
            </p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-brand-ink/30">
              Inspirasi edukasi komunitas cegah penipuan digital
            </p>
          </div>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <div className="overflow-hidden rounded-3xl bg-brand-ink p-5 text-white shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                Kesiapsiagaan
              </p>
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-5xl font-extrabold leading-none tracking-tight">
                {kabIndex ?? "—"}
              </p>
              <div className="pb-1">
                <p className="text-[11px] font-semibold text-white/60">Indeks KAB</p>
                <p className="text-[9px] text-white/35">
                  {postTest ? "Post-test" : preTest ? "Pre-test" : "Belum diukur"}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: "Pengetahuan", value: postTest?.knowledge ?? preTest?.knowledge },
                { label: "Sikap", value: postTest?.attitude ?? preTest?.attitude },
                { label: "Perilaku", value: postTest?.behavior ?? preTest?.behavior },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[9.5px] text-white/50">
                    <span>{item.label}</span>
                    <span>{item.value ?? 0}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#65D4C2]"
                      style={{ width: `${item.value ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="soft" size="sm" className="mt-4 w-full">
              <Link href="/kab">
                {postTest ? "Lihat hasil KAB" : "Buka instrumen KAB"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-white bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#B58A00]" />
              <h2 className="text-sm font-extrabold">Pangkat bela negara digital</h2>
            </div>
            <p className="mt-2 text-lg font-extrabold text-primary">{rank.current.name}</p>
            <p className="text-[11px] leading-relaxed text-brand-ink/50">
              {rank.current.description}
            </p>
            <div className="mt-3 flex items-center justify-between text-[9.5px] text-brand-ink/45">
              <span>{user.xp} XP</span>
              <span>{rank.next ? `${rank.xpForNext} XP lagi` : "Puncak"}</span>
            </div>
            <Progress value={rank.progress} className="mt-1.5 h-2" />
            {rank.next ? (
              <p className="mt-2 text-[9.5px] text-brand-ink/40">
                Berikutnya: {rank.next.name}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Lencana terbaru</h2>
              <Link href="/profil" className="text-[10px] font-bold text-primary">
                Semua
              </Link>
            </div>
            <BadgeGrid earned={badges.map((badge) => badge.badgeKey)} />
          </div>

          <div className="rounded-3xl bg-brand-butter/80 p-4">
            <p className="flex items-center gap-2 text-[11px] font-extrabold text-[#6C5200]">
              <Clock3 className="h-3.5 w-3.5" /> Empat jam yang mengubah kebiasaan
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#6C5200]/70">
              Tuntaskan simulasi, bongkar polanya, lalu isi post-test. Setiap latihan
              memperkuat perisai manusia.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
