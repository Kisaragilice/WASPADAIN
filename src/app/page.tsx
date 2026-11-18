import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Fingerprint,
  Gift,
  GraduationCap,
  KeyRound,
  Landmark,
  Link2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Radar,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { BrandWordmark } from "@/components/brand/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

const FEATURES = [
  {
    icon: ShieldAlert,
    title: "Simulasi multikanal",
    body: "WhatsApp, SMS, email, dan browser. Satu mesin, konfigurasi skenario yang bisa ditambah tanpa menulis ulang UI.",
    tone: "bg-brand-mint",
    iconTone: "bg-white/70 text-[#0B7A62]",
  },
  {
    icon: ScanSearch,
    title: "Mode Bongkar",
    body: "Bedah pesan baris demi baris: red flag, taktik psikologis, dan alasan mengapa jebakan itu bekerja.",
    tone: "bg-brand-blush",
    iconTone: "bg-white/70 text-[#B91C2D]",
  },
  {
    icon: Radar,
    title: "Radar modus",
    body: "Lima parameter kerentanan: tekanan waktu, umpan hadiah, otoritas palsu, format tautan, dan data rahasia.",
    tone: "bg-brand-lavender",
    iconTone: "bg-white/70 text-[#4C56A3]",
  },
  {
    icon: Brain,
    title: "KAB pre & post-test",
    body: "Dua belas butir pengetahuan, sikap, dan perilaku. Ukur perubahan sebelum dan sesudah berlatih.",
    tone: "bg-brand-butter",
    iconTone: "bg-white/70 text-[#8A6200]",
  },
];

const PATTERNS = [
  { icon: ShieldAlert, title: "Surat tilang .APK", tag: "Format berkas" },
  { icon: Gift, title: "Poin bank hangus", tag: "Umpan hadiah" },
  { icon: Landmark, title: "Pemadanan NPWP", tag: "Otoritas palsu" },
  { icon: Link2, title: "Resi paket palsu", tag: "Tautan" },
  { icon: Fingerprint, title: "Quishing QRIS", tag: "Kode QR" },
];

