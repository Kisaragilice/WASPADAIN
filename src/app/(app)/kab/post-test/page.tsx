import Link from "next/link";
import { ArrowRight, ClipboardCheck, Info, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { KabTest } from "@/components/brand/kab-test";
import { KAB_QUESTIONS, type KabQuestion } from "@/lib/kab";
import { formatDate } from "@/lib/utils";

export default async function PostTestPage() {
  const user = await requireUser();

  const [previous, preTest, completedAttempts] = await Promise.all([
    prisma.assessment.findFirst({
      where: { userId: user.id, type: "POST" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assessment.findFirst({
      where: { userId: user.id, type: "PRE" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.simulationAttempt.count({
      where: { userId: user.id, status: "COMPLETED" },
    }),
  ]);

  let locked: string | null = null;
  if (!preTest) {
    locked = "Pre-test belum diisi. Selesaikan pre-test terlebih dahulu agar perubahan bisa dibandingkan.";
  } else if (completedAttempts === 0) {
    locked =
      "Belum ada simulasi yang selesai. Tuntaskan minimal satu skenario beserta Mode Bongkar, lalu kembali ke sini.";
  }

  return (
    <div className="page-shell max-w-3xl">
      <PageHeader
        backHref="/kab"
        eyebrow="Post-test KAB"
        title="Ukur perubahan setelah berlatih"
        description="Isi setelah kamu menyelesaikan simulasi. Bandingkan hasilnya dengan pre-test dan radar modus untuk melihat mana yang menguat."
        action={
          <Badge variant="safe">
            <ClipboardCheck className="h-3 w-3" /> {KAB_QUESTIONS.length} butir
          </Badge>
        }
      />

      {locked ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-butter/80 p-3.5 text-[11px] leading-relaxed text-[#6C5200]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{locked}</p>
        </div>
      ) : previous ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-brand-mint/70 p-3.5 text-[11px] text-[#0B5E54]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">
            Post-test terakhir: <strong>{previous.kabIndex}/100</strong> pada{" "}
            {formatDate(previous.createdAt, true)}. Pengisian baru akan menjadi riwayat
            terbaru tanpa XP tambahan.
          </p>
          <Link href="/radar" className="shrink-0 font-bold underline underline-offset-2">
            Buka radar
          </Link>
        </div>
      ) : preTest ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-mint/70 p-3.5 text-[11px] leading-relaxed text-[#0B5E54]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Baseline pre-test-mu <strong>{preTest.kabIndex}/100</strong> pada{" "}
            {formatDate(preTest.createdAt)}. Jawab post-test dengan kondisi saat ini agar
            perubahannya jujur.
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <KabTest
          type="POST"
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
          nextHref="/radar"
          locked={locked}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/60 px-3.5 py-3 text-[10px] text-brand-ink/45">
        <span>Hasil post-test tidak memengaruhi hak akses atau peringkat.</span>
        <Link href="/kab" className="inline-flex items-center gap-1 font-bold text-primary">
          Riwayat pengukuran <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
