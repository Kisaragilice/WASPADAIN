import type { Channel, Difficulty } from "@prisma/client";

export type RadarCategory =
  | "tekanan_waktu"
  | "umpan_hadiah"
  | "otoritas_palsu"
  | "format_tautan"
  | "data_rahasia";

export const RADAR_CATEGORIES: {
  key: RadarCategory;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    key: "tekanan_waktu",
    label: "Tekanan Waktu",
    short: "Waktu",
    description: "Panik karena tenggat, ancaman blokir, atau denda mendadak.",
  },
  {
    key: "umpan_hadiah",
    label: "Umpan Hadiah",
    short: "Hadiah",
    description: "Tergiur poin, saldo gratis, atau hadiah yang akan hangus.",
  },
  {
    key: "otoritas_palsu",
    label: "Otoritas Palsu",
    short: "Otoritas",
    description: "Percaya pada nama instansi, kurir, atau petugas yang dicatut.",
  },
  {
    key: "format_tautan",
    label: "Format & Tautan",
    short: "Tautan",
    description: "Melewatkan berkas .APK, domain palsu, dan tautan asing.",
  },
  {
    key: "data_rahasia",
    label: "Data Rahasia",
    short: "Data",
    description: "Menyerahkan PIN, OTP, NIK, nama ibu kandung, atau selfie KTP.",
  },
];

export const CATEGORY_LABEL: Record<RadarCategory, string> = Object.fromEntries(
  RADAR_CATEGORIES.map((category) => [category.key, category.label]),
) as Record<RadarCategory, string>;

export type Verification = "verified" | "unknown" | "danger";

export interface ScenarioVariant {
  id: string;
  label: string;
  vars: Record<string, string>;
}

export interface DecisionChoice {
  id: string;
  label: string;
  tone: "safe" | "danger" | "neutral";
  next: string | null;
  verdict: "safe" | "vulnerable";
  feedback: string;
  /** Radar dimensions exposed by this specific risky decision. */
  categories?: RadarCategory[];
}

export interface SceneAction {
  id: string;
  label: string;
  next: string | null;
  verdict?: "safe" | "vulnerable";
  /** Radar dimensions exposed by this specific risky action. */
  categories?: RadarCategory[];
}

export interface Decision {
  title: string;
  question: string;
  hint?: string;
  choices: DecisionChoice[];
}

interface BaseScene {
  id: string;
  type: "phone-home" | "whatsapp" | "sms" | "email" | "browser" | "dialog";
  label?: string;
  decision?: Decision;
  action?: SceneAction;
}

export interface PhoneHomeScene extends BaseScene {
  type: "phone-home";
  notification: {
    app: string;
    sender: string;
    title: string;
    body: string;
    time: string;
    unread: number;
  };
  tip?: { title: string; body: string; tag?: string };
}

export type ChatMessage =
  | { kind: "date"; label: string }
  | { kind: "incoming"; text: string; time?: string; danger?: boolean }
  | { kind: "outgoing"; text: string; time?: string }
  | {
      kind: "file";
      fileName: string;
      fileType: string;
      fileSize: string;
      note?: string;
      time?: string;
      danger?: boolean;
    }
  | { kind: "image"; caption: string; label: string; time?: string }
  | { kind: "warning"; text: string };

export interface WhatsAppScene extends BaseScene {
  type: "whatsapp";
  contact: {
    name: string;
    subtitle: string;
    verification: Verification;
  };
  encryptionNote?: string;
  messages: ChatMessage[];
  composer?: string;
  simLabel?: string;
}

export interface SmsScene extends BaseScene {
  type: "sms";
  sender: { name: string; subtitle: string; note?: string };
  timeLabel: string;
  messages: ChatMessage[];
  composer?: string;
}

export interface EmailBlock {
  type: "paragraph" | "alert" | "cta" | "signature";
  text: string;
  title?: string;
}

export interface EmailScene extends BaseScene {
  type: "email";
  fromName: string;
  fromAddress: string;
  senderFlag?: string;
  to: string;
  subject: string;
  preview?: string;
  time: string;
  blocks: EmailBlock[];
}

export interface BrowserField {
  label: string;
  value: string;
  kind?: "text" | "password" | "file" | "qr";
  hint?: string;
  danger?: boolean;
  status?: string;
}

export interface BrowserScene extends BaseScene {
  type: "browser";
  url: string;
  warning?: { title: string; body: string };
  brand: { name: string; tagline: string; badge?: string };
  pageTitle: string;
  intro: string;
  timer?: { label: string; value: string; note?: string };
  fields: BrowserField[];
  primaryCta: string;
  footnote?: string;
  simLabel?: string;
}

export interface DialogScene extends BaseScene {
  type: "dialog";
  appName: string;
  permissionTitle: string;
  permissionBody: string;
}

export type ScenarioScene =
  | PhoneHomeScene
  | WhatsAppScene
  | SmsScene
  | EmailScene
  | BrowserScene
  | DialogScene;

export interface RedFlag {
  id: string;
  category: RadarCategory;
  label: string;
  title: string;
  body: string[];
  fact: string;
  compare?: {
    goodTitle: string;
    good: string;
    badTitle: string;
    bad: string;
  };
}

export interface BongkarStep {
  id: string;
  sceneId: string;
  flagIds: string[];
  title: string;
  highlights: string[];
}

export interface ScenarioConfig {
  version: 1;
  channel: Channel;
  appLabel: string;
  intro: { title: string; mission: string; tip?: string };
  startSceneId: string;
  scenes: ScenarioScene[];
  variants: ScenarioVariant[];
  redFlags: RedFlag[];
  bongkar: {
    sceneId: string;
    steps: BongkarStep[];
  };
  takeaways: string[];
  shareText: string;
}

export interface ScenarioSeed {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  channel: Channel;
  category: string;
  difficulty: Difficulty;
  level: number;
  estimatedMinutes: number;
  sortOrder: number;
  badgeKey: string;
  config: ScenarioConfig;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  MUDAH: "Mudah",
  SEDANG: "Sedang",
  SULIT: "Sulit",
};

export function interpolateString(
  value: string,
  vars: Record<string, string>,
): string {
  return value.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
}

export function interpolateDeep<T>(value: T, vars: Record<string, string>): T {
  if (typeof value === "string") {
    return interpolateString(value, vars) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateDeep(item, vars)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        interpolateDeep(item, vars),
      ]),
    ) as T;
  }
  return value;
}

export function getScene(
  config: ScenarioConfig,
  sceneId: string,
): ScenarioScene | undefined {
  return config.scenes.find((scene) => scene.id === sceneId);
}

export function getRedFlag(config: ScenarioConfig, flagId: string) {
  return config.redFlags.find((flag) => flag.id === flagId);
}
