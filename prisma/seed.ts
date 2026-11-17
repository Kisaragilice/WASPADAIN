import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { SCENARIO_SEEDS, assertScenarioConfig } from "../src/lib/scenario";
import { scoreKab } from "../src/lib/kab";

const prisma = new PrismaClient();

const MODULES = [
  {
    slug: "format-berkas",
    title: "Mengenali Format Berkas & APK Palsu",
    summary:
      "Surat resmi bukan aplikasi. Pelajari mengapa berkas .APK dari chat adalah jebakan dan bagaimana memeriksa lampiran dengan aman.",
    order: 1,
    readingMinutes: 5,
    sections: [
      {
        heading: "Dokumen vs aplikasi",
        body: "Surat tilang, tagihan, atau undangan resmi dikirim sebagai dokumen .PDF, .JPG, atau surat fisik. Berkas .APK adalah paket instalasi aplikasi Android, bukan dokumen. Begitu dipasang, aplikasi bisa meminta akses SMS, kontak, kamera, dan penyimpanan.",
        bullets: [
          "Dokumen resmi: .PDF atau .JPG.",
          "Aplikasi pihak ketiga: .APK — hanya dari toko aplikasi resmi.",
          "Berkas .APK dari nomor pribadi hampir selalu jebakan.",
        ],
      },
      {
        heading: "Izin berbahaya yang perlu diwaspadai",
        body: "Aplikasi palsu biasanya meminta izin akses SMS dan layanan aksesibilitas. Izin SMS dipakai untuk mencuri kode OTP m-banking, sedangkan aksesibilitas dapat membaca layar dan menekan tombol atas nama Anda.",
        bullets: [
          "Akses SMS oleh aplikasi tak dikenal = risiko OTP dicuri.",
          "Layanan aksesibilitas tidak diperlukan untuk aplikasi biasa.",
          "Tolak izin, hapus aplikasi, lalu pindai perangkat.",
        ],
      },
      {
        heading: "Langkah aman",
        body: "Jika menerima lampiran .APK, jangan unduh dan jangan buka. Blokir pengirim, laporkan pesannya, lalu verifikasi urusan tersebut melalui situs atau aplikasi resmi yang Anda buka sendiri.",
      },
    ],
  },
  {
    slug: "domain-tautan",
    title: "Membaca Domain & Tautan Aman",
    summary:
      "Domain adalah alamat asli sebuah situs. Kenali pola domain resmi, domain sewaan murah, dan tautan yang menyamar.",
    order: 2,
    readingMinutes: 6,
    sections: [
      {
        heading: "Baca dari kanan ke kiri",
        body: "Pada alamat web, bagian paling kanan setelah titik adalah domain tingkat atas. Pemerintah Indonesia memakai .go.id, lembaga pendidikan .ac.id, dan banyak bank memakai .co.id. Domain seperti klaim-poin-bank.my.id memakai .my.id, domain publik murah yang bisa disewa siapa saja.",
        bullets: [
          "pajak.go.id → resmi pemerintah.",
          "pemadanan-djp-online.com → domain komersial, bukan pemerintah.",
          "qriss-verifikasi.online → domain publik sewaan.",
        ],
      },
      {
        heading: "Jangan percaya teks tautan",
        body: "Teks tautan bisa menampilkan apa pun. Yang menentukan tujuan adalah alamat sebenarnya. Di ponsel, tekan lama tautan untuk melihat tujuan aslinya sebelum membuka. Jangan pernah mengetik data di halaman yang dibuka dari tautan pesan.",
      },
      {
        heading: "Tautan pendek dan QR",
        body: "Tautan pendek dan kode QR menyembunyikan alamat tujuan. Quishing adalah phishing melalui QR. Jika QR dikirim lewat chat atau ditempel di tempat umum, verifikasi dulu ke merchant atau kanal resmi.",
      },
      {
        heading: "Kebiasaan aman",
        body: "Buka aplikasi atau situs resmi secara mandiri, simpan bookmark kanal penting, dan gunakan autentikasi dua faktor. Jika ragu, berhenti dan cek dari kanal lain.",
      },
    ],
  },
  {
    slug: "tekanan-psikologis",
    title: "Rekayasa Sosial & Tekanan Emosi",
    summary:
      "Penipu memanipulasi rasa panik, takut, dan sayang kehilangan. Kenali taktiknya agar bisa berhenti sejenak.",
    order: 3,
    readingMinutes: 5,
    sections: [
      {
        heading: "Empat pemicu utama",
        body: "Rekayasa sosial bekerja pada emosi, bukan teknologi. Pola yang sering muncul adalah tekanan waktu, ancaman kerugian, umpan hadiah, dan rasa hormat kepada otoritas.",
        bullets: [
          "Tekanan waktu: 'konfirmasi dalam 15 menit atau diblokir'.",
          "Ancaman: denda, pembekuan rekening, paket dikembalikan.",
          "Umpan hadiah: poin hangus, saldo gratis, hadiah terbatas.",
          "Otoritas: mengaku polisi, bank, pajak, atau kurir resmi.",
        ],
      },
      {
        heading: "Mengapa kita mudah menurut",
        body: "Saat panik, otak beralih ke respons cepat dan melewati pemeriksaan teliti. Penipu sengaja menutup ruang berpikir dengan tenggat singkat dan instruksi yang terdengar resmi.",
      },
      {
        heading: "Jeda 10 detik",
        body: "Sebelum menekan tautan atau mentransfer uang, berhenti 10 detik dan tanyakan: siapa yang menghubungi, kanal apa yang dipakai, dan mengapa saya diminta bertindak sekarang? Verifikasi lewat kanal resmi yang Anda cari sendiri.",
      },
      {
        heading: "Lingkaran perlindungan",
        body: "Ceritakan pesan mencurigakan ke keluarga atau rekan sebelum bertindak. Perspektif kedua sering memutus rantai panik yang dibuat penipu.",
      },
    ],
  },
  {
    slug: "data-rahasia",
    title: "Kunci Emas: PIN, OTP, NIK & Selfie KTP",
    summary:
      "Data rahasia adalah kunci rekening dan identitas. Pahami siapa yang boleh memintanya—dan siapa yang tidak pernah boleh.",
    order: 4,
    readingMinutes: 6,
    sections: [
      {
        heading: "PIN dan OTP",
        body: "PIN dan OTP adalah kunci otorisasi transaksi keluar. Untuk menerima uang atau mencairkan hadiah, Anda hanya perlu nomor rekening. Tidak ada bank, merchant, atau layanan resmi yang meminta PIN dan OTP sekaligus.",
      },
      {
        heading: "Nama ibu kandung",
        body: "Nama gadis ibu kandung sering dipakai sebagai pertanyaan pemulihan akun dan verifikasi finansial. Instansi resmi tidak memintanya untuk pemutakhiran NIK atau NPWP melalui tautan email.",
      },
      {
        heading: "Foto KTP dan selfie",
        body: "Kombinasi foto KTP dan selfie dapat dipakai membuka rekening, dompet digital, atau pinjaman online atas nama Anda. Jangan unggah ke situs yang tidak Anda buka secara mandiri, dan jangan kirim lewat chat.",
      },
      {
        heading: "Privasi by design",
        body: "WASPADAIN memakai data sintetis dan tidak pernah merekam NIK, PIN, atau OTP asli. Prinsip ini sejalan dengan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi: kumpulkan data seminimal mungkin dan lindungi dengan aman.",
      },
    ],
  },
  {
    slug: "lapor-mitigasi",
    title: "SOP Darurat & Pelaporan IASC OJK",
    summary:
      "Kecepatan melapor menentukan peluang dana diselamatkan. Pelajari langkah darurat setelah data atau saldo Anda terancam.",
    order: 5,
    readingMinutes: 7,
    sections: [
      {
        heading: "SOP darurat 3 langkah",
        body: "Jika Anda sudah menyerahkan data atau menyadari transaksi palsu, bertindak cepat dan berurutan.",
        bullets: [
          "Isolasi: aktifkan mode pesawat, putus koneksi, dan hapus aplikasi mencurigakan. Ganti kata sandi dari perangkat lain yang bersih.",
          "Blokir layanan: hubungi bank atau penyedia dompet digital melalui nomor resmi untuk memblokir kartu, rekening, dan akses m-banking.",
          "Lapor: sampaikan laporan ke Indonesia Anti-Scam Centre (IASC) OJK melalui iasc.ojk.go.id dan buat laporan polisi bila perlu.",
        ],
      },
      {
        heading: "Mengapa cepat melapor penting",
        body: "OJK mencatat percepatan pelaporan meningkatkan peluang dana korban diselamatkan. Jangan menunggu sampai besok atau menunggu merasa malu. Simpan bukti chat, nomor rekening penipu, dan tangkapan layar transaksi.",
      },
      {
        heading: "Jangan menyalahkan korban",
        body: "Penipuan adalah kejahatan, bukan kesalahan moral korban. Umpan balik non-punitif membuat orang lebih berani melapor dan belajar. Dukungan keluarga serta komunitas mempercepat pemulihan.",
      },
      {
        heading: "Setelah insiden",
        body: "Pantau mutasi rekening, aktifkan notifikasi transaksi, dan periksa apakah identitas Anda dipakai untuk pinjaman. Simpan nomor kanal resmi bank, OJK 157, dan Kring Pajak 1500200.",
      },
    ],
  },
];

