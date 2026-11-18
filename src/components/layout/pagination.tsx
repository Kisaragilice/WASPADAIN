import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  basePath,
  paramName = "page",
}: {
  page: number;
  totalPages: number;
  basePath: string;
  paramName?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) =>
    target <= 1 ? basePath : `${basePath}?${paramName}=${target}`;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) =>
      value === 1 ||
      value === totalPages ||
      Math.abs(value - page) <= 1,
  );

  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-3 flex flex-wrap items-center justify-between gap-2"
    >
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          "inline-flex min-h-[40px] items-center gap-1 rounded-full px-3 text-[10.5px] font-bold transition",
          page <= 1
            ? "pointer-events-none bg-brand-cream/50 text-brand-ink/25"
            : "bg-brand-cream text-brand-ink/65 hover:bg-brand-cream/70 hover:text-brand-ink",
        )}
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
      </Link>

      <div className="flex items-center gap-1">
        {pages.map((value, index) => {
          const previous = pages[index - 1];
          const gap = previous !== undefined && value - previous > 1;
          return (
            <span key={value} className="flex items-center gap-1">
              {gap ? (
                <span className="px-1 text-[10px] text-brand-ink/30">…</span>
              ) : null}
              <Link
                href={href(value)}
                aria-current={value === page ? "page" : undefined}
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-[10.5px] font-bold transition",
                  value === page
                    ? "bg-brand-ink text-white"
                    : "text-brand-ink/60 hover:bg-brand-cream",
                )}
              >
                {value}
              </Link>
            </span>
          );
        })}
      </div>

      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={cn(
          "inline-flex min-h-[40px] items-center gap-1 rounded-full px-3 text-[10.5px] font-bold transition",
          page >= totalPages
            ? "pointer-events-none bg-brand-cream/50 text-brand-ink/25"
            : "bg-brand-cream text-brand-ink/65 hover:bg-brand-cream/70 hover:text-brand-ink",
        )}
      >
        Berikutnya <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </nav>
  );
}
