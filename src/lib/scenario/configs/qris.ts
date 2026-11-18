import type { ScenarioSeed } from "../types";

export const qrisScenario: ScenarioSeed = {
  slug: "qris-quishing",
  title: "Quishing QRIS & Verifikasi Merchant Palsu",
  subtitle: "Manipulasi Transaksi QRIS",
  description:
    "Penipu mengaku merchant dan mengirim tautan \"QRIS gagal\" yang membuka halaman verifikasi palsu untuk mencuri PIN dan OTP.",
  channel: "WHATSAPP",
  category: "Umpan Link",
  difficulty: "SEDANG",
  level: 2,
  estimatedMinutes: 4,
  sortOrder: 5,
  badgeKey: "quishing-spotter",
  config: {
    version: 1,
    channel: "WHATSAPP",
    appLabel: "WhatsApp",
    intro: {
      title: "Quishing QRIS",
      mission:
        "Anda baru membayar di sebuah kedai. Admin toko mengirim pesan bahwa pembayaran QRIS gagal. Periksa permintaannya sebelum memindai ulang.",
      tip: "Quishing adalah phishing lewat kode QR atau tautan QRIS. Jangan memindai ulang dari tautan chat.",
    },
    startSceneId: "chat",
    scenes: [
      {
        id: "chat",
        type: "whatsapp",
        label: "Chat merchant",
        contact: {
          name: "{{senderNumber}}",
          subtitle: "Admin {{merchant}}",
          verification: "unknown",
        },
        encryptionNote: "Nomor tidak dikenal · Bukan kontak · Tidak ada grup bersama",
        messages: [
          { kind: "date", label: "HARI INI" },
          {
            kind: "incoming",
            text: "Kak, pembayaran QRIS tadi statusnya gagal di sistem. Pesanan {{order}} belum masuk. Bisa scan ulang lewat tautan ini ya?",
            time: "18.22",
          },
          {
            kind: "incoming",
            text: "https://{{domain}}/verify/{{order}}",
            time: "18.23",
          },
          {
            kind: "warning",
            text: "QRIS hanya dipindai dari kanal resmi merchant atau aplikasi pembayaran Anda.",
          },
        ],
        composer: "Ketik pesan...",
        decision: {
          title: "Uji Refleks Keamanan",
          question:
            "Admin toko meminta scan ulang lewat tautan. Apa tindakan Anda?",
          hint: "Cek mutasi di aplikasi pembayaran sendiri. Merchant resmi tidak butuh PIN atau OTP Anda.",
          choices: [
            {
              id: "open",
              label: "Buka tautan verifikasi QRIS",
              tone: "danger",
              next: "browser",
              verdict: "vulnerable",
              categories: ["format_tautan", "otoritas_palsu", "tekanan_waktu"],
              feedback:
                "Tautan {{domain}} membuka situs verifikasi palsu yang akan meminta PIN dan OTP Anda.",
            },
            {
              id: "check",
              label: "Cek mutasi di aplikasi bank/e-wallet resmi",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Cek status pembayaran di aplikasi resmi Anda, bukan lewat tautan dari chat.",
            },
            {
              id: "call",
              label: "Konfirmasi ke merchant lewat kanal resmi",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Hubungi merchant melalui nomor resmi atau datang langsung ke toko.",
            },
          ],
        },
      },
      {
        id: "browser",
        type: "browser",
        label: "Halaman verifikasi palsu",
        url: "https://{{domain}}/verify/{{order}}",
        warning: {
          title: "Bukan situs resmi pembayaran",
          body: "Halaman QRIS resmi tidak pernah meminta PIN atau OTP lewat situs yang dibuka dari tautan chat.",
        },
        brand: {
          name: "QRIS VERIFIKASI",
          tagline: "Layanan Merchant Terpadu",
          badge: "Verifikasi",
        },
        pageTitle: "Konfirmasi Pembayaran {{amount}}",
        intro:
          "Pembayaran pesanan {{order}} di {{merchant}} belum terverifikasi. Lengkapi data untuk menyelesaikan transaksi.",
        timer: {
          label: "Waktu verifikasi",
          value: "04:12",
          note: "Pesanan dibatalkan otomatis",
        },
        fields: [
          { label: "Merchant", value: "{{merchant}}", status: "Terverifikasi" },
          { label: "Nomor Pesanan", value: "{{order}}" },
          { label: "Nominal Pembayaran", value: "{{amount}}" },
          {
            label: "PIN M-Banking / E-Wallet (6 Digit)",
            value: "••••••",
            kind: "password",
            hint: "PIN hanya untuk transaksi yang Anda inisiasi sendiri.",
            danger: true,
            status: "Jangan Bagikan",
          },
          {
            label: "Kode OTP SMS",
            value: "Masukkan kode OTP",
            kind: "text",
            hint: "OTP adalah kunci otorisasi transaksi. Jangan pernah dibagikan.",
            danger: true,
          },
        ],
        primaryCta: "Verifikasi & Bayar {{amount}}",
        footnote: "Simulasi quishing QRIS · waspadain.id/simulasi-qris",
        simLabel: "Ini di dalam ruang simulasi",
        decision: {
          title: "Perangkap Terdeteksi",
          question: "Halaman meminta PIN dan OTP untuk \"verifikasi\". Apa tindakan Anda?",
          hint: "Pembayaran QRIS tidak pernah meminta PIN dan OTP di halaman web pihak ketiga.",
          choices: [
            {
              id: "submit",
              label: "Masukkan PIN & OTP",
              tone: "danger",
              next: null,
              verdict: "vulnerable",
              categories: ["data_rahasia"],
              feedback:
                "PIN dan OTP memberi penipu akses mentransfer saldo Anda. Tidak ada verifikasi merchant yang membutuhkannya.",
            },
            {
              id: "close",
              label: "Tutup halaman & laporkan",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Tutup halaman, periksa mutasi resmi, dan laporkan tautan QRIS palsu.",
            },
          ],
        },
      },
    ],
    variants: [
      {
        id: "v1",
        label: "Kopi Senja · Rp87.000",
        vars: {
          senderNumber: "+62 813-8899-1200",
          merchant: "Kopi Senja",
          order: "INV-2401",
          amount: "Rp87.000",
          domain: "qriss-verifikasi.online",
        },
      },
      {
        id: "v2",
        label: "Toko Berkah · Rp245.000",
        vars: {
          senderNumber: "+62 857-1122-8855",
          merchant: "Toko Berkah",
          order: "INV-7712",
          amount: "Rp245.000",
          domain: "qris-merchant.site",
        },
      },
      {
        id: "v3",
        label: "Laundry Kilat · Rp56.000",
        vars: {
          senderNumber: "+62 895-6610-3344",
          merchant: "Laundry Kilat",
          order: "INV-9032",
          amount: "Rp56.000",
          domain: "verifikasi-qris.xyz",
        },
      },
    ],
    redFlags: [
      {
        id: "rf-tautan",
        category: "format_tautan",
        label: "TAUTAN QRIS PALSU",
        title: "QRIS asli tidak diverifikasi lewat tautan chat.",
        body: [
          "Tautan {{domain}} bukan domain resmi penyedia pembayaran. Domain .online, .site, dan .xyz mudah disewa siapa saja.",
          "Penipu memanfaatkan kegagalan transaksi untuk membuat Anda memindai ulang kode QR atau tautan yang mereka kendalikan.",
        ],
        fact: "Pembayaran QRIS diverifikasi di aplikasi pembayaran resmi Anda, bukan lewat tautan yang dikirim merchant.",
      },
      {
        id: "rf-pin",
        category: "data_rahasia",
        label: "MINTA PIN & OTP",
        title: "PIN dan OTP bukan alat verifikasi merchant.",
        body: [
          "Tidak ada proses verifikasi merchant yang membutuhkan PIN atau OTP pelanggan.",
          "PIN dan OTP hanya dipakai untuk mengotorisasi transaksi keluar dari akun Anda.",
        ],
        fact: "Merchant hanya perlu melihat bukti pembayaran berhasil. Jangan pernah menyerahkan PIN atau OTP.",
        compare: {
          goodTitle: "Prosedur Sah",
          good: "Cek status pembayaran di aplikasi resmi dan tunjukkan bukti transaksi.",
          badTitle: "Trik Penipu",
          bad: "Meminta PIN dan OTP untuk \"menyelesaikan verifikasi\" transaksi.",
        },
      },
      {
        id: "rf-otoritas",
        category: "otoritas_palsu",
        label: "MENGATASNAMAKAN MERCHANT",
        title: "Nama merchant di chat belum tentu pemiliknya.",
        body: [
          "Penipu dapat memakai nama dan logo merchant untuk membuat pesan terlihat resmi.",
          "Nomor pengirim tidak sama dengan nomor resmi merchant yang Anda kenal.",
        ],
        fact: "Konfirmasi langsung ke merchant melalui kanal resmi yang Anda cari sendiri.",
      },
    ],
    bongkar: {
      sceneId: "chat",
      steps: [
        {
          id: "step-1",
          sceneId: "chat",
          flagIds: ["rf-tautan", "rf-otoritas"],
          title: "Tautan QRIS & nama merchant palsu",
          highlights: ["{{domain}}", "Admin {{merchant}}"],
        },
        {
          id: "step-2",
          sceneId: "browser",
          flagIds: ["rf-pin"],
          title: "Formulir pencurian PIN & OTP",
          highlights: ["PIN M-Banking", "Kode OTP"],
        },
      ],
    },
    takeaways: [
      "QRIS tidak diverifikasi ulang lewat tautan dari chat.",
      "Merchant tidak pernah membutuhkan PIN atau OTP pelanggan.",
      "Cek status pembayaran di aplikasi resmi dan laporkan tautan mencurigakan.",
    ],
    shareText:
      "Quishing QRIS: tautan verifikasi palsu meminta PIN dan OTP. Cek mutasi di aplikasi resmi, jangan ikuti tautan chat.",
  },
};
