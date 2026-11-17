"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleUserRound,
  GraduationCap,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandWordmark } from "@/components/brand/brand-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import { getRank } from "@/lib/gamification";
import type { SafeUser } from "@/lib/auth/session";

const NAV = [
  { href: "/simulasi", label: "Simulasi", icon: ShieldCheck },
  { href: "/modul", label: "Modul", icon: GraduationCap },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/profil", label: "Profil", icon: CircleUserRound },
];

const ADMIN_NAV = { href: "/admin", label: "Admin", icon: ShieldAlert };

export function AppShell({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const rank = getRank(user.xp);
  const nav = user.role === "ADMIN" ? [...NAV, ADMIN_NAV] : NAV;
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="gradient-cream min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-[#FBF8EF]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/simulasi" className="shrink-0" aria-label="Waspadain">
            <BrandWordmark markClassName="h-8 w-8" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  isActive(item.href)
                    ? "bg-brand-ink text-white"
                    : "text-brand-ink/70 hover:bg-white hover:text-brand-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/profil"
              className="hidden items-center gap-2 rounded-full border border-brand-ink/10 bg-white/80 py-1 pl-3 pr-1.5 text-xs font-semibold text-brand-ink sm:flex"
              title={`${rank.current.name} · ${user.xp} XP`}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {user.xp} XP
              <span className="rounded-full bg-brand-butter px-2 py-1 text-[10px] font-bold text-[#7c5a00]">
                Level {rank.level}
              </span>
            </Link>
            <Link
              href="/profil#riwayat"
              aria-label="Riwayat aktivitas"
              className="flex h-10 w-10 items-center justify-center rounded-full text-brand-ink/65 transition hover:bg-white hover:text-brand-ink"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/profil" aria-label="Buka profil">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-brand-ink text-white">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-0">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-[#FBF8EF]/95 backdrop-blur-xl lg:hidden"
        aria-label="Navigasi bawah"
      >
        <div className="safe-bottom mx-auto flex max-w-md items-end justify-around px-3 pt-2">
          {nav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[52px] min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 pb-1 pt-1 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-brand-ink/50",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                    active && "bg-brand-mint",
                  )}
                >
                  <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function ShellBadge({ children }: { children: React.ReactNode }) {
  return <Badge variant="secondary">{children}</Badge>;
}
