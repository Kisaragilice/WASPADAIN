import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HeartHandshake,
  History,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/brand/stat-tile";
import { KAB_QUESTIONS } from "@/lib/kab";
import { formatDate } from "@/lib/utils";

const DIMENSIONS = [
  {
    key: "knowledge" as const,
    label: "Pengetahuan",
    icon: Brain,
    tone: "bg-brand-lavender text-[#4C56A3]",
    description: "Pemahaman taktik penipuan, domain resmi, dan kanal verifikasi.",
  },
  {
    key: "attitude" as const,
    label: "Sikap",
    icon: HeartHandshake,
    tone: "bg-brand-mint text-[#0B5E54]",
    description: "Kecenderungan menilai risiko sebelum bereaksi.",
  },
  {
    key: "behavior" as const,
    label: "Perilaku",
    icon: Activity,
    tone: "bg-brand-butter text-[#8A6200]",
    description: "Kebiasaan memeriksa, menolak, dan melapor di kehidupan nyata.",
  },
];

const ASSESSMENT_LABEL = { PRE: "Pre-test", POST: "Post-test" } as const;

export default async function KabPage() {
  const user = await requireUser();

  const [assessments, completedAttempts] = await Promise.all([
    prisma.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.simulationAttempt.count({
      where: { userId: user.id, status: "COMPLETED" },
    }),
  ]);

  const preTest = assessments.find((item) => item.type === "PRE") ?? null;
  const postTest = assessments.find((item) => item.type === "POST") ?? null;
  const latest = postTest ?? preTest;
  const postLocked = !preTest
    ? "Isi pre-test terlebih dahulu untuk membuka pengukuran akhir."
    : completedAttempts === 0
      ? "Selesaikan minimal satu simulasi dan Mode Bongkar sebelum post-test."
      : null;

  return (
    <div className="page-shell max-w-5xl">
      <PageHeader
        backHref="/simulasi"
        eyebrow="Instrumen KAB"
        title="Ukur pengetahuan, sikap, dan perilaku"
        description="Dua belas butir singkat yang diadaptasi dari kerangka HAIS-Q. Hasilnya menjadi garis dasar dan bahan evaluasi belajar, bukan nilai kelulusan."
        action={
          <Badge variant={latest ? "safe" : "warning"}>
            <ClipboardList className="h-3 w-3" /> {assessments.length} pengisian
          </Badge>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-4xl bg-brand-ink p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> Indeks kesiapsiagaan
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-5xl font-extrabold leading-none">
                    {latest?.kabIndex ?? "—"}
                  </p>
                  <p className="pb-1 text-[11px] font-semibold text-white/45">/ 100</p>
                </div>
                <p className="mt-2 max-w-md text-[11.5px] leading-relaxed text-white/55">
                  {latest
                    ? `Terakhir diukur pada ${formatDate(latest.createdAt, true)} melalui ${ASSESSMENT_LABEL[latest.type].toLowerCase()}.`
                    : "Belum ada pengukuran. Mulai dari pre-test untuk mendapatkan garis dasar."}
                </p>
              </div>
              <Button asChild variant="soft" size="lg">
                <Link href={preTest ? "/kab/post-test" : "/kab/pre-test"}>
                  {preTest ? "Isi post-test" : "Mulai pre-test"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {DIMENSIONS.map((dimension) => {
                const Icon = dimension.icon;
                const value = latest?.[dimension.key];
                return (
                  <div key={dimension.key} className="rounded-2xl bg-white/[0.07] p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-[10.5px] font-bold text-white/75">{dimension.label}</p>
                      <span className="ml-auto text-[13px] font-extrabold">
                        {value ?? "—"}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#65D4C2]"
                        style={{ width: `${value ?? 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile
              label="Pre-test"
              value={preTest?.kabIndex ?? "—"}
              suffix={preTest ? "/100" : undefined}
              hint={preTest ? formatDate(preTest.createdAt) : "Belum diisi"}
              tone="lavender"
            />
            <StatTile
              label="Post-test"
              value={postTest?.kabIndex ?? "—"}
              suffix={postTest ? "/100" : undefined}
              hint={postTest ? formatDate(postTest.createdAt) : "Belum diisi"}
              tone="mint"
            />
            <StatTile
              label="Perubahan"
              value={
                preTest && postTest
                  ? `${postTest.kabIndex - preTest.kabIndex > 0 ? "+" : ""}${postTest.kabIndex - preTest.kabIndex}`
                  : "—"
              }
              suffix={preTest && postTest ? "poin" : undefined}
              hint="post-test vs pre-test"
              tone="butter"
            />
            <StatTile
              label="Simulasi"
              value={completedAttempts}
              suffix="selesai"
              hint="syarat post-test"
              tone="white"
            />
          </div>

          <section className="rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <History className="h-4 w-4 text-primary" /> Riwayat pengukuran
            </h2>
            {assessments.length === 0 ? (
              <div className="mt-3 rounded-2xl bg-brand-cream p-4 text-[11.5px] leading-relaxed text-brand-ink/50">
                Belum ada riwayat. Pre-test pertamamu akan muncul di sini.
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] border-separate border-spacing-y-1.5 text-left">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-wide text-brand-ink/35">
                      <th className="px-2 font-bold">Tanggal</th>
                      <th className="px-2 font-bold">Jenis</th>
                      <th className="px-2 text-right font-bold">Pengetahuan</th>
                      <th className="px-2 text-right font-bold">Sikap</th>
                      <th className="px-2 text-right font-bold">Perilaku</th>
                      <th className="px-2 text-right font-bold">Indeks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((assessment) => (
                      <tr
                        key={assessment.id}
                        className="bg-brand-cream/60 text-[11px] text-brand-ink/65"
                      >
                        <td className="rounded-l-xl px-2 py-2.5 font-medium">
                          {formatDate(assessment.createdAt, true)}
                        </td>
                        <td className="px-2 py-2.5">
                          <Badge variant={assessment.type === "POST" ? "safe" : "lavender"}>
                            {ASSESSMENT_LABEL[assessment.type]}
                          </Badge>
                        </td>
                        <td className="px-2 text-right font-semibold">{assessment.knowledge}</td>
                        <td className="px-2 text-right font-semibold">{assessment.attitude}</td>
                        <td className="px-2 text-right font-semibold">{assessment.behavior}</td>
                        <td className="rounded-r-xl px-2 text-right text-[13px] font-extrabold text-brand-ink">
                          {assessment.kabIndex}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <div className="rounded-3xl border border-white bg-white p-4 shadow-card">
            <h2 className="text-sm font-extrabold">Dua tahap pengukuran</h2>
            <div className="mt-3 space-y-2.5">
              <div className="rounded-2xl bg-brand-cream/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11.5px] font-extrabold">Pre-test</p>
                  {preTest ? (
                    <Badge variant="safe">
                      <CheckCircle2 className="h-3 w-3" /> Selesai
                    </Badge>
                  ) : (
                    <Badge variant="warning">Garis dasar</Badge>
                  )}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-brand-ink/50">
                  Diisi sebelum latihan agar perubahan bisa dibandingkan.
                </p>
                <Button asChild variant={preTest ? "outline" : "dark"} size="sm" className="mt-2.5 w-full">
                  <Link href="/kab/pre-test">
                    {preTest ? "Isi ulang pre-test" : "Mulai pre-test"}
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl bg-brand-cream/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11.5px] font-extrabold">Post-test</p>
                  {postTest ? (
                    <Badge variant="safe">
                      <CheckCircle2 className="h-3 w-3" /> Selesai
                    </Badge>
                  ) : postLocked ? (
                    <Badge variant="warning">
                      <Lock className="h-3 w-3" /> Terkunci
                    </Badge>
                  ) : (
                    <Badge variant="lavender">Terbuka</Badge>
                  )}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-brand-ink/50">
                  Diisi setelah minimal satu simulasi untuk mengukur perubahan.
                </p>
                <Button
                  asChild
                  variant={postTest ? "outline" : "default"}
                  size="sm"
                  className="mt-2.5 w-full"
                >
                  <Link href="/kab/post-test">
                    {postTest ? "Isi ulang post-test" : "Buka post-test"}
                  </Link>
                </Button>
                {postLocked && !postTest ? (
                  <p className="mt-2 text-[9px] leading-relaxed text-[#8A6200]">{postLocked}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-brand-butter/80 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6C5200]">
              <Clock3 className="h-3.5 w-3.5" /> Sekitar tiga menit
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#6C5200]/75">
              {KAB_QUESTIONS.length} butir: 4 pengetahuan benar/salah, 4 sikap, dan 4
              perilaku dengan skala 1–5. Tidak ada batas waktu, tidak ada jawaban yang
              mempermalukan.
            </p>
          </div>

          <div className="rounded-3xl border border-white bg-white p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-[11px] font-extrabold">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Cara membaca hasil
            </p>
            <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-brand-ink/50">
              <li>• 0–39: fondasi perlu diperkuat.</li>
              <li>• 40–69: mulai waspada, masih ada celah.</li>
              <li>• 70–89: siap menghadapi modus umum.</li>
              <li>• 90–100: konsisten dan reflektif.</li>
            </ul>
            <p className="mt-2 text-[9px] text-brand-ink/35">
              Ambang ini hanya panduan edukatif WASPADAIN, bukan skala klinis.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-4 rounded-3xl bg-white/60 p-4 text-[10.5px] leading-relaxed text-brand-ink/45">
        <span className="font-bold text-brand-ink/65">Privasi:</span> jawaban KAB disimpan
        untuk menampilkan progres akunmu dan tidak dibagikan ke pihak ketiga. Data
        simulasi seluruhnya sintetis.
      </div>
    </div>
  );
}
