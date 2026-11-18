import type { ScenarioSeed } from "../types";

export const emailTaxScenario: ScenarioSeed = {
  slug: "pajak-coretax",
  title: "Pemblokiran NPWP & Tagihan Pajak",
  subtitle: "Modus Pemblokiran NPWP & Tagihan Pajak",
  description:
    "Email mengaku dari Direktorat Jenderal Pajak mengancam memblokir NPWP dan mendenda Rp5.000.000, lalu meminta NIK, nama ibu kandung, dan selfie KTP.",
  channel: "EMAIL",
  category: "Identitas Palsu",
  difficulty: "SULIT",
  level: 1,
  estimatedMinutes: 5,
  sortOrder: 3,
  badgeKey: "penjaga-identitas",
  config: {
    version: 1,
    channel: "EMAIL",
    appLabel: "Email",
    intro: {
      title: "Bedah Email Pajak Palsu",
      mission:
        "Sebuah email berlabel peringatan terakhir masuk ke kotak masuk. Periksa alamat pengirim aslinya, bukan hanya nama tampilannya.",
      tip: "Nama pengirim bisa diketik bebas. Alamat email dan domain adalah bukti yang lebih sulit dipalsukan.",
    },
    startSceneId: "email",
    scenes: [
      {
        id: "email",
        type: "email",
        label: "Kotak masuk",
        fromName: "Direktorat Jenderal Pajak RI",
        fromAddress: "admin-verifikasi@{{domain}}",
        senderFlag: "domain palsu",
        to: "yth.wajibpajak@gmail.com",
        subject: "[PERINGATAN TERAKHIR] Pemblokiran NPWP & Denda Pajak",
        preview:
          "Berdasarkan rekonsiliasi data perpajakan terpadu Coretax 2026, NIK dan NPWP Anda terindikasi belum sinkron…",
        time: "09:41",
        blocks: [
          { type: "paragraph", text: "Yth. Wajib Pajak Terdaftar," },
          {
            type: "paragraph",
            text: "Berdasarkan rekonsiliasi data perpajakan terpadu Coretax 2026, NIK dan NPWP Anda terindikasi belum sinkron dengan basis data kependudukan nasional.",
          },
          {
            type: "alert",
            title: "PERHATIAN SEGERA",
            text: "Akun Anda akan DIBEKUKAN otomatis dalam {{duration}} dan dikenakan denda administrasi sebesar {{penalty}} sesuai regulasi yang berlaku.",
          },
          {
            type: "paragraph",
            text: "Untuk menghindari pembekuan rekening bank dan sanksi denda, segera lakukan validasi dan sinkronisasi data melalui portal resmi pemadanan di bawah ini:",
          },
          { type: "cta", text: "Sinkronisasi NIK & NPWP Sekarang" },
          {
            type: "signature",
            text: "Hormat kami,\nDirektorat Jenderal Pajak RI\nKementerian Keuangan Republik Indonesia",
          },
        ],
        decision: {
          title: "Uji Refleks Keamanan",
          question: "Apa tindakan yang paling aman untuk email ini?",
          hint: "Perhatikan alamat email pengirim dan konsekuensi yang diancamkan.",
          choices: [
            {
              id: "open",
              label: "Buka Tautan (Pelajari Modusnya)",
              tone: "danger",
              next: "browser",
              verdict: "vulnerable",
              categories: ["otoritas_palsu", "format_tautan", "tekanan_waktu"],
              feedback:
                "Tautan membawa Anda ke replika portal pajak di domain {{domain}}, bukan situs resmi pemerintah.",
            },
            {
              id: "report",
              label: "Waspada & Laporkan Email Phishing",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Laporkan sebagai phishing dan verifikasi langsung di djponline.pajak.go.id tanpa lewat tautan email.",
            },
            {
              id: "manual",
              label: "Cek mandiri di djponline.pajak.go.id",
              tone: "neutral",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Buka portal resmi secara mandiri, tanpa mengklik tautan dari email.",
            },
          ],
        },
      },
      {
        id: "browser",
        type: "browser",
        label: "Replika portal pajak",
        url: "https://{{domain}}",
        warning: {
          title: "Peringatan keamanan",
          body: "Domain bukan situs resmi pemerintah! Domain berakhiran .com, bukan .go.id.",
        },
        brand: {
          name: "PORTAL PEMADANAN PAJAK NASIONAL",
          tagline: "DIREKTORAT JENDERAL PAJAK REPUBLIK INDONESIA",
          badge: "SIMULASI",
        },
        pageTitle: "Formulir Pemutakhiran Data Wajib Pajak",
        intro:
          "Lengkapi data otentikasi di bawah ini untuk membatalkan sanksi denda {{penalty}}.",
        timer: {
          label: "Sisa Waktu Pembatalan Denda",
          value: "23:48:12",
          note: "Sebelum pemblokiran permanen NIK & NPWP",
        },
        fields: [
          { label: "Nomor Induk Kependudukan (NIK 16 Digit)", value: "{{nik}}", status: "Terisi" },
          { label: "Nomor Pokok Wajib Pajak (NPWP 15/16 Digit)", value: "{{npwp}}", status: "Terisi" },
          {
            label: "Nama Gadis Ibu Kandung",
            value: "{{motherName}}",
            kind: "text",
            hint: "Wajib untuk verifikasi perbankan pajak. Nama ibu kandung adalah kunci pemulihan rekening bank & otentikasi finansial!",
            danger: true,
            status: "Kritis",
          },
          {
            label: "Upload Foto KTP & Selfie Wajah",
            value: "ktp_dan_selfie_verifikasi.jpg",
            kind: "file",
            hint: "2.4 MB · Gambar Dokumen Identitas. Data biometrik siap disedot penipu.",
            danger: true,
          },
        ],
        primaryCta: "Kirim & Batalkan Denda {{penalty}}",
        footnote: "Portal Pemadanan Pajak Nasional · waspadain.id/simulasi-browser-pajak",
        simLabel: "Ini di dalam ruang simulasi",
        decision: {
          title: "Perangkap Pencurian Identitas",
          question:
            "Formulir meminta nama ibu kandung dan selfie KTP. Apa tindakan Anda?",
          hint: "Instansi resmi tidak meminta nama ibu kandung untuk pemutakhiran NIK.",
          choices: [
            {
              id: "submit",
              label: "Kirim data & batalkan denda",
              tone: "danger",
              next: null,
              verdict: "vulnerable",
              categories: ["data_rahasia"],
              feedback:
                "Nama ibu kandung dan selfie KTP adalah kunci emas untuk membobol m-banking dan pinjaman online.",
            },
            {
              id: "close",
              label: "Tutup formulir & laporkan",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Pemutakhiran NPWP resmi hanya di djponline.pajak.go.id tanpa perantara tautan email.",
            },
          ],
        },
      },
    ],
    variants: [
      {
        id: "v1",
        label: "Denda Rp5.000.000 · 24 jam",
        vars: {
          domain: "pemadanan-djp-online.com",
          penalty: "Rp5.000.000",
          duration: "24 jam",
          nik: "3201048291030002",
          npwp: "09.231.849.2-402.000",
          motherName: "Siti Aminah",
        },
      },
      {
        id: "v2",
        label: "Denda Rp2.500.000 · 12 jam",
        vars: {
          domain: "validasi-npwp-go.id",
          penalty: "Rp2.500.000",
          duration: "12 jam",
          nik: "3171045892019001",
          npwp: "09.254.891.0-021.000",
          motherName: "Dewi Kartika",
        },
      },
      {
        id: "v3",
        label: "Denda Rp10.000.000 · 48 jam",
        vars: {
          domain: "coretax-pemadanan.site",
          penalty: "Rp10.000.000",
          duration: "48 jam",
          nik: "3374012203880003",
          npwp: "07.882.110.3-503.000",
          motherName: "Ratna Wulandari",
        },
      },
    ],
    redFlags: [
      {
        id: "rf-catut",
        category: "otoritas_palsu",
        label: "CATUT NAMA INSTANSI",
        title: "Nama pengirim bisa palsu, alamat email tidak bohong.",
        body: [
          "Nama pengirim \"Direktorat Jenderal Pajak RI\" bisa diketik bebas siapa saja saat mendaftar akun email. Tapi perhatikan alamat email aslinya: admin-verifikasi@{{domain}}.",
          "Email resmi pemerintah selalu berakhiran domain .go.id (contoh: @pajak.go.id atau @kemenkeu.go.id). Email penipu memakai domain komersial umum .com, .id, atau web hosting publik berbiaya murah.",
        ],
        fact: "Instansi pemerintah RI tidak pernah menggunakan email berekstensi .com untuk urusan administrasi resmi kenegaraan.",
        compare: {
          goodTitle: "Email Resmi Pemerintah",
          good: "Selalu berakhiran domain .go.id, misalnya @pajak.go.id atau @kemenkeu.go.id.",
          badTitle: "Email Penipu / Phishing",
          bad: "Menggunakan domain komersial umum .com, .id, atau web hosting publik berbiaya murah.",
        },
      },
      {
        id: "rf-panen",
        category: "data_rahasia",
        label: "PANEN DATA PRIBADI",
        title: "Jangan pernah serahkan nama ibu kandung & selfie KTP.",
        body: [
          "Nama gadis ibu kandung dan foto selfie memegang KTP adalah kunci emas keamanan perbankan, dompet digital, dan pinjaman online.",
          "Sekali diserahkan, penipu bisa membobol akun atau meminjam uang atas nama Anda.",
        ],
        fact: "Pemutakhiran NPWP resmi hanya dilakukan di djponline.pajak.go.id secara mandiri, tanpa perantara link chat atau email.",
        compare: {
          goodTitle: "Prosedur Valid",
          good: "Pemutakhiran NPWP resmi hanya di djponline.pajak.go.id secara mandiri.",
          badTitle: "Trik Licik",
          bad: "Menakut-nakuti dengan denda Rp5 juta agar korban panik dan buru-buru mengirim data.",
        },
      },
      {
        id: "rf-denda",
        category: "tekanan_waktu",
        label: "ANCAMAN DENDA & TENGGAT",
        title: "Denda mendadak adalah alat pembuat panik.",
        body: [
          "Ancaman pembekuan {{duration}} dan denda {{penalty}} dirancang agar Anda berhenti berpikir dan langsung mengisi formulir.",
          "Instansi resmi tidak menagih denda melalui email tak diminta dengan tautan formulir data pribadi.",
        ],
        fact: "Jika ragu, hubungi Kring Pajak 1500200 atau datang ke kantor pelayanan pajak terdekat.",
      },
    ],
    bongkar: {
      sceneId: "email",
      steps: [
        {
          id: "step-1",
          sceneId: "email",
          flagIds: ["rf-catut", "rf-denda"],
          title: "Catut nama instansi & tekanan denda",
          highlights: ["{{domain}}", "{{penalty}}", "{{duration}}"],
        },
        {
          id: "step-2",
          sceneId: "browser",
          flagIds: ["rf-panen"],
          title: "Pembedahan formulir panen identitas",
          highlights: ["Nama Gadis Ibu Kandung", "Upload Foto KTP & Selfie Wajah"],
        },
      ],
    },
    takeaways: [
      "Periksa alamat email asli; domain instansi pemerintah berakhiran .go.id.",
      "Nama ibu kandung dan selfie KTP adalah kunci emas data pribadi.",
      "Urusan pajak diverifikasi mandiri lewat djponline.pajak.go.id atau Kring Pajak 1500200.",
    ],
    shareText:
      "Email \"pemblokiran NPWP\" dari domain .com adalah phishing. Jangan kirim NIK, nama ibu kandung, atau selfie KTP.",
  },
};
