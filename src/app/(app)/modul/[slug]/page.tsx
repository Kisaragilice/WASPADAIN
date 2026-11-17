import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CompleteModuleButton } from "@/components/brand/complete-module-button";

interface ModuleSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;

  const material = await prisma.educationModule.findFirst({
    where: { slug, isPublished: true },
  });
  if (!material) notFound();

  const [progress, nextModule, allModules] = await Promise.all([
    prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId: user.id, moduleId: material.id } },
    }),
    prisma.educationModule.findFirst({
      where: { isPublished: true, order: { gt: material.order } },
      orderBy: { order: "asc" },
    }),
    prisma.educationModule.count({ where: { isPublished: true } }),
  ]);

  const sections = (material.sections as unknown as ModuleSection[]) ?? [];
  const completed = Boolean(progress);

  return (
    <div className="page-shell max-w-4xl">
      <PageHeader
        backHref="/modul"
        eyebrow={`Modul ${String(material.order).padStart(2, "0")}/${String(allModules).padStart(2, "0")}`}
        title={material.title}
        description={material.summary}
        action={
          completed ? (
            <Badge variant="safe">
              <CheckCircle2 className="h-3 w-3" /> Tuntas
            </Badge>
          ) : (
            <Badge variant="warning">
              <Clock3 className="h-3 w-3" /> {material.readingMinutes} menit
            </Badge>
          )
        }
      />

      <div className="mt-4 rounded-2xl bg-white p-3 shadow-card">
        <div className="flex items-center justify-between text-[10px] font-semibold text-brand-ink/45">
          <span>Progres modul</span>
          <span>{completed ? "100" : "0"}%</span>
        </div>
        <Progress value={completed ? 100 : 0} className="mt-1.5 h-2" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start">
        <article className="space-y-3">
          {sections.map((section, index) => (
            <section
              key={section.heading}
              className="rounded-3xl border border-white bg-white p-5 shadow-card"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-lavender text-[10px] font-extrabold text-[#4C56A3]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="text-[17px] font-extrabold leading-snug">
                    {section.heading}
                  </h2>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-brand-ink/65">
                    {section.body}
                  </p>
                  {section.bullets?.length ? (
                    <ul className="mt-3 space-y-1.5">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-2 rounded-xl bg-brand-cream/70 px-3 py-2 text-[11.5px] leading-relaxed text-brand-ink/65"
                        >
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </section>
          ))}

          <div className="rounded-3xl bg-brand-ink p-5 text-white">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-amber-300">
              <Lightbulb className="h-3.5 w-3.5" /> Inti modul
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">
              Pengetahuan saja belum cukup. Uji refleksmu di simulasi agar pola ini
              menjadi kebiasaan saat menghadapi pesan nyata.
            </p>
            <Button asChild variant="soft" size="sm" className="mt-3">
              <Link href="/simulasi/katalog">
                Buka katalog skenario <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </article>

        <aside className="space-y-3 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-white bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <BookOpenCheck className="h-4 w-4 text-primary" /> Modul ini
            </h2>
            <ul className="mt-2.5 space-y-1.5 text-[11px] text-brand-ink/55">
              <li className="flex items-center gap-1.5">
                <Clock3 className="h-3 w-3" /> {material.readingMinutes} menit baca
              </li>
              <li className="flex items-center gap-1.5">
                <BookOpenCheck className="h-3 w-3" /> {sections.length} bagian
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" /> Data 100% sintetis
              </li>
            </ul>
            <div className="mt-3">
              <CompleteModuleButton
                slug={material.slug}
                completed={completed}
                nextHref={null}
              />
            </div>
          </div>

          {nextModule ? (
            <Link
              href={`/modul/${nextModule.slug}`}
              className="group block rounded-3xl bg-brand-mint p-4"
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-primary">
                Modul berikutnya
              </p>
              <p className="mt-1 text-[12px] font-extrabold leading-snug group-hover:text-primary">
                {nextModule.title}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-brand-ink/45">
                Lanjut belajar <ArrowRight className="h-3 w-3" />
              </p>
            </Link>
          ) : (
            <div className="rounded-3xl bg-brand-butter/80 p-4 text-[11px] text-[#6C5200]">
              Ini modul terakhir. Kembali ke radar untuk melihat kesiapsiagaanmu.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
