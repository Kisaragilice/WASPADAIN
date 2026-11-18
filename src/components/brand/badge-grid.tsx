import { Lock } from "lucide-react";
import { BADGES, getBadge } from "@/lib/gamification";
import { BADGE_ICONS } from "@/components/brand/icons";
import { cn } from "@/lib/utils";

export function BadgeGrid({ earned }: { earned: string[] }) {
  const owned = new Set(earned);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {BADGES.map((badge) => {
        const unlocked = owned.has(badge.key);
        const Icon = BADGE_ICONS[badge.key] ?? BADGE_ICONS.default;
        return (
          <div
            key={badge.key}
            title={unlocked ? badge.description : badge.hint}
            className={cn(
              "flex items-start gap-2 rounded-2xl border p-2.5",
              unlocked
                ? "border-brand-butter bg-brand-butter/50"
                : "border-brand-ink/[0.07] bg-white/60",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                unlocked
                  ? "bg-[#F4D35E] text-[#6C5200]"
                  : "bg-brand-ink/[0.05] text-brand-ink/25",
              )}
            >
              {unlocked ? (
                <Icon className="h-4 w-4" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[10.5px] font-extrabold leading-tight",
                  unlocked ? "text-brand-ink" : "text-brand-ink/55",
                )}
              >
                {badge.name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[8.5px] leading-snug text-brand-ink/55">
                {unlocked ? badge.description : badge.hint}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BadgePill({ badgeKey }: { badgeKey: string }) {
  const badge = getBadge(badgeKey);
  if (!badge) return null;
  const Icon = BADGE_ICONS[badge.key] ?? BADGE_ICONS.default;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-butter px-2.5 py-1 text-[10px] font-bold text-[#6C5200]">
      <Icon className="h-3 w-3" /> {badge.name}
    </span>
  );
}
