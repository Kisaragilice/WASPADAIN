import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  Bug,
  CreditCard,
  Flag,
  Gift,
  KeyRound,
  Landmark,
  Link2,
  Mail,
  MessageCircle,
  QrCode,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trophy,
  UserRoundCheck,
} from "lucide-react";
import type { Channel } from "@prisma/client";
import type { RadarCategory } from "@/lib/scenario/types";

export const CHANNEL_META: Record<
  Channel,
  { label: string; icon: LucideIcon; tone: string; bg: string; fg: string }
> = {
  WHATSAPP: {
    label: "WhatsApp",
    icon: MessageCircle,
    tone: "mint",
    bg: "bg-[#DDF4EE]",
    fg: "text-[#0B7A62]",
  },
  SMS: {
    label: "SMS",
    icon: Smartphone,
    tone: "lavender",
    bg: "bg-[#E8EAFB]",
    fg: "text-[#4C56A3]",
  },
  EMAIL: {
    label: "Email",
    icon: Mail,
    tone: "blush",
    bg: "bg-[#FCE3E5]",
    fg: "text-[#C2334A]",
  },
  BROWSER: {
    label: "Browser",
    icon: Link2,
    tone: "butter",
    bg: "bg-[#FCF3C8]",
    fg: "text-[#8A6200]",
  },
};

export const RADAR_ICONS: Record<RadarCategory, LucideIcon> = {
  tekanan_waktu: BellRing,
  umpan_hadiah: Gift,
  otoritas_palsu: Landmark,
  format_tautan: Link2,
  data_rahasia: KeyRound,
};

export const BADGE_ICONS: Record<string, LucideIcon> = {
  "detektif-apk": Bug,
  "penjaga-otp": KeyRound,
  "penjaga-identitas": UserRoundCheck,
  "detektif-paket": CreditCard,
  "quishing-spotter": QrCode,
  "zero-click-hero": ShieldAlert,
  "pelapor-cepat": Flag,
  "kab-tuntas": BadgeCheck,
  "modul-tuntas": Sparkles,
  default: Trophy,
};

export const PATTERN_ICONS = {
  file: AlertTriangle,
  link: Link2,
  panic: BellRing,
  identity: Landmark,
};
