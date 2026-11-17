import { BatteryFull, Signal, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBar({
  time = "11:42",
  dark = false,
}: {
  time?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-8 items-center justify-between px-5 text-[11px] font-semibold",
        dark ? "text-white" : "text-brand-ink",
      )}
    >
      <span className="tracking-wide">{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3 w-3" strokeWidth={2.6} />
        <Wifi className="h-3.5 w-3.5" strokeWidth={2.4} />
        <BatteryFull className="h-4 w-4" strokeWidth={2} />
        <span className="text-[9px] opacity-80">85%</span>
      </div>
    </div>
  );
}
