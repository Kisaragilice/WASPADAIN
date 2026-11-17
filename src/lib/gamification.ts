export interface Rank {
  name: string;
  minXp: number;
  description: string;
}

export const RANKS: Rank[] = [
  {
    name: "Kadet Pengamat",
    minXp: 0,
    description: "Mulai mengamati pola jebakan di sekitar.",
  },
  {
    name: "Letnan Waspada",
    minXp: 100,
    description: "Mengenali tanda bahaya dasar pada pesan digital.",
  },
  {
    name: "Kapten Siaga",
    minXp: 250,
    description: "Berani berhenti, memeriksa, dan tidak buru-buru.",
  },
  {
    name: "Mayor Tangguh",
    minXp: 500,
    description: "Konsisten menolak umpan dan melindungi data rahasia.",
  },
  {
    name: "Kolonel Cermat",
    minXp: 900,
    description: "Membedah modus lintas kanal dengan tenang.",
  },
  {
    name: "Wira Pertahanan Siber",
    minXp: 1500,
    description: "Menjadi perisai manusia bagi keluarga dan komunitas.",
  },
];

export function getRank(xp: number) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) current = rank;
  }
  const next = RANKS.find((rank) => rank.minXp > xp);
  const span = next ? next.minXp - current.minXp : 0;
  const progress = next
    ? Math.min(100, Math.round(((xp - current.minXp) / span) * 100))
    : 100;
  return {
    current,
    next: next ?? null,
    progress,
    level: RANKS.indexOf(current) + 1,
    xpIntoRank: xp - current.minXp,
    xpForNext: next ? next.minXp - xp : 0,
  };
}

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  hint: string;
}

export const BADGES: BadgeDefinition[] = [
  {
    key: "detektif-apk",
    name: "Detektif APK",
    description: "Mengenali surat tilang palsu berformat .APK.",
    hint: "Selesaikan simulasi Surat Tilang ETLE dengan aman.",
  },
  {
    key: "penjaga-otp",
    name: "Penjaga OTP",
    description: "Tidak menyerahkan PIN dan OTP kepada situs palsu.",
    hint: "Selesaikan simulasi Poin Bank Hangus dengan aman.",
  },
  {
    key: "penjaga-identitas",
    name: "Penjaga Identitas",
    description: "Menolak permintaan NIK, nama ibu kandung, dan selfie KTP.",
    hint: "Selesaikan simulasi Pemadanan NPWP dengan aman.",
  },
  {
    key: "detektif-paket",
    name: "Detektif Paket",
    description: "Membedakan resi asli dari tautan kurir palsu.",
    hint: "Selesaikan simulasi Resi Paket dengan aman.",
  },
  {
    key: "quishing-spotter",
    name: "Quishing Spotter",
    description: "Mengenali jebakan QRIS dan verifikasi merchant palsu.",
    hint: "Selesaikan simulasi Quishing QRIS dengan aman.",
  },
  {
    key: "zero-click-hero",
    name: "Zero-Click Hero",
    description: "Menyelesaikan tiga jenis skenario berbeda tanpa terjebak.",
    hint: "Tuntaskan tiga skenario berbeda dengan hasil Aman.",
  },
  {
    key: "pelapor-cepat",
    name: "Pelapor Cepat",
    description: "Memilih melapor dan memblokir pada percobaan pertama.",
    hint: "Dapatkan hasil Aman pada simulasi pertama Anda.",
  },
  {
    key: "kab-tuntas",
    name: "KAB Tuntas",
    description: "Menyelesaikan pre-test dan post-test KAB.",
    hint: "Isi pre-test lalu post-test setelah berlatih.",
  },
  {
    key: "modul-tuntas",
    name: "Cendekia Modul",
    description: "Menuntaskan seluruh modul edukasi mitigasi.",
    hint: "Selesaikan kelima modul edukasi.",
  },
];

export function getBadge(key: string) {
  return BADGES.find((badge) => badge.key === key);
}

export const XP_RULES = {
  safeSimulation: 60,
  vulnerableSimulation: 15,
  reflexCorrect: 10,
  moduleComplete: 20,
  assessmentComplete: 30,
} as const;
