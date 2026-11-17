import type { ScenarioSeed } from "../types";

export const etleScenario: ScenarioSeed = {
  slug: "etle-apk",
  title: "Surat Tilang ETLE (.APK Palsu)",
  subtitle: "Modus Surat Tilang Elektronik",
  description:
    "Pesan WhatsApp yang mengaku dari kepolisian mengirim \"surat tilang\" berformat .APK dan mengancam memblokir STNK dalam hitungan menit.",
  channel: "WHATSAPP",
  category: "Format Jebakan",
  difficulty: "MUDAH",
  level: 1,
  estimatedMinutes: 4,
  sortOrder: 1,
  badgeKey: "detektif-apk",
  config: {
    version: 1,
    channel: "WHATSAPP",
    appLabel: "WhatsApp",
    intro: {
      title: "Deteksi Phishing APK",
      mission:
        "Sebuah notifikasi baru saja masuk ke smartphone simulasi. Buka pesan WhatsApp dan periksa pengirimnya sebelum bertindak.",
      tip: "Polri dan Kejaksaan tidak pernah mengirim surat tilang berupa berkas .APK melalui nomor WhatsApp pribadi.",
    },
    startSceneId: "home",
    scenes: [
      {
        id: "home",
        type: "phone-home",
        notification: {
          app: "WhatsApp",
          sender: "Kejaksaan & Polantas ETLE",
          title: "Kejaksaan & Polantas ETLE",
          body: "Selamat siang. Kendaraan Anda terekam melanggar batas kecepatan di {{location}}. Surat tilang dan…",
          time: "sekarang",
          unread: 1,
        },
        tip: {
          title: "Tahukah Anda?",
          tag: "Modus APK",
          body: "Polri dan Kejaksaan tidak pernah mengirimkan surat konfirmasi tilang fisik maupun digital berformat .APK melalui nomor WhatsApp pribadi. Format dokumen resmi adalah .PDF, .JPG, atau surat fisik.",
        },
        action: {
          id: "open",
          label: "Buka ruang obrolan",
          next: "chat",
        },
      },
      {
        id: "chat",
        type: "whatsapp",
        contact: {
          name: "{{senderNumber}}",
          subtitle: "{{senderName}}",
          verification: "unknown",
        },
        encryptionNote: "Nomor tidak dikenal · Indonesia · Bukan kontak",
        messages: [
          { kind: "date", label: "HARI INI" },
          {
            kind: "incoming",
            text: "Selamat siang Bapak/Ibu. Kendaraan Anda terekam kamera ETLE {{violation}} di {{location}}. Jika tidak dikonfirmasi dalam {{deadline}}, STNK akan diblokir otomatis.",
            time: "{{time}}",
          },
          {
            kind: "file",
            fileName: "{{fileName}}",
            fileType: "APK",
            fileSize: "2.8 MB",
            note: "Silakan unduh dan buka aplikasi bukti foto pelanggaran di atas.",
            time: "{{timeNext}}",
            danger: true,
          },
          {
            kind: "warning",
            text: "Waspada: Polisi tidak pernah mengirim tilang berformat .APK!",
          },
        ],
        composer: "Ketik pesan...",
        decision: {
          title: "Uji Refleks Keamanan",
          question: "Pesan ini mengancam STNK diblokir. Apa tindakan Anda?",
          hint: "Periksa nomor pengirim, jenis berkas, dan kanal resmi sebelum menekan apa pun.",
          choices: [
            {
              id: "download",
              label: "Unduh & buka berkas .APK",
              tone: "danger",
              next: "permission",
              verdict: "vulnerable",
              feedback:
                "Berkas .APK adalah aplikasi yang bisa meminta izin berbahaya, bukan surat tilang. Membukanya membuka jalan penyadapan SMS.",
            },
            {
              id: "block",
              label: "Blokir & laporkan nomor",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Nomor tak dikenal yang mengirim .APK dan mendesak Anda harus diblokir serta dilaporkan.",
            },
            {
              id: "verify",
              label: "Cek kanal resmi ETLE tanpa membuka tautan",
              tone: "neutral",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Tilang ETLE diverifikasi lewat kanal resmi seperti etle-pmj.info, bukan lewat berkas dari chat pribadi.",
            },
          ],
        },
      },
      {
        id: "permission",
        type: "dialog",
        label: "Peringatan izin sistem",
        appName: "Surat Tilang ETLE",
        permissionTitle:
          "Izinkan 'Surat Tilang ETLE' mengakses dan membaca SMS Anda?",
        permissionBody:
          "Aplikasi ini meminta izin untuk menerima, membaca, dan mengirim pesan SMS.",
        decision: {
          title: "Izin sistem",
          question: "Aplikasi tak dikenal meminta akses SMS. Apa yang Anda pilih?",
          choices: [
            {
              id: "allow",
              label: "IZINKAN",
              tone: "danger",
              next: null,
              verdict: "vulnerable",
              feedback:
                "Izin SMS memberi aplikasi palsu akses ke kode OTP m-banking Anda. Ini adalah titik pencurian saldo.",
            },
            {
              id: "deny",
              label: "TOLAK",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Izin berhasil ditolak. Namun berkas .APK tetap tidak boleh diunduh sejak awal — pertahankan kebiasaan ini.",
            },
          ],
        },
      },
    ],
    variants: [
      {
        id: "v1",
        label: "Tol Dalam Kota · 15 menit",
        vars: {
          senderNumber: "+62 857-9900-1122",
          senderName: "~Polantas Tilang ETLE",
          violation: "melanggar batas kecepatan",
          location: "Tol Dalam Kota",
          deadline: "15 menit",
          fileName: "Surat-Tilang-ETLE-Resmi.apk",
          time: "11.42",
          timeNext: "11.43",
        },
      },
      {
        id: "v2",
        label: "Jl. Sudirman · 1x24 jam",
        vars: {
          senderNumber: "+62 821-4990-2811",
          senderName: "Layanan ETLE Presisi",
          violation: "melanggar marka jalan",
          location: "Jl. Sudirman",
          deadline: "1x24 jam",
          fileName: "tilang-elektronik-2024.apk",
          time: "10.14",
          timeNext: "10.15",
        },
      },
      {
        id: "v3",
        label: "Cakung · hari ini",
        vars: {
          senderNumber: "+62 813-2277-9001",
          senderName: "Petugas Penindakan Lapangan",
          violation: "melebihi batas kecepatan maksimal",
          location: "Tol Cakung",
          deadline: "30 menit",
          fileName: "bukti-pelanggaran-etle.apk",
          time: "09.41",
          timeNext: "09.42",
        },
      },
      {
        id: "v4",
        label: "Bandung · 2 jam",
        vars: {
          senderNumber: "+62 895-6100-7788",
          senderName: "Korlantas ETLE Notification",
          violation: "melanggar lampu merah",
          location: "Simpang Dago, Bandung",
          deadline: "2 jam",
          fileName: "Surat_Panggilan_ETLE.apk",
          time: "14.08",
          timeNext: "14.09",
        },
      },
    ],
    redFlags: [
      {
        id: "rf-waktu",
        category: "tekanan_waktu",
        label: "TEKANAN WAKTU & ANCAMAN",
        title: "Batas waktu bikin panik, bukan teliti.",
        body: [
          "Penipu sengaja mengancam blokir STNK dalam {{deadline}} agar Anda panik.",
          "Saat panik, pikiran rasional teralihkan dan kita cenderung langsung menurut tanpa mengecek kebenarannya.",
        ],
        fact: "Kepolisian dan Samsat tidak pernah memblokir STNK via chat WhatsApp mendadak tanpa surat tilang fisik atau proses verifikasi resmi.",
      },
      {
        id: "rf-otoritas",
        category: "otoritas_palsu",
        label: "CATUT NAMA INSTANSI",
        title: "Nama pengirim bisa palsu, nomornya tidak resmi.",
        body: [
          "Foto profil dan nama \"Polantas ETLE\" dapat diganti siapa saja.",
          "Nomor pribadi +62 bukan kanal resmi pemberitahuan tilang. Instansi resmi memakai kanal terverifikasi dan situs .go.id.",
        ],
        fact: "Verifikasi tilang hanya melalui kanal resmi ETLE, misalnya etle-pmj.info, atau datang ke kantor Samsat.",
      },
      {
        id: "rf-apk",
        category: "format_tautan",
        label: "JEBAKAN FILE .APK",
        title: "APK itu aplikasi, bukan dokumen tilang.",
        body: [
          "Bukti foto atau surat resmi kepolisian berformat .PDF atau .JPG, bukan file instalasi.",
          "File .APK adalah aplikasi mentah yang sengaja dipasang untuk menyadap isi HP, termasuk SMS OTP m-banking.",
        ],
        fact: "Berkas .APK dari nomor tak dikenal tidak boleh dibuka. Hapus pesan, blokir nomor, lalu laporkan.",
        compare: {
          goodTitle: "Format Dokumen Sah",
          good: ".PDF, .JPG, atau surat fisik via pos tercatat resmi.",
          badTitle: "Berbahaya & Modus Penipuan",
          bad: ".APK — aplikasi pengintai yang mencuri SMS, token OTP, dan data perbankan.",
        },
      },
    ],
    bongkar: {
      sceneId: "chat",
      steps: [
        {
          id: "step-1",
          sceneId: "chat",
          flagIds: ["rf-waktu", "rf-otoritas"],
          title: "Tekanan waktu & pencatutan instansi",
          highlights: ["{{deadline}}", "STNK akan diblokir otomatis", "{{senderName}}"],
        },
        {
          id: "step-2",
          sceneId: "chat",
          flagIds: ["rf-apk"],
          title: "Jebakan berkas .APK",
          highlights: ["{{fileName}}", ".APK"],
        },
      ],
    },
    takeaways: [
      "Surat tilang resmi tidak dikirim sebagai .APK lewat WhatsApp pribadi.",
      "Ancaman blokir dalam hitungan menit adalah alat pembuat panik.",
      "Verifikasi ETLE lewat kanal resmi, bukan tautan atau berkas dari chat.",
    ],
    shareText:
      "Waspada! Tilang ETLE palsu dikirim sebagai .APK lewat WhatsApp. Jangan unduh, blokir, dan laporkan.",
  },
};
