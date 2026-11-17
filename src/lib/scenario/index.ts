import { etleScenario } from "./configs/etle";
import { emailTaxScenario } from "./configs/email-tax";
import { qrisScenario } from "./configs/qris";
import { resiScenario } from "./configs/resi";
import { smsBankScenario } from "./configs/sms-bank";
import type { ScenarioConfig, ScenarioSeed } from "./types";

export const SCENARIO_SEEDS: ScenarioSeed[] = [
  etleScenario,
  smsBankScenario,
  emailTaxScenario,
  resiScenario,
  qrisScenario,
];

export function getScenarioSeed(slug: string): ScenarioSeed | undefined {
  return SCENARIO_SEEDS.find((scenario) => scenario.slug === slug);
}

export function getScenarioConfig(
  config: unknown,
  variantIndex = 0,
): { config: ScenarioConfig; variantIndex: number } {
  const scenario = config as ScenarioConfig;
  const count = Math.max(scenario.variants?.length ?? 1, 1);
  const normalized = ((variantIndex % count) + count) % count;
  return { config: scenario, variantIndex: normalized };
}

/** The simulator stores scene definitions as JSON. Validate integrity at seed time. */
export function assertScenarioConfig(seed: ScenarioSeed): void {
  const { config, slug } = seed;
  const sceneIds = new Set(config.scenes.map((scene) => scene.id));
  if (!sceneIds.has(config.startSceneId)) {
    throw new Error(`[${slug}] startSceneId tidak ditemukan`);
  }
  if (!sceneIds.has(config.bongkar.sceneId)) {
    throw new Error(`[${slug}] scene bongkar tidak ditemukan`);
  }
  if (config.variants.length === 0) {
    throw new Error(`[${slug}] variants kosong`);
  }
  for (const scene of config.scenes) {
    if (!scene.decision && !scene.action) {
      throw new Error(`[${slug}] scene ${scene.id} tidak memiliki aksi`);
    }
    for (const choice of scene.decision?.choices ?? []) {
      if (choice.next && !sceneIds.has(choice.next)) {
        throw new Error(
          `[${slug}] pilihan ${scene.id}/${choice.id} menuju scene tidak dikenal`,
        );
      }
    }
    if (scene.action?.next && !sceneIds.has(scene.action.next)) {
      throw new Error(`[${slug}] aksi ${scene.id} menuju scene tidak dikenal`);
    }
  }
  for (const step of config.bongkar.steps) {
    if (!sceneIds.has(step.sceneId)) {
      throw new Error(`[${slug}] bongkar step ${step.id} scene tidak dikenal`);
    }
    for (const flagId of step.flagIds) {
      if (!config.redFlags.some((flag) => flag.id === flagId)) {
        throw new Error(`[${slug}] red flag ${flagId} tidak ditemukan`);
      }
    }
  }
}

export interface ReflexQuestion {
  id: string;
  channel: string;
  prompt: string;
  quote: string;
  options: { id: string; label: string; correct: boolean; explanation: string }[];
}

export const QUICK_REFLEX_QUESTIONS: ReflexQuestion[] = [
  {
    id: "refleks-apk",
    channel: "WhatsApp",
    prompt: "Ada chat masuk dari nomor tak dikenal. Tindakan yang tepat?",
    quote:
      "\"Paket Anda tertahan di gudang, klik surat_resi.apk untuk konfirmasi.\"",
    options: [
      {
        id: "download",
        label: "Download & cek",
        correct: false,
        explanation:
          "File .APK adalah aplikasi, bukan dokumen paket. Membukanya berisiko menyadap SMS dan OTP Anda.",
      },
      {
        id: "block",
        label: "Abaikan & blokir",
        correct: true,
        explanation:
          "Tepat. Blokir pengirim, hapus pesan, dan lacak paket lewat aplikasi resmi kurir.",
      },
    ],
  },
  {
    id: "refleks-domain",
    channel: "Browser",
    prompt: "Anda diminta login ke portal pemerintah. Mana alamat yang wajar?",
    quote:
      "\"Sinkronisasi NIK–NPWP sekarang: https://pemadanan-djp-online.com\"",
    options: [
      {
        id: "com",
        label: "Buka tautan .com tersebut",
        correct: false,
        explanation:
          "Situs pemerintah memakai domain .go.id. Domain .com bukan kanal resmi administrasi kenegaraan.",
      },
      {
        id: "go",
        label: "Buka djponline.pajak.go.id mandiri",
        correct: true,
        explanation:
          "Tepat. Buka portal resmi secara mandiri, jangan lewat tautan dari pesan.",
      },
    ],
  },
  {
    id: "refleks-otp",
    channel: "SMS",
    prompt: "Petugas layanan pelanggan meminta kode OTP Anda. Apa yang Anda lakukan?",
    quote:
      "\"Kak, untuk membatalkan transaksi, kirim kode OTP yang baru masuk ya.\"",
    options: [
      {
        id: "share",
        label: "Kirim OTP agar transaksi batal",
        correct: false,
        explanation:
          "OTP adalah kunci transaksi. Tidak ada staf bank yang berhak memintanya.",
      },
      {
        id: "refuse",
        label: "Tolak & hubungi bank lewat kanal resmi",
        correct: true,
        explanation:
          "Tepat. Tutup komunikasi, hubungi bank lewat aplikasi atau nomor resmi, dan laporkan.",
      },
    ],
  },
  {
    id: "refleks-qris",
    channel: "QRIS",
    prompt: "Merchant mengirim tautan verifikasi QRIS. Tindakan yang tepat?",
    quote:
      "\"Pembayaran gagal, scan ulang dan masukkan PIN + OTP di link ini.\"",
    options: [
      {
        id: "follow",
        label: "Isi PIN & OTP di tautan",
        correct: false,
        explanation:
          "PIN dan OTP tidak pernah diperlukan untuk verifikasi merchant. Ini modus pengurasan saldo.",
      },
      {
        id: "verify",
        label: "Cek mutasi di aplikasi resmi",
        correct: true,
        explanation:
          "Tepat. Verifikasi pembayaran di aplikasi resmi Anda dan konfirmasi ke merchant melalui kanal resmi.",
      },
    ],
  },
];
