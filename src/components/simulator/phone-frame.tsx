import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  showSimChrome = true,
  simUrl,
  exitHref = "/simulasi",
}: {
  children: React.ReactNode;
  className?: string;
  showSimChrome?: boolean;
  simUrl?: string;
  exitHref?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[430px]", className)}>
      {showSimChrome ? (
        <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
          <Link
            href={exitHref}
            className="rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-brand-ink/70 shadow-sm transition hover:text-brand-ink"
          >
            ← Keluar
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-[#FFF4C2] px-3 py-1.5 text-[10px] font-bold text-brand-ink/80 sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Ini di dalam ruang simulasi
          </span>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-[2.4rem] border-[7px] border-white bg-[#0B1220] shadow-phone">
        <div aria-hidden className="absolute left-1/2 top-[7px] z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-black/80" />
        <div className="relative min-h-[560px] overflow-hidden bg-[#0B1220]">
          {children}
        </div>
        {simUrl ? (
          <div className="flex items-center gap-2 border-t border-white/10 bg-[#1B2233] px-3 py-2 text-[10px] text-white/60">
            <Lock className="h-3 w-3 text-emerald-300" />
            <span className="truncate rounded-md bg-black/25 px-2 py-1">{simUrl}</span>
            <span className="ml-auto">Waspadain</span>
          </div>
        ) : null}
      </div>
      {showSimChrome ? (
        <p className="mt-3 text-center text-[10px] font-medium text-brand-ink/40">
          100% simulasi aman · data sintetis · bebas malware
        </p>
      ) : null}
    </div>
  );
}
