import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Library,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function ModulesPage() {
  const user = await requireUser();

  const [modules, progress] = await Promise.all([
    prisma.educationModule.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
    }),
    prisma.moduleProgress.findMany({ where: { userId: user.id } }),
  ]);

  const completed = new Set(progress.map((item) => item.moduleId));
  const nextModule = modules.find((module) => !completed.has(module.id));

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Modul edukasi"
        title="Pahami polanya, bukan cuma hafal jawabannya"
        description="Lima modul singkat tentang format berkas, domain, tekanan psikologis, data rahasia, dan langkah mitigasi setelah insiden."
        action={
          <Badge variant="safe">
            <GraduationCap className="h-3 w-3" /> {completed.size}/{modules.length} selesai
          </Badge>
        }
      />

      <div className="mt-4 rounded-3xl border border-white bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[12px] font-extrabold">
            <Library className="h-4 w-4 text-primary" /> Progres belajar
          </p>
          <p className="text-[10px] text-brand-ink/55">
            {completed.size} dari {modules.length} modul tuntas
          </p>
        </div>
        <Progress
          value={modules.length ? (completed.size / modules.length) * 100 : 0}
          className="mt-2.5 h-2.5"
        />
        {nextModule ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-cream p-3.5">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wide text-brand-ink/50">
                Lanjutkan di sini
              </p>
              <p className="truncate text-[13px] font-extrabold">{nextModule.title}</p>
            </div>
            <Button asChild size="sm" variant="dark">
              <Link href={`/modul/${nextModule.slug}`}>
                Buka modul <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-mint/70 p-3.5 text-[11.5px] font-semibold text-[#0B5E54]">
            <CheckCircle2 className="h-4 w-4" />
            Seluruh modul sudah tuntas. Dalami lagi kapan pun kamu butuh.
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {modules.map((module) => {
          const done = completed.has(module.id);
          const sections = Array.isArray(module.sections) ? module.sections.length : 0;
          return (
            <Link
              key={module.id}
              href={`/modul/${module.slug}`}
              className="group rounded-3xl border border-white bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[13px] font-extrabold ${
                    done ? "bg-brand-mint text-primary" : "bg-brand-lavender text-[#4C56A3]"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : String(module.order).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">Modul {String(module.order).padStart(2, "0")}/05</Badge>
                    {done ? <Badge variant="safe">Tuntas</Badge> : null}
                  </div>
                  <h2 className="mt-1.5 text-[15.5px] font-extrabold leading-snug group-hover:text-primary">
                    {module.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-brand-ink/65">
                    {module.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[9.5px] font-semibold text-brand-ink/55">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" /> {module.readingMinutes} menit
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpenCheck className="h-3 w-3" /> {sections} bagian
                    </span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ShieldCheck className="h-3 w-3" /> +20 XP diperoleh
                      </span>
                    ) : null}
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-brand-ink/20 transition group-hover:text-primary" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 rounded-3xl bg-brand-butter/80 p-4 text-[11px] leading-relaxed text-[#6C5200]">
        <p className="flex items-center gap-1.5 font-extrabold">
          <ShieldCheck className="h-3.5 w-3.5" /> Catatan privasi
        </p>
        <p className="mt-1 text-[#6C5200]/75">
          Modul ini tidak meminta NIK, PIN, OTP, atau data pribadi asli. Semua contoh
          memakai data sintetis sesuai prinsip privacy-by-design.
        </p>
      </div>
    </div>
  );
}
