"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Decision } from "@/lib/scenario/types";

const toneStyles = {
  safe: {
    button: "bg-primary text-white hover:bg-[#0b6c61]",
    icon: ShieldCheck,
    dot: "bg-emerald-400",
  },
  danger: {
    button: "bg-[#E11D48] text-white hover:bg-[#be123c]",
    icon: AlertTriangle,
    dot: "bg-rose-300",
  },
  neutral: {
    button: "bg-brand-ink text-white hover:bg-[#1b2c47]",
    icon: Check,
    dot: "bg-amber-300",
  },
} as const;

export function DecisionPanel({
  decision,
  onChoose,
  pending,
  className,
  compact = false,
}: {
  decision: Decision;
  onChoose: (choiceId: string) => void;
  pending: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "rounded-3xl border border-white/90 bg-[#EEF3FD] p-4 shadow-card sm:p-5",
        className,
      )}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E11D48] text-white">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold leading-tight">{decision.title}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-brand-ink/65">
              Pilih tindakan
            </span>
          </div>
          {!compact ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-brand-ink/65">
              {decision.question}
            </p>
          ) : null}
          {decision.hint ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-white/75 px-3 py-2 text-[11px] leading-relaxed text-brand-ink/65">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              {decision.hint}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {decision.choices.map((choice, index) => {
          const style = toneStyles[choice.tone];
          const Icon = style.icon;
          return (
            <Button
              key={choice.id}
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => onChoose(choice.id)}
              className={cn(
                "h-auto min-h-[48px] w-full justify-start gap-3 rounded-2xl px-3.5 py-3 text-left text-[13px] font-semibold shadow-sm transition-transform hover:-translate-y-0.5",
                style.button,
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
                {index + 1}
              </span>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 whitespace-normal leading-snug">{choice.label}</span>
            </Button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[10px] font-medium text-brand-ink/55">
        Tidak ada jawaban yang mempermalukan. Setiap pilihan adalah bahan belajar.
      </p>
    </motion.section>
  );
}
