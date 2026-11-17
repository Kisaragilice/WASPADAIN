import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  LockKeyhole,
  PhoneOff,
  Radar,
  ShieldCheck,
  Target,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/brand/stat-tile";
import { RadarChart, type RadarDatum } from "@/components/brand/radar-chart";
import { RADAR_CATEGORIES, RADAR_CATEGORIES as CATEGORIES } from "@/lib/scenario/types";
import { RADAR_ICONS } from "@/components/brand/icons";
import { percentage } from "@/lib/utils";

const MODULE_BY_CATEGORY: Record<string, string> = {
  tekanan_waktu: "tekanan-psikologis",
  umpan_hadiah: "tekanan-psikologis",
  otoritas_palsu: "domain-tautan",
  format_tautan: "domain-tautan",
  data_rahasia: "data-rahasia",
};

export default async function RadarPage() {
  const user = await requireUser();

  const [attempts, assessments] = await Promise.all([
    prisma.simulationAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      include: {
        scenario: { select: { title: true, slug: true, config: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const preTest = assessments.find((item) => item.type === "PRE");
  const postTest = assessments.find((item) => item.type === "POST");

  const scenarioCategories = new Map<string, Set<string>>();
  for (const attempt of attempts) {
    if (scenarioCategories.has(attempt.scenarioId)) continue;
    const config = attempt.scenario.config as {
      redFlags?: { category?: string }[];
    };
    scenarioCategories.set(
      attempt.scenarioId,
      new Set(
        (config.redFlags ?? [])
          .map((flag) => flag.category)
          .filter((category): category is string => Boolean(category)),
      ),
    );
  }

  const data: RadarDatum[] = CATEGORIES.map((category) => {
    let exposures = 0;
    let vulnerable = 0;
    for (const attempt of attempts) {
      const categories = scenarioCategories.get(attempt.scenarioId);
      if (!categories?.has(category.key)) continue;
      exposures += 1;
      const exposed = (attempt.vulnerableCategories as string[] | null) ?? [];
      if (exposed.includes(category.key)) vulnerable += 1;
    }
    return {
      key: category.key,
      value: exposures > 0 ? Math.max(0, 100 - Math.round((vulnerable / exposures) * 100)) : 50,
      measured: exposures > 0,
      exposures,
      vulnerable,
    };
  });

  const vulnerableAttempts = attempts.filter(
    (attempt) => attempt.outcome === "VULNERABLE",
  );
  const trapCounts = new Map<string, { title: string; slug: string; count: number }>();
  for (const attempt of vulnerableAttempts) {
    const current = trapCounts.get(attempt.scenarioId) ?? {
      title: attempt.scenario.title,
      slug: attempt.scenario.slug,
      count: 0,
    };
    current.count += 1;
    trapCounts.set(attempt.scenarioId, current);
  }
  const topTraps = [...trapCounts.values()].sort((a, b) => b.count - a.count).slice(0, 3);
  const weakest = [...data].sort((a, b) => a.value - b.value).filter((item) => item.measured);
  const safeRate = percentage(
    attempts.filter((item) => item.outcome === "SAFE").length,
    attempts.length,
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Radar modus"
        title="Di mana jebakan paling sering menjebakmu?"
        description="Grafik jaring laba-laba lima parameter kerentanan kognitif. Semakin tinggi nilainya, semakin siap kamu merespons modus pada parameter tersebut."
        action={
          <Badge variant="lavender">
            <Radar className="h-3 w-3" /> {attempts.length} simulasi terukur
          </Badge>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="Simulasi selesai" value={attempts.length} tone="white" />
        <StatTile label="Hasil aman" value={`${safeRate}%`} hint="dari seluruh simulasi" tone="mint" />
        <StatTile label="Simulasi rentan" value={vulnerableAttempts.length} tone="blush" />
        <StatTile
          label="Kesiapan rata-rata"
          value={`${Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length)}%`}
          hint={attempts.length ? "lima parameter" : "netral, belum ada data"}
          tone="butter"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Target className="h-4 w-4 text-primary" /> Peta ketahanan kognitif
            </h2>
            <span className="text-[9px] text-brand-ink/35">0–100</span>
          </div>
          <RadarChart data={data} />
          <div className="mt-1 space-y-1.5">
            {data.map((item) => {
              const category = RADAR_CATEGORIES.find((entry) => entry.key === item.key);
              const Icon = RADAR_ICONS[item.key];
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 rounded-xl bg-brand-cream/70 px-2.5 py-2"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-bold">{category?.label}</p>
                    <p className="truncate text-[8.5px] text-brand-ink/40">
                      {item.measured
                        ? `${item.vulnerable} dari ${item.exposures} latihan terpapar`
                        : "Belum ada latihan pada parameter ini"}
                    </p>
                  </div>
                  <span className="text-[11px] font-extrabold">{item.value}%</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 rounded-xl bg-[#EEF3FD] px-3 py-2 text-[9px] leading-relaxed text-brand-ink/45">
            Nilai 50 berarti netral karena parameter belum terukur. Lakukan simulasi
            terkait untuk mendapat gambaran yang lebih tepat.
          </p>
        </section>

        <div className="space-y-4">
          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <AlertTriangle className="h-4 w-4 text-[#B91C2D]" /> Modus yang paling sering menjebak
            </h2>
            {topTraps.length === 0 ? (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-mint/70 p-3.5 text-[11.5px] text-[#0B5E54]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {attempts.length === 0
                  ? "Belum ada simulasi selesai. Mulai latihan agar radar terisi."
                  : "Belum ada jebakan yang berhasil menjebakmu. Pertahankan!"}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {topTraps.map((trap) => (
                  <Link
                    key={trap.slug}
                    href={`/simulasi/${trap.slug}`}
                    className="flex items-center gap-2.5 rounded-2xl bg-brand-blush/50 p-3 transition hover:bg-brand-blush"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#B91C2D]">
                      {trap.count}×
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[11px] font-bold">{trap.title}</p>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-ink/30" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <GraduationCap className="h-4 w-4 text-primary" /> Latihan yang disarankan
            </h2>
            <p className="mt-1 text-[10.5px] text-brand-ink/45">
              Berdasarkan parameter dengan kesiapan terendah.
            </p>
            <div className="mt-3 space-y-2">
              {(weakest.length ? weakest.slice(0, 2) : data.slice(0, 2)).map((item) => {
                const category = RADAR_CATEGORIES.find((entry) => entry.key === item.key);
                const slug = MODULE_BY_CATEGORY[item.key];
                return (
                  <Link
                    key={item.key}
                    href={`/modul/${slug}`}
                    className="flex items-center gap-2.5 rounded-2xl bg-brand-cream/80 p-3 transition hover:bg-brand-cream"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                      <GraduationCap className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold">{category?.label}</p>
                      <p className="text-[9px] text-brand-ink/40">
                        {category?.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-primary">Modul</span>
                  </Link>
                );
              })}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href="/simulasi/katalog">
                Pilih simulasi baru <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </section>
        </div>
      </div>

      <section className="mt-4 rounded-3xl bg-brand-ink p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
              <PhoneOff className="h-3.5 w-3.5" /> SOP darurat pasca-insiden
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-white">
              Kecepatan melapor menentukan hasil.
            </h2>
            <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed text-white/55">
              Makin cepat laporan masuk, makin besar peluang dana diselamatkan. Ikuti
              tiga langkah berikut tanpa menunggu.
            </p>
          </div>
          <Button asChild variant="soft">
            <a href="https://iasc.ojk.go.id" target="_blank" rel="noopener noreferrer">
              Lapor ke IASC OJK <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
        <div className="mt-4 grid gap-2.5 md:grid-cols-3">
          {[
            {
              icon: LockKeyhole,
              title: "1. Isolasi",
              body: "Aktifkan mode pesawat, putus koneksi, hapus aplikasi mencurigakan, dan ganti kata sandi dari perangkat bersih.",
            },
            {
              icon: Ban,
              title: "2. Blokir layanan",
              body: "Hubungi bank atau dompet digital lewat nomor resmi untuk memblokir kartu, rekening, dan akses m-banking.",
            },
            {
              icon: ShieldCheck,
              title: "3. Lapor",
              body: "Laporkan ke IASC OJK di iasc.ojk.go.id, simpan bukti chat dan mutasi, lalu buat laporan polisi bila perlu.",
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl bg-white/[0.07] p-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2 text-[12px] font-extrabold text-white">{step.title}</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-white/55">{step.body}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[9px] text-white/35">
          <ShieldCheck className="h-3 w-3 text-emerald-300" />
          Ini panduan edukasi, bukan pengganti bantuan resmi. Segera hubungi bank dan
          pihak berwenang.
        </p>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
          <h2 className="text-sm font-extrabold">Perubahan KAB</h2>
          {preTest && postTest ? (
            <div className="mt-3 space-y-2.5">
              {[
                { label: "Indeks KAB", pre: preTest.kabIndex, post: postTest.kabIndex },
                { label: "Pengetahuan", pre: preTest.knowledge, post: postTest.knowledge },
                { label: "Sikap", pre: preTest.attitude, post: postTest.attitude },
                { label: "Perilaku", pre: preTest.behavior, post: postTest.behavior },
              ].map((item) => {
                const delta = item.post - item.pre;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-brand-ink/60">{item.label}</span>
                      <span
                        className={`font-bold ${
                          delta > 0 ? "text-primary" : delta < 0 ? "text-[#B91C2D]" : "text-brand-ink/40"
                        }`}
                      >
                        {item.pre} → {item.post} ({delta > 0 ? "+" : ""}
                        {delta})
                      </span>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-ink/[0.06]">
                        <div className="h-full rounded-full bg-brand-ink/25" style={{ width: `${item.pre}%` }} />
                      </div>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-mint">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.post}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-[9px] text-brand-ink/35">
                Kiri: pre-test · Kanan: post-test. Perubahan menjadi bahan evaluasi
                latihan berikutnya.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-[11.5px] leading-relaxed text-brand-ink/50">
                {preTest
                  ? "Post-test belum diisi. Setelah minimal satu simulasi, ukur kembali pengetahuan, sikap, dan perilakumu."
                  : "Isi pre-test KAB agar perubahan pengetahuan, sikap, dan perilaku bisa diukur."}
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href={preTest ? "/kab/post-test" : "/kab/pre-test"}>
                  {preTest ? "Isi post-test" : "Isi pre-test"} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-brand-butter/80 p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6C5200]">
            <ShieldCheck className="h-3.5 w-3.5" /> Pelapor cepat, bukan korban sendirian
          </p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#6C5200]/75">
            Umpan balik di WASPADAIN bersifat non-punitif. Kesalahan adalah bahan
            belajar. Ceritakan pengalamanmu kepada keluarga agar mereka juga waspada.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[9.5px] font-bold">
            <span className="rounded-full bg-white/70 px-2.5 py-1">OJK 157</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">Kring Pajak 1500200</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">iasc.ojk.go.id</span>
          </div>
        </div>
      </section>
    </div>
  );
}
