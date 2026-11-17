import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  MessageCircle,
  Radar,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { BrandWordmark } from "@/components/brand/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-cream min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <aside className="relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div className="flex items-center justify-between">
            <BrandWordmark />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[11px] font-bold text-brand-ink/60 transition hover:bg-white hover:text-brand-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Beranda
            </Link>
          </div>

          <div className="relative my-8 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-mint px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0B5E54]">
              <ShieldCheck className="h-3.5 w-3.5" /> Sandbox literasi digital
            </span>
            <h1 className="mt-4 text-[42px] font-extrabold leading-[1.05] tracking-[-0.04em]">
              Latih refleks sebelum penipu menelepon.
            </h1>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-brand-ink/55">
              Simulasi multikanal, Mode Bongkar, dan pengukuran KAB dalam satu ruang
              latihan yang aman. Tidak ada pesan nyata, malware, atau permintaan data
              pribadi.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2.5">
              {[
                { icon: MessageCircle, label: "WhatsApp", tone: "bg-brand-mint text-[#0B5E54]" },
                { icon: Smartphone, label: "SMS", tone: "bg-brand-lavender text-[#4C56A3]" },
                { icon: Radar, label: "Radar", tone: "bg-brand-butter text-[#8A6200]" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`rounded-2xl p-3 ${item.tone}`}>
                    <Icon className="h-4 w-4" />
                    <p className="mt-2 text-[10.5px] font-bold">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold text-brand-ink/40">
            <span className="inline-flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" /> 12 butir KAB
            </span>
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5" /> XP & lencana
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% data sintetis
            </span>
          </div>
        </aside>

        <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:border-l lg:border-white/70 lg:bg-white/35 lg:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <Link href="/" aria-label="WASPADAIN">
                <BrandWordmark markClassName="h-8 w-8" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[10.5px] font-bold text-brand-ink/55"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Beranda
              </Link>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
