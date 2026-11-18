import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  Radar,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRoundCog,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getRank, BADGES } from "@/lib/gamification";
import { CHANNEL_META } from "@/components/brand/icons";
import { BadgeGrid } from "@/components/brand/badge-grid";
import { StatTile } from "@/components/brand/stat-tile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/layout/pagination";
import { formatDate, initials, percentage, timeAgo } from "@/lib/utils";
import {
  LogoutButton,
  ProfileAccountForm,
  ProfilePasswordForm,
} from "@/components/auth/profile-forms";

const HISTORY_PAGE_SIZE = 10;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ riwayat?: string }>;
}) {
  const user = await requireUser();
  const rank = getRank(user.xp);
  const query = await searchParams;
  const requestedPage = Number.parseInt(query.riwayat ?? "1", 10);
  const historyPage = Number.isFinite(requestedPage)
    ? Math.max(1, requestedPage)
    : 1;

  const [
    attempts,
    totalCompleted,
    safeTotal,
    latestAttempt,
    assessments,
    badges,
    moduleProgress,
    moduleCount,
    correctReflex,
    totalReflex,
    usersAhead,
    totalUsers,
  ] = await Promise.all([
    prisma.simulationAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      include: {
        scenario: {
          select: { title: true, slug: true, channel: true, difficulty: true },
        },
      },
      orderBy: { completedAt: "desc" },
      skip: (historyPage - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
    }),
    prisma.simulationAttempt.count({
      where: { userId: user.id, status: "COMPLETED" },
    }),
    prisma.simulationAttempt.count({
      where: { userId: user.id, status: "COMPLETED", outcome: "SAFE" },
    }),
    prisma.simulationAttempt.findFirst({
      where: { userId: user.id, status: "COMPLETED" },
      include: { scenario: { select: { slug: true } } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.userBadge.findMany({
      where: { userId: user.id },
      orderBy: { awardedAt: "desc" },
    }),
    prisma.moduleProgress.findMany({ where: { userId: user.id } }),
    prisma.educationModule.count({ where: { isPublished: true } }),
    prisma.reflexAttempt.count({
      where: { userId: user.id, isCorrect: true },
    }),
    prisma.reflexAttempt.count({ where: { userId: user.id } }),
    prisma.user.count({ where: { xp: { gt: user.xp } } }),
    prisma.user.count(),
  ]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(totalCompleted / HISTORY_PAGE_SIZE),
  );

  const preTest = assessments.find((item) => item.type === "PRE") ?? null;
  const postTest = assessments.find((item) => item.type === "POST") ?? null;
  const kabDelta =
    preTest && postTest ? postTest.kabIndex - preTest.kabIndex : null;
  const safeCount = safeTotal;
  const earnedBadges = new Set(badges.map((badge) => badge.badgeKey));
  const position = usersAhead + 1;

  return (
    <div className="page-shell max-w-5xl">
      <PageHeader
        eyebrow="Profil & riwayat"
        title="Ruang belajar pribadimu"
        description="Pantau pangkat, lencana, hasil simulasi, dan perubahan KAB. Semua data terikat ke akunmu."
        action={
          <Badge variant={user.role === "ADMIN" ? "dark" : "lavender"}>
            {user.role === "ADMIN" ? "Admin" : "Warga Waspada"}
          </Badge>
        }
      />

      <section className="mt-4 overflow-hidden rounded-4xl bg-brand-ink p-5 text-white shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-white/20 shadow-sm">
            <AvatarFallback className="bg-brand-mint text-lg font-extrabold text-[#0B5E54]">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-white sm:text-2xl">{user.name}</h2>
              <Badge variant="warning">
                <Trophy className="h-3 w-3" /> {rank.current.name}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-[11.5px] text-white/65">{user.email}</p>
            <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-white/70">
              {rank.current.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-white/60">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" /> Bergabung {formatDate(user.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-300" /> {user.xp} XP total
              </span>
              <span className="inline-flex items-center gap-1">
                <Target className="h-3 w-3" /> Peringkat {position} dari {totalUsers}
              </span>
            </div>
          </div>
          <div className="w-full rounded-2xl bg-white/[0.07] p-3 sm:w-56">
            <div className="flex items-center justify-between text-[9.5px] text-white/65">
              <span>Level {rank.level}</span>
              <span>{rank.next ? `${rank.xpForNext} XP lagi` : "Puncak"}</span>
            </div>
            <Progress value={rank.progress} className="mt-1.5 h-2 bg-white/10" indicatorClassName="bg-[#65D4C2]" />
            <p className="mt-2 text-[9px] text-white/55">
              {rank.next ? `Berikutnya: ${rank.next.name}` : "Pangkat tertinggi tercapai."}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="Simulasi" value={totalCompleted} suffix="selesai" hint={`${safeCount} aman`} tone="mint" />
        <StatTile label="Indeks KAB" value={postTest?.kabIndex ?? preTest?.kabIndex ?? "—"} suffix={postTest || preTest ? "/100" : undefined} hint={postTest ? "Post-test" : preTest ? "Pre-test" : "Belum diukur"} tone="butter" />
        <StatTile label="Lencana" value={badges.length} suffix={`/ ${BADGES.length}`} hint="koleksi terbuka" tone="lavender" />
        <StatTile label="Modul" value={moduleProgress.length} suffix={`/ ${moduleCount}`} hint="edukasi tuntas" tone="white" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <section id="riwayat" className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
                <Activity className="h-4 w-4 text-primary" /> Riwayat simulasi
              </h2>
              <Link href="/simulasi/katalog" className="text-[10.5px] font-bold text-primary hover:underline">
                Tambah latihan →
              </Link>
            </div>
            {totalCompleted === 0 ? (
              <div className="mt-3 rounded-2xl bg-brand-cream/70 p-4 text-center">
                <p className="text-[12px] font-bold">Belum ada simulasi selesai.</p>
                <p className="mt-1 text-[10.5px] text-brand-ink/55">
                  Mulai dari satu skenario untuk mengisi radar dan riwayat.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/simulasi/katalog">
                    Pilih skenario <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-1.5">
                {attempts.map((attempt) => {
                  const channel = CHANNEL_META[attempt.scenario.channel];
                  const Icon = channel.icon;
                  const safe = attempt.outcome === "SAFE";
                  return (
                    <Link
                      key={attempt.id}
                      href={`/hasil/${attempt.id}`}
                      className="group flex items-center gap-2.5 rounded-2xl bg-brand-cream/60 p-2.5 transition hover:bg-brand-cream"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${channel.bg} ${channel.fg}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11.5px] font-bold group-hover:text-primary">
                          {attempt.scenario.title}
                        </p>
                        <p className="text-[9px] text-brand-ink/55">
                          {formatDate(attempt.completedAt ?? attempt.startedAt, true)} · skor {attempt.score} · +{attempt.xpEarned} XP
                        </p>
                      </div>
                      <Badge variant={safe ? "safe" : "danger"} className="shrink-0">
                        {safe ? "Aman" : "Rentan"}
                      </Badge>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-ink/25" />
                    </Link>
                  );
                })}
              </div>
            )}
            <Pagination
              page={Math.min(historyPage, historyTotalPages)}
              totalPages={historyTotalPages}
              basePath="/profil"
              paramName="riwayat"
            />
          </section>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
                <ClipboardList className="h-4 w-4 text-primary" /> Perubahan KAB
              </h2>
              <Link href="/kab" className="text-[10.5px] font-bold text-primary hover:underline">
                Instrumen KAB →
              </Link>
            </div>
            {preTest ? (
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                {[
                  { label: "Pengetahuan", pre: preTest.knowledge, post: postTest?.knowledge },
                  { label: "Sikap", pre: preTest.attitude, post: postTest?.attitude },
                  { label: "Perilaku", pre: preTest.behavior, post: postTest?.behavior },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-brand-cream/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-brand-ink/60">{item.label}</p>
                      <p className="text-[12px] font-extrabold">
                        {item.post ?? "—"}
                        {item.post !== undefined && item.post !== item.pre ? (
                          <span className={`ml-1 text-[9px] ${item.post >= item.pre ? "text-primary" : "text-[#B91C2D]"}`}>
                            ({item.post >= item.pre ? "+" : ""}
                            {item.post - item.pre})
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Progress value={item.post ?? item.pre} className="mt-1.5 h-1.5" />
                    <p className="mt-1 text-[8.5px] text-brand-ink/50">Pre-test: {item.pre}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-butter/60 p-3.5">
                <div>
                  <p className="text-[11.5px] font-bold text-[#6C5200]">Pre-test belum diisi.</p>
                  <p className="text-[10px] text-[#6C5200]/70">Mulai dari garis dasar agar perubahan bisa diukur.</p>
                </div>
                <Button asChild size="sm" variant="dark">
                  <Link href="/kab/pre-test">Isi pre-test</Link>
                </Button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9.5px] text-brand-ink/55">
              <span>Indeks terakhir: <strong className="text-brand-ink/65">{postTest?.kabIndex ?? preTest?.kabIndex ?? "—"}</strong></span>
              {kabDelta !== null ? (
                <span className={kabDelta >= 0 ? "text-primary" : "text-[#B91C2D]"}>
                  Perubahan {kabDelta >= 0 ? "+" : ""}
                  {kabDelta} poin dari pre-test
                </span>
              ) : null}
              <span>{assessments.length} pengisian tercatat</span>
            </div>
          </section>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
                <BadgeCheck className="h-4 w-4 text-[#B58A00]" /> Koleksi lencana
              </h2>
              <span className="text-[10px] font-semibold text-brand-ink/55">
                {badges.length} dari {BADGES.length} terbuka
              </span>
            </div>
            <div className="mt-3">
              <BadgeGrid earned={[...earnedBadges]} />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl bg-brand-mint p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Radar className="h-4 w-4 text-primary" /> Ringkasan kesiapan
            </h2>
            <ul className="mt-3 space-y-2 text-[11px]">
              <li className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2">
                <span className="text-brand-ink/65">Hasil aman</span>
                <strong>{percentage(safeTotal, totalCompleted)}%</strong>
              </li>
              <li className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2">
                <span className="text-brand-ink/65">Refleks benar</span>
                <strong>
                  {correctReflex}/{totalReflex || 0}
                </strong>
              </li>
              <li className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2">
                <span className="text-brand-ink/65">Modul tuntas</span>
                <strong>
                  {moduleProgress.length}/{moduleCount}
                </strong>
              </li>
              <li className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2">
                <span className="text-brand-ink/65">Lencana</span>
                <strong>{badges.length}</strong>
              </li>
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href="/radar">
                Buka radar modus <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </section>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <UserRoundCog className="h-4 w-4 text-primary" /> Pengaturan akun
            </h2>
            <div className="mt-3">
              <ProfileAccountForm initialName={user.name} email={user.email} />
            </div>
            <div className="my-4 h-px bg-brand-ink/[0.07]" />
            <ProfilePasswordForm />
            <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-brand-cream/70 px-3 py-2">
              <p className="text-[10px] text-brand-ink/55">Keluar dari perangkat ini</p>
              <LogoutButton />
            </div>
          </section>

          {user.role === "ADMIN" ? (
            <section className="rounded-3xl bg-brand-ink p-4 text-white">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5" /> Akses admin
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">
                Kelola publikasi skenario, level, dan estimasi waktu latihan.
              </p>
              <Button asChild variant="soft" size="sm" className="mt-3 w-full">
                <Link href="/admin">
                  Buka panel admin <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </section>
          ) : null}

          <section className="rounded-3xl bg-brand-butter/80 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6C5200]">
              <ShieldCheck className="h-3.5 w-3.5" /> Catatan data
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#6C5200]/75">
              Riwayat disimpan untuk menampilkan progres belajarmu. Tidak ada data
              kredensial asli yang diminta atau dikumpulkan.
            </p>
          </section>
        </aside>
      </div>

      {totalCompleted > 0 && latestAttempt ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white bg-white/70 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-lavender text-[#4C56A3]">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12px] font-extrabold">Terakhir berlatih {timeAgo(latestAttempt.completedAt ?? latestAttempt.startedAt)}</p>
              <p className="text-[10px] text-brand-ink/55">Ulangi skenario yang sama untuk menguji konsistensi.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/modul">
                <GraduationCap className="h-3.5 w-3.5" /> Modul
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/simulasi/${latestAttempt.scenario.slug}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Ulangi latihan terakhir
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white bg-white/70 p-4">
          <p className="flex items-center gap-2 text-[11.5px] font-semibold text-brand-ink/65">
            <BookOpenCheck className="h-4 w-4 text-primary" /> Belum ada riwayat. Baca modul
            singkat lalu coba satu skenario.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/modul">Buka modul</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/simulasi/katalog">Mulai simulasi</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
