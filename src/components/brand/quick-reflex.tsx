"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PublicReflexQuestion = {
  id: string;
  channel: string;
  prompt: string;
  quote: string;
  options: { id: string; label: string }[];
};

export function QuickReflex({
  question,
  alreadyCorrect,
}: {
  question: PublicReflexQuestion;
  alreadyCorrect: boolean;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{
    correct: boolean;
    explanation: string;
    xpEarned: number;
  } | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (choiceId: string) => {
    if (pending || answer) return;
    setPending(true);
    setChoice(choiceId);
    try {
      const response = await fetch("/api/reflex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, choiceId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Gagal memeriksa jawaban.");
        setChoice(null);
        return;
      }
      setAnswer(data);
      if (data.correct) {
        toast.success(
          data.xpEarned > 0
            ? `Tepat! +${data.xpEarned} XP`
            : "Tepat! Latihan ini sudah pernah kamu selesaikan.",
        );
      }
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi.");
      setChoice(null);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="rounded-3xl bg-[#EEF3FD] p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E11D48]" />
          <h3 className="text-[16px] font-extrabold">Tes Refleks Cepat</h3>
        </div>
        <Badge variant="safe">{question.channel}</Badge>
      </div>

      <div className="mt-3 rounded-2xl bg-white p-4">
        <p className="text-[12px] leading-relaxed text-brand-ink/65">{question.prompt}</p>
        <p className="mt-2 text-[13px] font-semibold leading-relaxed text-brand-ink">
          “{question.quote}”
        </p>

        {!answer ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => submit(option.id)}
                className={cn(
                  "h-auto min-h-[44px] whitespace-normal rounded-2xl px-4 py-2.5 text-[12px]",
                  choice === option.id && "border-primary bg-brand-mint",
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "mt-3 rounded-2xl p-3.5 text-[12px] leading-relaxed",
              answer.correct
                ? "bg-brand-mint text-[#0B5E54]"
                : "bg-brand-blush text-[#9F1239]",
            )}
            role="status"
          >
            <p className="flex items-center gap-1.5 font-extrabold">
              {answer.correct ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {answer.correct ? "Tepat!" : "Belum tepat"}
              {answer.xpEarned > 0 ? (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px]">
                  <Sparkles className="h-3 w-3" /> +{answer.xpEarned} XP
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 text-brand-ink/70">{answer.explanation}</p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 text-[9.5px] font-medium text-brand-ink/55">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-primary" />
            {alreadyCorrect ? "Sudah pernah dijawab benar" : "Satu pertanyaan, satu refleks"}
          </span>
          <span>Tanpa data asli</span>
        </div>
      </div>
    </section>
  );
}
