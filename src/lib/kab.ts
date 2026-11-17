export type KabDimension = "knowledge" | "attitude" | "behavior";

export interface KabQuestion {
  id: string;
  dimension: KabDimension;
  text: string;
  type: "boolean" | "scale";
  correct?: boolean;
  reverse?: boolean;
}

/**
 * Instrumen KAB 12 butir yang diadaptasi dari kerangka HAIS-Q (Diputra et al., 2026).
 * Empat butir pengetahuan, empat sikap, dan empat perilaku.
 */
export const KAB_QUESTIONS: KabQuestion[] = [
  {
    id: "k1",
    dimension: "knowledge",
    type: "boolean",
    text: "Surat tilang resmi dapat dikirim polisi melalui WhatsApp dalam bentuk berkas .APK.",
    correct: false,
  },
  {
    id: "k2",
    dimension: "knowledge",
    type: "boolean",
    text: "Bank resmi boleh meminta PIN dan kode OTP sekaligus untuk mencairkan hadiah.",
    correct: false,
  },
  {
    id: "k3",
    dimension: "knowledge",
    type: "boolean",
    text: "Domain resmi instansi pemerintah Indonesia umumnya berakhiran .go.id.",
    correct: true,
  },
  {
    id: "k4",
    dimension: "knowledge",
    type: "boolean",
    text: "Nama pengirim email yang tampak resmi membuktikan alamat email tersebut asli.",
    correct: false,
  },
  {
    id: "a1",
    dimension: "attitude",
    type: "scale",
    text: "Saya merasa aman menekan tautan dari nomor tak dikenal selama pesannya mendesak.",
    reverse: true,
  },
  {
    id: "a2",
    dimension: "attitude",
    type: "scale",
    text: "Saya bersedia berhenti sejenak untuk memeriksa domain sebelum mengisi data.",
  },
  {
    id: "a3",
    dimension: "attitude",
    type: "scale",
    text: "Menyerahkan PIN atau OTP kepada petugas layanan pelanggan adalah hal wajar.",
    reverse: true,
  },
  {
    id: "a4",
    dimension: "attitude",
    type: "scale",
    text: "Melaporkan pesan penipuan membantu melindungi orang lain, bukan hanya diri sendiri.",
  },
  {
    id: "b1",
    dimension: "behavior",
    type: "scale",
    text: "Dalam sebulan terakhir, saya memeriksa alamat domain sebelum mengisi data pribadi.",
  },
  {
    id: "b2",
    dimension: "behavior",
    type: "scale",
    text: "Saya pernah membagikan kode OTP kepada orang lain yang mengaku petugas resmi.",
    reverse: true,
  },
  {
    id: "b3",
    dimension: "behavior",
    type: "scale",
    text: "Saya memverifikasi nomor atau akun resmi sebelum melakukan pembayaran.",
  },
  {
    id: "b4",
    dimension: "behavior",
    type: "scale",
    text: "Saya melaporkan pesan mencurigakan ke platform atau instansi resmi.",
  },
];

export const SCALE_OPTIONS = [
  { value: 1, label: "Sangat tidak setuju" },
  { value: 2, label: "Tidak setuju" },
  { value: 3, label: "Netral" },
  { value: 4, label: "Setuju" },
  { value: 5, label: "Sangat setuju" },
];

export interface KabResult {
  knowledge: number;
  attitude: number;
  behavior: number;
  kabIndex: number;
}

export function scoreKab(answers: Record<string, number | boolean>): KabResult {
  const knowledgeQuestions = KAB_QUESTIONS.filter(
    (question) => question.dimension === "knowledge",
  );
  const correct = knowledgeQuestions.filter(
    (question) => answers[question.id] === question.correct,
  ).length;
  const knowledge = Math.round((correct / knowledgeQuestions.length) * 100);

  const dimensionScore = (dimension: KabDimension) => {
    const questions = KAB_QUESTIONS.filter(
      (question) => question.dimension === dimension,
    );
    const total = questions.reduce((sum, question) => {
      const raw = Number(answers[question.id] ?? 3);
      const value = question.reverse ? 6 - raw : raw;
      return sum + value;
    }, 0);
    const min = questions.length;
    const max = questions.length * 5;
    return Math.round(((total - min) / (max - min)) * 100);
  };

  const attitude = dimensionScore("attitude");
  const behavior = dimensionScore("behavior");
  const kabIndex = Math.round((knowledge + attitude + behavior) / 3);

  return { knowledge, attitude, behavior, kabIndex };
}
