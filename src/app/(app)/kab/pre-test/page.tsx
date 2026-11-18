import Link from "next/link";
import { ArrowRight, ClipboardCheck, Info, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { KabTest } from "@/components/brand/kab-test";
import { KAB_QUESTIONS, type KabQuestion } from "@/lib/kab";
import { formatDate } from "@/lib/utils";

function safeNext(value: string | undefined) {
  if (!value) return "/simulasi";
  if (!value.startsWith("/") || value.startsWith("//")) return "/simulasi";
  return value;
}

export default async function PreTestPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const nextHref = safeNext(query.next);

  const previous = await prisma.assessment.findFirst({
    where: { userId: user.id, type: "PRE" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell max-w-3xl">
      <PageHeader
        backHref="/simulasi"
        eyebrow="Pre-test KAB"
        title="Mulai dari garis dasar"
        description="Jawab sesuai kondisi nyatamu, bukan jawaban yang terdengar paling benar. Pre-test tidak menentukan kelulusan dan bisa diisi ulang."
        action={
          <Badge variant="lavender">
            <ClipboardCheck className="h-3 w-3" /> {KAB_QUESTIONS.length} butir
          </Badge>
        }
      />

      {previous ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-brand-butter/80 p-3.5 text-[11px] text-[#6C5200]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">
            Pre-test terakhir: <strong>{previous.kabIndex}/100</strong> pada{" "}
            {formatDate(previous.createdAt, true)}. Pengisian baru dicatat sebagai
            riwayat terbaru tanpa XP tambahan.
          </p>
          <Link href="/kab" className="shrink-0 font-bold underline underline-offset-2">
            Lihat instrumen
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-mint/70 p-3.5 text-[11px] leading-relaxed text-[#0B5E54]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Setelah pre-test, kamu bisa langsung memilih simulasi. Post-test akan terbuka
            setelah minimal satu simulasi selesai.
          </p>
        </div>
      )}

      <div className="mt-4">
        <KabTest
          type="PRE"
          questions={KAB_QUESTIONS as KabQuestion[]}
          previous={
            previous
              ? {
                  kabIndex: previous.kabIndex,
                  knowledge: previous.knowledge,
                  attitude: previous.attitude,
                  behavior: previous.behavior,
                  createdAt: previous.createdAt.toISOString(),
                }
              : null
          }
          nextHref={nextHref}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/60 px-3.5 py-3 text-[10px] text-brand-ink/55">
        <span>Gunakan data sintetis. Jangan menuliskan data pribadi asli.</span>
        <Link href="/kab" className="inline-flex items-center gap-1 font-bold text-primary">
          Tentang instrumen <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
