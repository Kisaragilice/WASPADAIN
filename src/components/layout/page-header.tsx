import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0 max-w-2xl">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink/55 transition hover:text-brand-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Kembali
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
