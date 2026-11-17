import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  suffix,
  hint,
  tone = "white",
  icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  tone?: "white" | "mint" | "butter" | "lavender" | "blush";
  icon?: React.ReactNode;
}) {
  const tones = {
    white: "bg-white",
    mint: "bg-brand-mint",
    butter: "bg-brand-butter",
    lavender: "bg-brand-lavender",
    blush: "bg-brand-blush",
  };
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl p-3.5 shadow-[0_6px_18px_-16px_rgba(16,27,45,.3)] sm:p-4",
        tones[tone],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-brand-ink/50">
          {label}
        </p>
        {icon ? <span className="text-brand-ink/45">{icon}</span> : null}
      </div>
      <p className="mt-1 flex items-baseline gap-1 text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">
        {value}
        {suffix ? (
          <span className="text-xs font-semibold text-brand-ink/45">{suffix}</span>
        ) : null}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-brand-ink/50">{hint}</p> : null}
    </div>
  );
}
