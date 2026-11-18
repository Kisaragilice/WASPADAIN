import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  GraduationCap,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/layout/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatTile } from "@/components/brand/stat-tile";
import {
  AdminScenarioManager,
  type AdminScenario,
} from "@/components/admin/admin-scenario-manager";
import { CHANNEL_META } from "@/components/brand/icons";
import { formatDate, percentage, timeAgo } from "@/lib/utils";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ percobaan?: string }>;
}) {
  const user = await requireAdmin();
  const query = await searchParams;
  const requestedPage = Number.parseInt(query.percobaan ?? "1", 10);
  const attemptPage = Number.isFinite(requestedPage)
    ? Math.max(1, requestedPage)
    : 1;
  const attemptsPerPage = 8;

  const [
    scenarios,
    users,
    attempts,
    assessments,
    moduleCount,
    recentAttempts,
    recentUsers,
    safeAttempts,
    vulnerableAttempts,
  ] = await Promise.all([
    prisma.scenario.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { attempts: true } } },
    }),
    prisma.user.count(),
    prisma.simulationAttempt.count(),
    prisma.assessment.count(),
    prisma.educationModule.count(),
    prisma.simulationAttempt.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      skip: (attemptPage - 1) * attemptsPerPage,
      take: attemptsPerPage,
      include: {
        user: { select: { name: true } },
        scenario: { select: { title: true, slug: true, channel: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true, xp: true, createdAt: true },
    }),
    prisma.simulationAttempt.count({ where: { status: "COMPLETED", outcome: "SAFE" } }),
    prisma.simulationAttempt.count({
      where: { status: "COMPLETED", outcome: "VULNERABLE" },
    }),
  ]);

  const completed = safeAttempts + vulnerableAttempts;
  const attemptTotalPages = Math.max(
    1,
    Math.ceil(completed / attemptsPerPage),
  );
  const published = scenarios.filter((scenario) => scenario.isPublished).length;
  const totalAttemptsPerScenario = scenarios.reduce(
    (sum, scenario) => sum + scenario._count.attempts,
    0,
  );
  const topScenarios = [...scenarios]
    .sort((a, b) => b._count.attempts - a._count.attempts)
    .slice(0, 5);

  const managerScenarios: AdminScenario[] = scenarios.map((scenario) => ({
    id: scenario.id,
    slug: scenario.slug,
    title: scenario.title,
    subtitle: scenario.subtitle,
    description: scenario.description,
    channel: scenario.channel,
    difficulty: scenario.difficulty,
    level: scenario.level,
    estimatedMinutes: scenario.estimatedMinutes,
    variantCount: scenario.variantCount,
    isPublished: scenario.isPublished,
    attemptCount: scenario._count.attempts,
  }));

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Panel admin"
        title="Kelola katalog dan pantau latihan"
        description="Publikasi skenario, sesuaikan metadata latihan, dan lihat aktivitas terbaru. Konfigurasi percakapan tetap dikelola lewat seed agar perubahan dapat ditinjau."
        action={
          <Badge variant="dark">
            <ShieldAlert className="h-3 w-3" /> {user.name}
          </Badge>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Pengguna" value={users} suffix="akun" hint="terdaftar" tone="lavender" />
        <StatTile label="Skenario" value={published} suffix={`/ ${scenarios.length}`} hint="dipublikasikan" tone="mint" />
        <StatTile label="Percobaan" value={attempts} suffix="total" hint={`${completed} selesai`} tone="butter" />
        <StatTile label="Asesmen KAB" value={assessments} suffix="pengisian" hint="pre & post" tone="white" />
        <StatTile label="Modul" value={moduleCount} suffix="aktif" hint="materi edukasi" tone="blush" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-extrabold">
                  <Layers className="h-4 w-4 text-primary" /> Manajemen skenario
                </h2>
                <p className="mt-0.5 text-[10.5px] text-brand-ink/55">
                  Ubah metadata, level, estimasi waktu, dan status publikasi.
                </p>
              </div>
              <Badge variant="secondary">{scenarios.length} skenario</Badge>
            </div>
            <div className="mt-3">
              <AdminScenarioManager initialScenarios={managerScenarios} />
            </div>
          </section>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <ClipboardList className="h-4 w-4 text-primary" /> Simulasi terbaru
            </h2>
            {recentAttempts.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-brand-cream/70 p-4 text-[11.5px] text-brand-ink/55">
                Belum ada simulasi selesai.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] border-separate border-spacing-y-1.5 text-left">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-wide text-brand-ink/50">
                      <th className="px-2 font-bold">Pengguna</th>
                      <th className="px-2 font-bold">Skenario</th>
                      <th className="px-2 font-bold">Hasil</th>
                      <th className="px-2 text-right font-bold">Skor</th>
                      <th className="px-2 text-right font-bold">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttempts.map((attempt) => {
                      const channel = CHANNEL_META[attempt.scenario.channel];
                      return (
                        <tr key={attempt.id} className="bg-brand-cream/60 text-[10.5px] text-brand-ink/65">
                          <td className="rounded-l-xl px-2 py-2.5 font-semibold text-brand-ink/80">
                            {attempt.user.name}
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="inline-flex items-center gap-1">
                              <span className={`flex h-4 w-4 items-center justify-center rounded-full ${channel.fg}`}>
                                <channel.icon className="h-2.5 w-2.5" />
                              </span>
                              <span className="max-w-[180px] truncate">{attempt.scenario.title}</span>
                            </span>
                          </td>
                          <td className="px-2 py-2.5">
                            <Badge variant={attempt.outcome === "SAFE" ? "safe" : "danger"}>
                              {attempt.outcome === "SAFE" ? "Aman" : "Rentan"}
                            </Badge>
                          </td>
                          <td className="px-2 text-right font-bold">{attempt.score}</td>
                          <td className="rounded-r-xl px-2 text-right text-[9px] text-brand-ink/55">
                            {attempt.completedAt ? timeAgo(attempt.completedAt) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={Math.min(attemptPage, attemptTotalPages)}
              totalPages={attemptTotalPages}
              basePath="/admin"
              paramName="percobaan"
            />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl bg-brand-ink p-4 text-white sm:p-5">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-300">
              <BarChart3 className="h-3.5 w-3.5" /> Kesehatan latihan
            </p>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-4xl font-extrabold leading-none">
                {percentage(safeAttempts, completed)}%
              </p>
              <p className="pb-1 text-[10px] text-white/60">hasil aman</p>
            </div>
            <Progress
              value={percentage(safeAttempts, completed)}
              className="mt-3 h-2 bg-white/10"
              indicatorClassName="bg-[#65D4C2]"
            />
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-white/[0.07] p-2.5">
                <p className="text-lg font-extrabold">{safeAttempts}</p>
                <p className="text-[9px] text-white/60">Aman</p>
              </div>
              <div className="rounded-xl bg-white/[0.07] p-2.5">
                <p className="text-lg font-extrabold">{vulnerableAttempts}</p>
                <p className="text-[9px] text-white/60">Rentan</p>
              </div>
            </div>
            <p className="mt-3 text-[9px] leading-relaxed text-white/55">
              Angka agregat diperbarui setiap simulasi selesai. Tidak ada data pribadi
              sensitif yang ditampilkan.
            </p>
          </section>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Sparkles className="h-4 w-4 text-[#B58A00]" /> Skenario terpopuler
            </h2>
            <div className="mt-3 space-y-2">
              {topScenarios.map((scenario) => {
                const share = percentage(scenario._count.attempts, totalAttemptsPerScenario);
                return (
                  <div key={scenario.id}>
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="truncate font-semibold text-brand-ink/65">{scenario.title}</span>
                      <span className="shrink-0 font-bold">{scenario._count.attempts}</span>
                    </div>
                    <Progress value={share} className="mt-1 h-1.5" />
                  </div>
                );
              })}
              {topScenarios.length === 0 ? (
                <p className="text-[10.5px] text-brand-ink/55">Belum ada data.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Users className="h-4 w-4 text-primary" /> Pengguna terbaru
            </h2>
            <div className="mt-3 space-y-1.5">
              {recentUsers.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-xl bg-brand-cream/60 px-2.5 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-extrabold text-primary">
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10.5px] font-bold">{item.name}</p>
                    <p className="truncate text-[8.5px] text-brand-ink/55">{item.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] font-bold">{item.xp} XP</p>
                    <p className="text-[8px] text-brand-ink/50">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-3xl bg-brand-butter/80 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6C5200]">
              <ShieldCheck className="h-3.5 w-3.5" /> Batas peran admin
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#6C5200]/75">
              Admin mengelola metadata dan publikasi. Admin tidak dapat melihat kata sandi,
              jawaban KAB individual, atau data pribadi di luar nama dan email akun.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/simulasi">
                <GraduationCap className="h-3.5 w-3.5" /> Dasbor
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/simulasi/katalog">
                Katalog <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
