import Link from "next/link";
import { ArrowUpRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import type { Scenario } from "@prisma/client";
import { CHANNEL_META } from "@/components/brand/icons";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABEL } from "@/lib/scenario/types";
import { cn } from "@/lib/utils";

export function ScenarioCard({
  scenario,
  completed = 0,
  safe = 0,
  compact = false,
}: {
  scenario: Scenario;
  completed?: number;
  safe?: number;
  compact?: boolean;
}) {
  const channel = CHANNEL_META[scenario.channel];
  const Icon = channel.icon;

  return (
    <Link
      href={`/simulasi/${scenario.slug}`}
      className="group block rounded-3xl border border-white/80 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            channel.bg,
            channel.fg,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{channel.label}</Badge>
            <Badge variant="outline">{scenario.category}</Badge>
            <Badge variant={scenario.difficulty === "SULIT" ? "danger" : "warning"}>
              {DIFFICULTY_LABEL[scenario.difficulty]}
            </Badge>
          </div>
          <h3 className="mt-2 text-[16px] font-extrabold leading-snug group-hover:text-primary sm:text-[17px]">
            {scenario.title}
          </h3>
          {!compact ? (
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-brand-ink/65">
              {scenario.description}
            </p>
          ) : null}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-brand-ink/55">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {scenario.variantCount} variasi
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" /> {scenario.estimatedMinutes} menit
            </span>
            {completed > 0 ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <ShieldCheck className="h-3 w-3" /> {safe}/{completed} aman
              </span>
            ) : null}
          </div>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-brand-ink/25 transition group-hover:text-primary" />
      </div>
    </Link>
  );
}
