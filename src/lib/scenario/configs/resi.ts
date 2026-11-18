import type { ScenarioSeed } from "../types";

export const resiScenario: ScenarioSeed = {
  slug: "resi-paket",
  title: "Resi Paket Tertahan & Bea Cukai Palsu",
  subtitle: "Manipulasi Resi Kurir (AWB)",
  description:
    "Chat mengaku dari kurir mengabarkan paket tertahan dan meminta Anda membuka tautan pelacakan palsu yang meminta biaya tambahan serta data identitas.",
  channel: "WHATSAPP",
  category: "Format Jebakan",
  difficulty: "SEDANG",
  level: 2,
  estimatedMinutes: 4,
  sortOrder: 4,
  badgeKey: "detektif-paket",
  config: {
    version: 1,
    channel: "WHATSAPP",
    appLabel: "WhatsApp",
    intro: {
      title: "Lacak Paket atau Jebakan?",
      mission:
        "Paket Anda sedang dalam pengiriman. Sebuah nomor mengaku kurir mengirim kabar bahwa paket tertahan. Periksa kanal pelacakannya.",
      tip: "Nomor resi (AWB) bisa dilihat siapa saja di label paket. Jangan jadikan nomor resi sebagai bukti identitas kurir.",
    },
    startSceneId: "chat",
    scenes: [
      {
        id: "chat",
        type: "whatsapp",
        label: "Chat kurir",
        contact: {
          name: "{{senderNumber}}",
          subtitle: "Admin {{courier}}",
          verification: "unknown",
        },
        encryptionNote: "Nomor tidak dikenal · Bukan kontak · Tidak ada grup bersama",
        messages: [
          { kind: "date", label: "HARI INI" },
          {
            kind: "incoming",
            text: "Halo Kak, paket dengan resi {{awb}} tertahan di {{warehouse}} karena alamat belum lengkap. Hari ini terakhir sebelum dikembalikan ke pengirim.",
            time: "13.05",
          },
          {
            kind: "incoming",
            text: "Silakan konfirmasi alamat dan selesaikan biaya pengiriman di https://{{domain}}/resi/{{awb}}",
            time: "13.06",
          },
          {
            kind: "warning",
            text: "Cek nomor resi hanya di aplikasi atau situs resmi kurir.",
          },
        ],
        composer: "Ketik pesan...",
        decision: {
          title: "Uji Refleks Keamanan",
          question: "Kurir meminta konfirmasi lewat tautan. Apa tindakan Anda?",
          hint: "Nomor resi mudah diketahui orang lain. Cek paket dari aplikasi resmi, bukan tautan chat.",
          choices: [
            {
              id: "open",
              label: "Buka tautan konfirmasi resi",
              tone: "danger",
              next: "browser",
              verdict: "vulnerable",
              categories: ["format_tautan", "otoritas_palsu"],
              feedback:
                "Tautan mengarah ke domain {{domain}}, bukan kanal resmi kurir. Data dan uang Anda bisa diambil di sana.",
            },
            {
              id: "app",
              label: "Lacak lewat aplikasi resmi kurir",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Buka aplikasi atau situs resmi kurir secara mandiri dan cocokkan nomor resi di sana.",
            },
            {
              id: "block",
              label: "Blokir & cek langsung ke agen kurir",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Hubungi agen atau layanan pelanggan resmi untuk memastikan status paket.",
            },
          ],
        },
      },
      {
        id: "browser",
        type: "browser",
        label: "Situs pelacakan palsu",
        url: "https://{{domain}}/resi/{{awb}}",
        warning: {
          title: "Domain bukan kanal resmi kurir",
          body: "Situs resmi kurir memakai domain perusahaannya sendiri. Domain {{domain}} adalah domain publik sewaan.",
        },
        brand: {
          name: "{{courier}}",
          tagline: "Layanan Pengiriman Nasional",
          badge: "Lacak Paket",
        },
        pageTitle: "Paket Anda Tertahan di {{warehouse}}",
        intro:
          "Selesaikan biaya bea cukai dan konfirmasi alamat agar paket {{awb}} dapat dikirim hari ini.",
        timer: {
          label: "Batas konfirmasi",
          value: "01:47:20",
          note: "Paket dikembalikan ke pengirim setelah waktu habis",
        },
        fields: [
          { label: "Nomor Resi (AWB)", value: "{{awb}}", status: "Ditemukan" },
          { label: "Biaya Bea Cukai", value: "{{fee}}", danger: true },
          {
            label: "Rekening Tujuan Pembayaran",
            value: "{{account}} a.n. {{accountName}}",
            hint: "Rekening pribadi, bukan rekening perusahaan kurir.",
            danger: true,
            status: "Rekening Pribadi",
          },
          {
            label: "Foto KTP Penerima",
            value: "Unggah KTP untuk verifikasi alamat",
            kind: "file",
            hint: "Data identitas tidak diperlukan untuk melacak paket.",
            danger: true,
          },
        ],
        primaryCta: "Bayar {{fee}} & Kirim Paket",
        footnote: "Halaman pelacakan paket · waspadain.id/simulasi-resi",
        simLabel: "Ini di dalam ruang simulasi",
        decision: {
          title: "Perangkap Terdeteksi",
          question:
            "Situs meminta transfer ke rekening pribadi dan foto KTP. Apa tindakan Anda?",
          hint: "Kurir resmi tidak menagih lewat rekening pribadi dengan tautan chat.",
          choices: [
            {
              id: "pay",
              label: "Transfer & unggah KTP",
              tone: "danger",
              next: null,
              verdict: "vulnerable",
              categories: ["umpan_hadiah", "tekanan_waktu", "data_rahasia"],
              feedback:
                "Uang Anda masuk ke rekening penipu, sementara KTP bisa dipakai membuka pinjaman atau akun ilegal.",
            },
            {
              id: "close",
              label: "Tutup halaman & verifikasi ke kurir resmi",
              tone: "safe",
              next: null,
              verdict: "safe",
              feedback:
                "Tepat. Jangan transfer, jangan unggah identitas, dan verifikasi resi lewat kanal resmi kurir.",
            },
          ],
        },
      },
    ],
    variants: [
      {
        id: "v1",
        label: "AWB 8821-4409-7712 · Rp12.500",
        vars: {
          senderNumber: "+62 812-2244-7788",
          courier: "Kurir Cepat Nusantara",
          awb: "AWB 8821-4409-7712",
          warehouse: "Gudang Bandar Lampung",
          domain: "cek-resi-paket.my.id",
          fee: "Rp12.500",
          account: "8820-1192-4410",
          accountName: "Rudi Hartono",
        },
      },
      {
        id: "v2",
        label: "AWB 1920-3388-5566 · Rp35.000",
        vars: {
          senderNumber: "+62 857-6611-2290",
          courier: "Lintas Paket Indonesia",
          awb: "AWB 1920-3388-5566",
          warehouse: "Gudang Jakarta Timur",
          domain: "lacak-lintas-paket.site",
          fee: "Rp35.000",
          account: "5270-1192-8812",
          accountName: "Siti Nurhaliza",
        },
      },
      {
        id: "v3",
        label: "AWB 7712-0098-4431 · Rp8.000",
        vars: {
          senderNumber: "+62 895-2200-1044",
          courier: "Nusa Kirim Express",
          awb: "AWB 7712-0098-4431",
          warehouse: "Gudang Surabaya",
          domain: "nusakirim-resi.xyz",
          fee: "Rp8.000",
          account: "9031-2245-7710",
          accountName: "Andi Saputra",
        },
      },
    ],
    redFlags: [
      {
        id: "rf-domain",
        category: "format_tautan",
        label: "TAUTAN PELACAKAN PALSU",
        title: "Domain resmi kurir tidak berakhiran .my.id atau .site.",
        body: [
          "Tautan pada chat mengarah ke {{domain}}, domain publik sewaan yang bisa dibeli siapa saja.",
          "Nomor resi AWB tercantum di label paket dan mudah difoto orang lain. Penipu menggunakannya agar pesan terlihat meyakinkan.",
        ],
        fact: "Selalu lacak paket dari aplikasi atau situs resmi kurir yang Anda buka sendiri, bukan dari tautan chat.",
      },
      {
        id: "rf-uang",
        category: "umpan_hadiah",
        label: "TAGIHAN & REKENING PRIBADI",
        title: "Kurir resmi tidak menagih ke rekening pribadi.",
        body: [
          "Permintaan biaya {{fee}} disertai ancaman paket dikembalikan hari ini menciptakan urgensi palsu.",
          "Rekening tujuan atas nama {{accountName}} adalah rekening pribadi, bukan rekening perusahaan kurir.",
        ],
        fact: "Pembayaran resmi kurir masuk ke rekening perusahaan atau kanal pembayaran resmi yang tercantum di aplikasi.",
      },
      {
        id: "rf-ktp",
        category: "data_rahasia",
        label: "FOTO KTP TIDAK DIPERLUKAN",
        title: "Melacak paket tidak butuh foto KTP.",
        body: [
          "Situs meminta foto KTP dengan alasan verifikasi alamat. Data identitas bisa disalahgunakan untuk pinjaman online atau pembukaan rekening.",
          "Jangan pernah mengunggah dokumen identitas ke situs yang tidak Anda buka secara mandiri.",
        ],
        fact: "Verifikasi alamat cukup melalui nomor resi dan kanal pelanggan resmi, tanpa mengirim foto KTP.",
      },
    ],
    bongkar: {
      sceneId: "chat",
      steps: [
        {
          id: "step-1",
          sceneId: "chat",
          flagIds: ["rf-domain", "rf-uang"],
          title: "Tautan resi palsu & urgensi buatan",
          highlights: ["{{domain}}", "{{awb}}"],
        },
        {
          id: "step-2",
          sceneId: "browser",
          flagIds: ["rf-ktp"],
          title: "Permintaan data identitas yang tidak perlu",
          highlights: ["Foto KTP Penerima", "Unggah KTP"],
        },
      ],
    },
    takeaways: [
      "Nomor resi mudah diketahui orang lain, jadi bukan bukti identitas.",
      "Lacak paket hanya dari aplikasi atau situs resmi kurir.",
      "Jangan transfer ke rekening pribadi atau mengunggah KTP demi paket.",
    ],
    shareText:
      "Modus resi paket tertahan: tautan pelacakan palsu meminta biaya dan foto KTP. Verifikasi hanya lewat aplikasi resmi kurir.",
  },
};
