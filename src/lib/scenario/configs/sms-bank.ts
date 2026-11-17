import type { ScenarioSeed } from "../types";

export const smsBankScenario: ScenarioSeed = {
  slug: "sms-poin-bank",
  title: "Poin Bank Hangus Malam Ini",
  subtitle: "Modus Poin Bank Hangus Malam Ini",
  description:
    "SMS mengaku dari bank resmi menawarkan pencairan poin menjadi saldo, lalu mengarahkan ke situs yang meminta PIN dan OTP.",
  channel: "SMS",
  category: "Umpan Link",
  difficulty: "SEDANG",
  level: 1,
  estimatedMinutes: 4,
  sortOrder: 2,
  badgeKey: "penjaga-otp",
  config: {
    version: 1,
    channel: "SMS",
    appLabel: "SMS",
    intro: {
      title: "Uji Refleks Keamanan",
      mission:
        "Sebuah SMS masuk dari nama pengirim yang tampak seperti bank. Baca isinya dengan teliti, terutama tautan dan permintaan datanya.",
      tip: "Nama pengirim (Alpha-Sender ID) bisa dipalsukan. Bank tidak pernah meminta PIN dan OTP sekaligus lewat tautan.",
    },
    startSceneId: "sms",
    scenes: [
      {
        id: "sms",
        type: "sms",
        label: "Pesan Teks / SMS",
        sender: {
          name: "{{bank}}",
          subtitle: "Pesan Teks / SMS",
          note: "Pengirim: {{bank}} (Alpha-Sender ID) · Nomor tidak tersimpan dalam kontak Anda.",
        },
        timeLabel: "HARI INI 11:40",
        messages: [
          { kind: "date", label: "HARI INI 11:40" },
          {
            kind: "incoming",
            text: "Yth Nasabah, {{points}} Poin Reward Anda akan HANGUS malam ini pkl {{deadline}}. Segera tukarkan dengan saldo tabungan senilai {{nominal}} melalui link resmi:\nhttps://{{domain}}/tukar",
            time: "11.41",
          },
        ],
        composer: "Ketik pesan SMS...",
        decision: {
          title: "Uji Refleks Keamanan",
          question:
            "SMS memakai nama resmi perbankan, tetapi cermati tautannya. Apa tindakan Anda?",
          hint: "Bandingkan domain pada tautan dengan domain resmi bank Anda.",
          choices: [
            {
              id: "open",
              label: "Buka Tautan (Pelajari Modusnya)",
              tone: "danger",
              next: "browser",
              verdict: "vulnerable",
              feedback:
                "Membuka tautan sudah cukup untuk masuk ke replika situs penipuan. Domain {{domain}} bukan domain resmi bank.",
            },
            {
              id: "report",
              label: "Waspada & Laporkan Pesan Palsu",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Laporkan SMS ke bank dan kanal pengaduan, lalu blokir pengirimnya.",
            },
            {
              id: "app",
              label: "Cek poin lewat aplikasi resmi bank",
              tone: "neutral",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Selalu buka aplikasi atau situs resmi bank secara mandiri, bukan lewat tautan SMS.",
            },
          ],
        },
      },
      {
        id: "browser",
        type: "browser",
        label: "Replika situs bank",
        url: "https://{{domain}}/tukar",
        warning: {
          title: "Peringatan keamanan",
          body: "Domain ini bukan situs resmi perbankan. Institusi resmi memakai domain kredibel seperti .co.id, bukan domain sewaan murah .my.id.",
        },
        brand: {
          name: "{{bank}}",
          tagline: "INDONESIA · SECURE",
          badge: "Loyalty Portal",
        },
        pageTitle: "Konfirmasi Pencairan Poin {{nominal}}",
        intro:
          "Tukarkan {{points}} Poin Reward Anda langsung ke rekening tabungan sebelum hangus otomatis hari ini.",
        timer: { label: "WAKTU TERBATAS", value: "04:59", note: "Sisa klaim:" },
        fields: [
          {
            label: "Username / No. Kartu Debit (16 Digit)",
            value: "4512 8890 1204 ••••",
            hint: "Terisi otomatis",
            status: "Terisi",
          },
          {
            label: "PIN M-Banking (6 Digit)",
            value: "••••••",
            kind: "password",
            hint: "Sangat Rahasia",
            danger: true,
            status: "Sangat Rahasia",
          },
          {
            label: "Kode OTP SMS (Wajib Verifikasi)",
            value: "Masukkan 6 digit kode dari SMS...",
            kind: "text",
            hint: "Jangan pernah berikan kode ini kepada siapa pun termasuk staf bank.",
            danger: true,
            status: "SMS Terkirim",
          },
        ],
        primaryCta: "Cairkan Sekarang {{nominal}}",
        footnote: "Data diamankan dengan enkripsi 256-bit (Palsu)",
        simLabel: "Ini di dalam ruang simulasi",
        decision: {
          title: "Perangkap Terdeteksi",
          question:
            "Situs meminta PIN dan OTP sekaligus. Apa tindakan Anda?",
          hint: "Untuk menerima uang, Anda hanya perlu nomor rekening — tidak pernah PIN atau OTP.",
          choices: [
            {
              id: "submit",
              label: "Isi PIN & OTP, lalu cairkan",
              tone: "danger",
              next: null,
              verdict: "vulnerable",
              feedback:
                "PIN dan OTP adalah kunci transfer keluar. Tidak ada pencairan hadiah yang membutuhkannya.",
            },
            {
              id: "close",
              label: "Tutup situs & laporkan",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Tutup situs, jangan masukkan data apa pun, dan laporkan tautan tersebut.",
            },
          ],
        },
      },
    ],
    variants: [
      {
        id: "v1",
        label: "9.850 poin · Rp985.000",
        vars: {
          bank: "BANK ABC",
          points: "9.850",
          nominal: "Rp985.000",
          domain: "klaim-poin-bank.my.id",
          deadline: "23.59 WIB",
        },
      },
      {
        id: "v2",
        label: "12.400 poin · Rp1.240.000",
        vars: {
          bank: "BANK NUSANTARA",
          points: "12.400",
          nominal: "Rp1.240.000",
          domain: "reward-nusantara.site",
          deadline: "22.00 WIB",
        },
      },
      {
        id: "v3",
        label: "5.200 poin · Rp520.000",
        vars: {
          bank: "BANK SEJAHTERA",
          points: "5.200",
          nominal: "Rp520.000",
          domain: "poin-sejahtera.xyz",
          deadline: "00.00 WIB",
        },
      },
    ],
    redFlags: [
      {
        id: "rf-hadiah",
        category: "umpan_hadiah",
        label: "UMPAN HADIAH & DOMAIN PALSU",
        title: "Umpan hadiah poin & domain 'aspal'.",
        body: [
          "Penipu memancing rasa sayang jika poin hangus (fear of missing out). Tawaran saldo gratis {{nominal}} dirancang agar pikiran panik dan langsung klik tautan tanpa pikir panjang.",
          "Cermati alamat webnya: institusi bank resmi di Indonesia memakai domain kredibel (seperti .co.id atau ekstensi resmi perbankan), bukan domain publik sewaan murah seperti .my.id, .xyz, atau .site.",
        ],
        fact: "Bank resmi tidak pernah membagikan tautan penukaran poin lewat nomor SMS reguler dengan domain gratisan.",
      },
      {
        id: "rf-rahasia",
        category: "data_rahasia",
        label: "MINTA DATA RAHASIA",
        title: "Untuk terima uang, tidak pernah butuh PIN atau OTP.",
        body: [
          "Untuk menerima uang atau mencairkan hadiah, Anda hanya butuh nomor rekening — tidak pernah butuh PIN, password, apalagi kode OTP SMS.",
          "Jika ada situs atau orang meminta PIN dan OTP dengan alasan \"verifikasi pencairan\", itu 100% modus pencurian saldo.",
        ],
        fact: "PIN dan OTP hanya dipakai untuk TRANSFER KELUAR dari rekening Anda. Jangan pernah membagikannya.",
        compare: {
          goodTitle: "Prosedur Sah",
          good: "Menerima saldo atau hadiah: cukup berikan nomor rekening resmi.",
          badTitle: "Trik Pencuri",
          bad: "Meminta PIN & OTP: kode ini hanya dipakai untuk mentransfer dana keluar dari rekening Anda.",
        },
      },
    ],
    bongkar: {
      sceneId: "sms",
      steps: [
        {
          id: "step-1",
          sceneId: "sms",
          flagIds: ["rf-hadiah"],
          title: "Umpan hadiah poin & domain palsu",
          highlights: ["{{points}} Poin Reward", "HANGUS", "{{domain}}"],
        },
        {
          id: "step-2",
          sceneId: "browser",
          flagIds: ["rf-rahasia"],
          title: "Pembedahan formulir pencurian data rekening",
          highlights: ["PIN M-Banking", "Kode OTP"],
        },
      ],
    },
    takeaways: [
      "Nama pengirim SMS bisa dipalsukan; periksa domain tautannya.",
      "Poin atau saldo yang akan hangus adalah pemicu panik yang sengaja dibuat.",
      "PIN dan OTP tidak pernah dibutuhkan untuk menerima uang.",
    ],
    shareText:
      "SMS poin bank hangus dengan domain .my.id adalah penipuan. Jangan klik tautan, jangan beri PIN dan OTP.",
  },
};
