"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBadge } from "@/lib/gamification";

export function CompleteModuleButton({
  slug,
  completed,
  nextHref,
}: {
  slug: string;
  completed: boolean;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(completed);

  const complete = async () => {
    if (pending || done) return;
    setPending(true);
    try {
      const response = await fetch(`/api/modules/${slug}/complete`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Gagal menandai modul.");
        return;
      }
      setDone(true);
      toast.success(
        data.xpEarned > 0 ? `Modul tuntas! +${data.xpEarned} XP` : "Modul sudah tuntas.",
      );
      if (data.newBadges?.length) {
        toast.success(
          `Lencana baru: ${data.newBadges
            .map((key: string) => getBadge(key)?.name ?? key)
            .join(", ")}`,
        );
      }
      router.refresh();
      if (nextHref) router.push(nextHref);
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-brand-mint/70 p-4 text-center">
        <p className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#0B5E54]">
          <CheckCircle2 className="h-4 w-4" /> Modul ini sudah tuntas
        </p>
        <p className="mt-1 text-[10px] text-brand-ink/55">
          Kamu bisa membaca ulang kapan saja. Pengetahuan ini tetap terbuka.
        </p>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      className="w-full"
      onClick={complete}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" /> Tandai modul tuntas (+20 XP)
        </>
      )}
    </Button>
  );
}
