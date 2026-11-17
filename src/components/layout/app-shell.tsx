"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Brain,
  ChevronDown,
  CircleUserRound,
  GraduationCap,
  Home,
  Loader2,
  LogOut,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { BrandWordmark } from "@/components/brand/brand-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";
import { getRank } from "@/lib/gamification";
import type { SafeUser } from "@/lib/auth/session";

const PRIMARY_NAV = [
  { href: "/simulasi", label: "Simulasi", icon: ShieldCheck },
  { href: "/modul", label: "Modul", icon: GraduationCap },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/kab", label: "KAB", icon: Brain },
];

const MOBILE_NAV = [
  ...PRIMARY_NAV,
  { href: "/profil", label: "Profil", icon: CircleUserRound },
];

const ACTIVE_PREFIXES: Record<string, string[]> = {
  "/simulasi": ["/simulasi", "/hasil"],
};

export function AppShell({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const rank = getRank(user.xp);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    const prefixes = ACTIVE_PREFIXES[href] ?? [href];
    return prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout gagal");
      // Full navigation guarantees the cleared cookie and fresh server state.
      window.location.assign("/");
    } catch {
      toast.error("Gagal keluar. Periksa koneksi lalu coba lagi.");
      setLoggingOut(false);
    }
  };

  return (
    <div className="gradient-cream min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-[#FBF8EF]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 lg:gap-6">
            <Link
              href="/"
              className="flex shrink-0 items-center rounded-lg"
              aria-label="WASPADAIN — kembali ke beranda"
            >
              <BrandWordmark markClassName="h-8 w-8" />
            </Link>

            <nav
              className="hidden items-center gap-0.5 md:flex"
              aria-label="Navigasi utama"
            >
              {PRIMARY_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors lg:px-4",
                      active
                        ? "bg-brand-ink text-white shadow-sm"
                        : "text-brand-ink/60 hover:bg-white hover:text-brand-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  aria-current={isActive("/admin") ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors lg:px-4",
                    isActive("/admin")
                      ? "bg-brand-ink text-white shadow-sm"
                      : "text-brand-ink/60 hover:bg-white hover:text-brand-ink",
                  )}
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/profil"
              className="hidden items-center gap-1.5 rounded-full border border-brand-ink/10 bg-white/80 py-1 pl-3 pr-2 text-[11px] font-semibold text-brand-ink lg:flex"
              title={`${rank.current.name} · ${user.xp} XP`}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {user.xp} XP
              <span className="rounded-full bg-brand-butter px-2 py-1 text-[9.5px] font-bold text-[#7c5a00]">
                Lv {rank.level}
              </span>
            </Link>

            <Link
              href="/profil#riwayat"
              aria-label="Riwayat aktivitas"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-brand-ink/60 transition hover:bg-white hover:text-brand-ink md:flex"
            >
              <Bell className="h-5 w-5" />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Menu akun"
                  className="flex min-h-[44px] items-center gap-2 rounded-full p-0.5 pr-1 text-left transition hover:bg-white/70"
                >
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm sm:h-10 sm:w-10">
                    <AvatarFallback className="bg-brand-ink text-[12px] font-bold text-white">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="hidden h-4 w-4 text-brand-ink/40 sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="rounded-xl bg-brand-cream/80 px-3 py-2.5">
                  <p className="truncate text-[13px] font-extrabold text-brand-ink">
                    {user.name}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-brand-ink/45">
                    {user.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="warning" className="text-[9px]">
                      {rank.current.name}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px]">
                      {user.xp} XP · Lv {rank.level}
                    </Badge>
                    {user.role === "ADMIN" ? (
                      <Badge variant="dark" className="text-[9px]">
                        Admin
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <DropdownMenuLabel>Navigasi</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <Home /> Beranda utama
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/simulasi">
                    <ShieldCheck /> Dasbor simulasi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profil">
                    <CircleUserRound /> Profil & riwayat
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/radar">
                    <Radar /> Radar kerentanan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/kab">
                    <Brain /> Instrumen KAB
                  </Link>
                </DropdownMenuItem>
                {user.role === "ADMIN" ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldAlert /> Panel admin
                    </Link>
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  tone="danger"
                  disabled={loggingOut}
                  onSelect={(event) => {
                    event.preventDefault();
                    void logout();
                  }}
                >
                  {loggingOut ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <LogOut />
                  )}
                  {loggingOut ? "Keluar..." : "Keluar dari akun"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-0">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-ink/10 bg-[#FBF8EF]/95 backdrop-blur-xl md:hidden"
        aria-label="Navigasi bawah"
      >
        <div className="safe-bottom mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 pb-1 pt-1 text-[10.5px] font-semibold transition-colors",
                  active ? "text-primary" : "text-brand-ink/45",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                    active && "bg-brand-mint",
                  )}
                >
                  <Icon
                    className="h-[21px] w-[21px]"
                    strokeWidth={active ? 2.4 : 1.9}
                  />
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