const STEPS = [
  {
    number: "01",
    title: "Isi pre-test",
    body: "Dapatkan garis dasar KAB dalam sekitar tiga menit.",
    icon: Brain,
  },
  {
    number: "02",
    title: "Latih refleks",
    body: "Pilih skenario, baca pesan sintetis, lalu putuskan.",
    icon: Target,
  },
  {
    number: "03",
    title: "Bongkar polanya",
    body: "Lihat red flag dan taktik yang membuat jebakan terasa masuk akal.",
    icon: ScanSearch,
  },
  {
    number: "04",
    title: "Ukur perubahan",
    body: "Bandingkan radar dan post-test, lalu ulangi area terlemah.",
    icon: Trophy,
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const primaryHref = user ? (user.role === "ADMIN" ? "/admin" : "/simulasi") : "/daftar";
  const secondaryHref = user ? "/kab" : "/masuk";

  return (
    <div className="gradient-cream min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-[#FBF8EF]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="WASPADAIN">
            <BrandWordmark markClassName="h-8 w-8" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi beranda">
            <a
              href="#fitur"
              className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-brand-ink/65 transition hover:bg-white hover:text-brand-ink"
            >
              Fitur
            </a>
            <a
              href="#cara"
              className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-brand-ink/65 transition hover:bg-white hover:text-brand-ink"
            >
              Cara kerja
            </a>
            <a
              href="#modus"
              className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-brand-ink/65 transition hover:bg-white hover:text-brand-ink"
            >
              Modus
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm" variant="dark">
                <Link href={primaryHref}>
                  Buka dasbor <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/masuk">Masuk</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/daftar">Daftar gratis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative pattern-soft">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-10 lg:pb-16 lg:pt-20">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" /> Latihan anti-modus digital
              </span>
              <h1 className="mt-4 text-[40px] font-extrabold leading-[1.01] tracking-[-0.045em] sm:text-[54px] lg:text-[60px]">
                Jangan tunggu
                <br />
                kena tipu baru
                <br />
                <span className="relative inline-block">
                  belajar.
                  <span className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-full bg-brand-butter sm:h-4" />
                </span>
              </h1>
              <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed text-brand-ink/65 sm:text-[15px]">
                Kenali pola jebakan penipu lewat simulasi yang aman. Ceritanya berganti-ganti,{" "}
                <span className="rounded bg-brand-blush px-1 font-semibold text-[#B91C2D]">
                  polanya itu-itu aja
                </span>
                . Semua data sintetis, tanpa mengirim pesan nyata.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Button asChild size="xl" className="min-w-[180px]">
                  <Link href={primaryHref}>
                    {user ? "Lanjutkan latihan" : "Mulai sekarang"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <Link href={secondaryHref}>
                    {user ? "Lihat instrumen KAB" : "Sudah punya akun"}
                  </Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[10.5px] font-semibold text-brand-ink/55">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Gratis untuk belajar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Tanpa data pribadi asli
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Bisa diulang
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
              <div className="absolute -left-3 top-10 hidden rotate-[-6deg] rounded-2xl bg-brand-butter p-3 shadow-card sm:block">
                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-[#7C5A00]">
                  <BellRing className="h-3 w-3" /> Tekanan waktu
                </p>
                <p className="mt-1 text-[10px] font-semibold text-[#7C5A00]/70">
                  &ldquo;Bayar sebelum pukul 12.00!&rdquo;
                </p>
              </div>
              <div className="mx-auto w-full max-w-[330px] rounded-[2.4rem] border-[6px] border-brand-ink bg-brand-ink p-2 shadow-phone">
                <div className="overflow-hidden rounded-[1.9rem] bg-[#F4F1E8]">
                  <div className="flex items-center justify-between bg-[#0B7A62] px-4 py-2 text-[9px] font-semibold text-white/90">
                    <span>09.41</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0B7A62] px-3 pb-2.5 text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold">+62 812-0000-0000</p>
                      <p className="text-[8px] text-white/60">tidak tersimpan</p>
                    </div>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="rounded-xl rounded-tl-sm bg-white p-2.5 text-[10px] leading-relaxed text-brand-ink/70 shadow-sm">
                      <p className="font-bold text-brand-ink">SURAT TILANG ELEKTRONIK</p>
                      <p className="mt-1">
                        Pelanggaran terdeteksi. Unduh dokumen dan bayar denda melalui tautan
                        berikut.
                      </p>
                      <p className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold text-primary underline decoration-primary/30">
                        <Link2 className="h-3 w-3" /> e-tilang-resmi.my.id
                      </p>
                      <p className="mt-1 rounded-lg bg-brand-blush px-2 py-1 text-[8.5px] font-bold text-[#B91C2D]">
                        Lampiran: Surat_Tilang.APK
                      </p>
                    </div>
                    <div className="ml-auto w-[86%] rounded-xl rounded-tr-sm bg-brand-mint p-2.5 text-[10px] text-[#0B5E54]">
                      Saya cek dulu ke aplikasi resmi, tidak lewat tautan ini.
                    </div>
                    <div className="rounded-xl border border-dashed border-primary/30 bg-white/60 p-2 text-[8.5px] font-semibold text-primary">
                      <ShieldCheck className="mr-1 inline h-3 w-3" />
                      Di sinilah latihan dimulai.
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 right-0 hidden rotate-[5deg] rounded-2xl bg-brand-lavender p-3 shadow-card sm:block">
                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-[#4C56A3]">
                  <Sparkles className="h-3 w-3" /> Radar terisi
                </p>
                <div className="mt-2 flex items-end gap-1">
                  {[40, 65, 82, 55, 74].map((value, index) => (
                    <span
                      key={index}
                      className="w-2.5 rounded-t-full bg-[#6E7BD6]"
                      style={{ height: `${value * 0.32}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-2 px-4 pb-10 sm:grid-cols-4 sm:px-6">
            {[
              { value: "5", label: "Skenario siap main", icon: ShieldCheck },
              { value: "16", label: "Variasi cerita sintetis", icon: Sparkles },
              { value: "5", label: "Parameter radar", icon: Radar },
              { value: "12", label: "Butir instrumen KAB", icon: Brain },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white bg-white/70 p-3.5 shadow-[0_6px_18px_-16px_rgba(16,27,45,.3)] backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-extrabold tracking-tight">{stat.value}</p>
                    <Icon className="h-4 w-4 text-primary/50" />
                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold text-brand-ink/55">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="fitur" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Bukan kuis biasa
            </p>
            <h2 className="mt-1.5 text-[28px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[36px]">
              Empat lapis latihan yang saling menguatkan
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-brand-ink/65 sm:text-[14px]">
              Dari mengenali pesan, membongkar taktik, sampai mengukur kebiasaan. Semua
              dalam satu alur yang bisa diulang.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-white bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft sm:p-5"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-[14.5px] font-extrabold leading-snug">{feature.title}</h3>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-brand-ink/65">
                    {feature.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="cara" className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:py-8">
          <div className="rounded-4xl bg-brand-ink p-5 text-white shadow-soft sm:p-7 lg:p-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                  Alur belajar
                </p>
                <h2 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-[34px]">
                  Empat langkah, satu kebiasaan baru
                </h2>
              </div>
              <Button asChild variant="soft">
                <Link href={primaryHref}>
                  {user ? "Buka dasbor" : "Coba alurnya"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="rounded-2xl bg-white/[0.07] p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[18px] font-extrabold text-white/15">{step.number}</span>
                    </div>
                    <p className="mt-3 text-[13px] font-extrabold text-white">{step.title}</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-white/65">{step.body}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[9.5px] text-white/55">
              <Clock3 className="h-3 w-3 text-emerald-300" /> Satu sesi inti bisa diselesaikan
              dalam sekitar 15–20 menit.
            </p>
          </div>
        </section>

        <section id="modus" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                Modus yang dilatih
              </p>
              <h2 className="mt-1.5 text-[28px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[36px]">
                Dekat dengan ponselmu, jauh dari aman
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-brand-ink/65">
                Skenario dibuat menyerupai pesan yang bisa masuk besok pagi: tilang, poin
                bank, pajak, kurir, dan QRIS. Semua nomor, domain, dan dokumen fiktif.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="safe">
                  <ShieldCheck className="h-3 w-3" /> 100% sandbox
                </Badge>
                <Badge variant="lavender">
                  <Mail className="h-3 w-3" /> Email
                </Badge>
                <Badge variant="secondary">
                  <Smartphone className="h-3 w-3" /> SMS
                </Badge>
                <Badge variant="warning">
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </Badge>
              </div>
              <Button asChild variant="outline" className="mt-4">
                <Link href={user ? "/simulasi/katalog" : "/daftar"}>
                  Lihat semua skenario <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {PATTERNS.map((pattern, index) => {
                const Icon = pattern.icon;
                return (
                  <div
                    key={pattern.title}
                    className={`rounded-3xl border border-white bg-white p-4 shadow-card ${
                      index === 4 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-cream text-primary">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-extrabold leading-snug">{pattern.title}</p>
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-brand-ink/50">
                          {pattern.tag}
                        </p>
                      </div>
                      {index === 4 ? (
                        <span className="ml-auto hidden rounded-full bg-brand-mint px-2.5 py-1 text-[9px] font-bold text-[#0B5E54] sm:inline-flex">
                          Baru
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:pb-16">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-brand-butter/80 p-5 md:col-span-2">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6C5200]">
                <LockKeyhole className="h-3.5 w-3.5" /> Privasi sejak desain
              </p>
              <h2 className="mt-1.5 text-[22px] font-extrabold leading-tight text-[#4A3900] sm:text-[26px]">
                Kami tidak meminta password, OTP, atau data pribadi asli.
              </h2>
              <p className="mt-2 max-w-xl text-[11.5px] leading-relaxed text-[#6C5200]/75">
                Simulasi tidak mengirim pesan, tidak menjalankan malware, dan tidak
                mengumpulkan kredensial. Semua nomor, akun, dan situs adalah data sintetis
                untuk pembelajaran.
              </p>
            </div>
            <div className="rounded-3xl border border-white bg-white p-5 shadow-card">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-primary">
                <BadgeCheck className="h-3.5 w-3.5" /> Untuk siapa?
              </p>
              <ul className="mt-2.5 space-y-2 text-[11px] font-semibold text-brand-ink/65">
                <li className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" /> Pelajar & mahasiswa
                </li>
                <li className="flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5 text-primary" /> Pengguna m-banking
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" /> Keluarga & komunitas
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
          <div className="relative overflow-hidden rounded-4xl bg-brand-mint p-6 text-center sm:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/30" />
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="relative mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[34px]">
              Jadilah perisai manusia, bukan korban berikutnya.
            </h2>
            <p className="relative mx-auto mt-2 max-w-xl text-[12px] leading-relaxed text-brand-ink/65 sm:text-[13px]">
              Mulai dari pre-test singkat, lalu ambil satu skenario hari ini. Pola yang
              kamu kenali hari ini bisa menyelamatkan tabunganmu besok.
            </p>
            <div className="relative mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild size="lg">
                <Link href={primaryHref}>
                  {user ? "Lanjutkan latihan" : "Daftar dan mulai"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={user ? "/kab" : "/masuk"}>Masuk ke akun</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/60 bg-white/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandWordmark markClassName="h-7 w-7" />
            <span className="text-[10px] text-brand-ink/50">Latihan anti-modus digital</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-semibold text-brand-ink/55">
            <Link href="/masuk" className="hover:text-brand-ink">
              Masuk
            </Link>
            <Link href="/daftar" className="hover:text-brand-ink">
              Daftar
            </Link>
            <a
              href="https://iasc.ojk.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-ink"
            >
              IASC OJK
            </a>
            <span>Data sintetis · Edukasi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