async function main() {
  for (const seed of SCENARIO_SEEDS) {
    assertScenarioConfig(seed);
    await prisma.scenario.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        subtitle: seed.subtitle,
        description: seed.description,
        channel: seed.channel,
        category: seed.category,
        difficulty: seed.difficulty,
        level: seed.level,
        estimatedMinutes: seed.estimatedMinutes,
        badgeKey: seed.badgeKey,
        variantCount: seed.config.variants.length,
        sortOrder: seed.sortOrder,
        config: seed.config as unknown as object,
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        subtitle: seed.subtitle,
        description: seed.description,
        channel: seed.channel,
        category: seed.category,
        difficulty: seed.difficulty,
        level: seed.level,
        estimatedMinutes: seed.estimatedMinutes,
        badgeKey: seed.badgeKey,
        variantCount: seed.config.variants.length,
        sortOrder: seed.sortOrder,
        config: seed.config as unknown as object,
      },
    });
  }

  for (const module of MODULES) {
    await prisma.educationModule.upsert({
      where: { slug: module.slug },
      update: {
        title: module.title,
        summary: module.summary,
        order: module.order,
        readingMinutes: module.readingMinutes,
        sections: module.sections,
      },
      create: module,
    });
  }

  const passwordHash = await hash("Waspada#2026", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@waspadain.id" },
    update: { role: "ADMIN" },
    create: {
      name: "Admin Waspadain",
      email: "admin@waspadain.id",
      passwordHash,
      role: "ADMIN",
      xp: 120,
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: "warga@waspadain.id" },
    update: {},
    create: {
      name: "Rani Prameswari",
      email: "warga@waspadain.id",
      passwordHash,
      xp: 145,
    },
  });

  const demoAttempts = await prisma.simulationAttempt.count({
    where: { userId: demo.id },
  });

  if (demoAttempts === 0) {
    const etle = await prisma.scenario.findUnique({ where: { slug: "etle-apk" } });
    const sms = await prisma.scenario.findUnique({ where: { slug: "sms-poin-bank" } });
    if (etle && sms) {
      await prisma.simulationAttempt.create({
        data: {
          userId: demo.id,
          scenarioId: etle.id,
          variantIndex: 0,
          status: "COMPLETED",
          outcome: "SAFE",
          score: 100,
          xpEarned: 60,
          redFlagsIdentified: 3,
          redFlagsTotal: 3,
          vulnerableCategories: [],
          startedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
        },
      });
      await prisma.simulationAttempt.create({
        data: {
          userId: demo.id,
          scenarioId: sms.id,
          variantIndex: 1,
          status: "COMPLETED",
          outcome: "VULNERABLE",
          score: 0,
          xpEarned: 15,
          redFlagsIdentified: 0,
          redFlagsTotal: 2,
          vulnerableCategories: ["umpan_hadiah", "data_rahasia"],
          startedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
        },
      });
      await prisma.userBadge.createMany({
        data: [
          { userId: demo.id, badgeKey: "detektif-apk", scenarioId: etle.id },
          { userId: demo.id, badgeKey: "pelapor-cepat", scenarioId: etle.id },
        ],
        skipDuplicates: true,
      });
    }

    const answers = {
      k1: false,
      k2: false,
      k3: true,
      k4: false,
      a1: 2,
      a2: 4,
      a3: 2,
      a4: 5,
      b1: 3,
      b2: 2,
      b3: 4,
      b4: 3,
    };
    const scored = scoreKab(answers);
    await prisma.assessment.create({
      data: {
        userId: demo.id,
        type: "PRE",
        answers,
        knowledge: scored.knowledge,
        attitude: scored.attitude,
        behavior: scored.behavior,
        kabIndex: scored.kabIndex,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
    });

    const firstModule = await prisma.educationModule.findUnique({
      where: { slug: "format-berkas" },
    });
    if (firstModule) {
      await prisma.moduleProgress.create({
        data: { userId: demo.id, moduleId: firstModule.id },
      });
    }
  }

  console.log("Seed selesai:", {
    admin: admin.email,
    demo: demo.email,
    scenarios: SCENARIO_SEEDS.length,
    modules: MODULES.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
