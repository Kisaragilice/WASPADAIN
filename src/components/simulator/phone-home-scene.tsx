"use client";

import { motion } from "framer-motion";
import {
  Camera,
  ChevronRight,
  Image as ImageIcon,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { StatusBar } from "./status-bar";
import type { PhoneHomeScene } from "@/lib/scenario/types";
import { cn } from "@/lib/utils";

const APPS = [
  { label: "WhatsApp", tone: "bg-[#25D366]", icon: MessageCircle, unread: true },
  { label: "Instagram", tone: "bg-gradient-to-br from-[#F9CE34] via-[#EE2A7B] to-[#6228D7]", icon: Camera },
  { label: "ABC Mobile", tone: "bg-[#14265A]", icon: ShieldCheck },
  { label: "Chrome", tone: "bg-white", icon: ChevronRight },
  { label: "Gmail", tone: "bg-white", icon: Mail },
  { label: "Galeri", tone: "bg-gradient-to-br from-[#FFB199] to-[#FF6B6B]", icon: ImageIcon },
  { label: "Setelan", tone: "bg-[#36445A]", icon: Settings },
  { label: "Waspadain", tone: "bg-[#4FC3AE]", icon: ShieldCheck },
];

export function PhoneHomeSceneView({
  scene,
  onAction,
  pending,
}: {
  scene: PhoneHomeScene;
  onAction: (actionId: string) => void;
  pending: boolean;
}) {
  return (
    <div className="min-h-[560px] bg-[radial-gradient(ellipse_at_20%_10%,#3B2C64,#15162B_55%,#0B0E1A)] pb-4">
      <StatusBar dark />
      <div className="px-4 pt-2">
        <button
          type="button"
          onClick={() => onAction("open")}
          disabled={pending}
          className="group w-full rounded-2xl bg-white/95 p-3 text-left shadow-lg transition hover:bg-white disabled:opacity-70"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366]">
              <MessageCircle className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-[11px] font-bold text-brand-ink/70">
              {scene.notification.app} · {scene.notification.time}
            </span>
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#E11D48] text-[10px] font-bold text-white">
              {scene.notification.unread}
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] font-extrabold leading-snug text-brand-ink">
            {scene.notification.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-brand-ink/65">
            {scene.notification.body}
          </p>
          <div className="mt-2 flex items-center justify-between border-t border-brand-ink/[0.06] pt-2">
            <span className="text-[10.5px] font-semibold text-primary">
              Ketuk untuk buka ruang obrolan
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-brand-ink/35" />
          </div>
        </button>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-x-3 gap-y-4 px-5">
        {APPS.map((app) => {
          const Icon = app.icon;
          return (
            <div key={app.label} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <span
                  className={cn(
                    "flex h-[52px] w-[52px] items-center justify-center rounded-[15px] shadow-md",
                    app.tone,
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6",
                      app.label === "Chrome"
                        ? "text-[#4285F4]"
                        : app.label === "Gmail"
                          ? "text-[#EA4335]"
                          : "text-white",
                    )}
                  />
                </span>
                {app.unread ? (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E11D48] text-[9px] font-bold text-white">
                    1
                  </span>
                ) : null}
              </div>
              <span className="text-[9.5px] font-medium text-white/85">{app.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mx-4 mt-5 flex items-center justify-around rounded-2xl bg-white/10 px-2 py-2.5 backdrop-blur">
        {[
          { icon: Phone, label: "Telepon", tone: "bg-[#41C46A]" },
          { icon: MessageCircle, label: "Pesan", tone: "bg-[#3B82F6]" },
          { icon: Camera, label: "Kamera", tone: "bg-[#64748B]" },
          { icon: ShieldCheck, label: "Panduan", tone: "bg-[#4FC3AE]" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex w-14 flex-col items-center gap-1">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", item.tone)}>
                <Icon className="h-5 w-5 text-white" />
              </span>
              <span className="text-[8.5px] text-white/70">{item.label}</span>
            </div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-4 mt-5 flex items-center gap-2 rounded-xl bg-[#101B2D]/45 px-3 py-2 text-[9px] text-white/65 backdrop-blur"
      >
        <Lock className="h-3 w-3 text-emerald-300" />
        waspadain.id/simulasi · layar tiruan
        <span className="ml-auto flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        </span>
      </motion.div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => onAction("open")}
          disabled={pending}
          className="touch-target inline-flex items-center gap-2 rounded-full bg-[#F4D35E] px-5 py-2.5 text-xs font-extrabold text-brand-ink shadow-sm disabled:opacity-60"
        >
          Buka notifikasi WhatsApp <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
