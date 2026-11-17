# WASPADAIN

WASPADAIN adalah aplikasi latihan anti-modus penipuan digital: simulasi multikanal, Mode Bongkar, radar kerentanan, modul edukasi, serta pengukuran KAB (pengetahuan, sikap, perilaku) pre-test dan post-test. Seluruh pesan, nomor, domain, dan dokumen adalah **data sintetis**; aplikasi tidak mengirim pesan nyata, tidak menjalankan malware, dan tidak meminta kredensial asli.

## Stack

- Next.js 15 App Router + TypeScript strict
- Tailwind CSS 3 + shadcn-style primitives (Radix UI)
- Framer Motion, Zustand
- PostgreSQL 16 + Prisma ORM
- Zod untuk validasi
- Sesi opaque berbasis database (cookie HttpOnly, token di-HMAC dengan `AUTH_SECRET`)
- Docker Compose untuk database + aplikasi

## Menjalankan secara lokal

Prasyarat: Node.js 22+, npm, PostgreSQL 16 (atau Docker).

```bash
cp .env.example .env
# sesuaikan DATABASE_URL dan AUTH_SECRET (minimal 16 karakter, gunakan acak di produksi)

docker compose up -d db
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Buka <http://localhost:3000>.

### Menjalankan seluruh stack dengan Docker

```bash
AUTH_SECRET="$(openssl rand -hex 32)" docker compose up -d --build
```

Aplikasi berjalan di <http://localhost:3000>. Container aplikasi otomatis menjalankan `prisma migrate deploy` dan seed idempoten saat start.

### Akun demo

| Peran | Email                | Kata sandi     |
| ----- | -------------------- | -------------- |
| Warga | `warga@waspadain.id` | `Waspada#2026` |
| Admin | `admin@waspadain.id` | `Waspada#2026` |

> Ganti kata sandi akun demo sebelum deployment publik.

## Perintah penting

```bash
npm run dev            # server pengembangan
npm run build          # prisma generate + build produksi
npm run start          # server produksi
npm run lint           # ESLint (Next core-web-vitals + TypeScript)
npm run typecheck      # tsc --noEmit
npm run db:migrate     # prisma migrate dev
npm run db:deploy      # prisma migrate deploy
npm run db:seed        # seed skenario, modul, akun demo, data contoh
npm run db:studio      # Prisma Studio
npm run test:flow      # uji alur HTTP end-to-end (butuh server berjalan)
npm run test:scenarios # selesaikan kelima skenario lewat jalur aman
npm run test:responsive # cek overflow 375/768/1440 + screenshot (butuh server + Playwright)
npm run test:interactive # uji klik simulator + Mode Bongkar + console errors
```

Untuk uji browser, pasang browser Playwright sekali:

```bash
npx playwright install chromium
```

Jalankan server produksi di port 3100 agar skrip memakai URL default:

```bash
PORT=3100 npm start
BASE_URL=http://localhost:3100 npm run test:flow
```

Screenshot uji disimpan di `/tmp/opencode/waspadain-shots`.

## Fitur yang tersedia

- **Landing publik** dengan alur, pratinjau modus, dan CTA yang berfungsi.
- **Autentikasi** daftar/masuk/keluar, validasi server, sesi database, perlindungan rute middleware, dan RBAC (`USER`/`ADMIN`).
- **Pre-test & post-test KAB** 12 butir (4 pengetahuan, 4 sikap, 4 perilaku), skoring 0–100, riwayat, XP, dan gating post-test (pre-test + minimal satu simulasi selesai).
- **Katalog skenario** dengan filter kanal, kategori, kesulitan, pencarian, dan progres per skenario.
- **5 skenario, 16 variasi**: tilang ETLE `.APK`, poin bank hangus, pemadanan NPWP, resi paket, dan quishing QRIS.
- **Satu mesin simulasi** dengan scene `phone-home`, `whatsapp`, `sms`, `email`, `browser`, dan `dialog`; konten berasal dari konfigurasi JSON bertipe.
- **Mode Bongkar** langkah-demi-langkah: red flag, preview layar, fakta resmi, dan inti pertahanan.
- **Halaman hasil** dengan skor, XP, red flag, keputusan, dampak radar, dan rekomendasi berikutnya.
- **Radar modus** lima parameter (tekanan waktu, umpan hadiah, otoritas palsu, format tautan, data rahasia), perbandingan KAB, dan SOP darurat.
- **XP, enam pangkat, sembilan lencana**, riwayat, statistik, refleks cepat.
- **Lima modul edukasi** dengan penandaan tuntas dan XP.
- **Profil** dengan riwayat simulasi/KAB, lencana, peringkat pengguna, ubah nama/kata sandi, dan logout.
- **Panel admin** untuk statistik agregat, percobaan terbaru, publikasi skenario, serta edit metadata (judul, deskripsi, kesulitan, level, estimasi menit).

## Arsitektur

```
src/
  app/
    (auth)/                 # /masuk, /daftar
    (app)/                  # rute terlindungi: simulasi, modul, radar, kab, profil, admin, hasil
    api/                    # Route Handlers: auth, attempts, assessments, modules, reflex, account, admin
    page.tsx                # landing publik
  components/
    admin/ auth/ bongkar/ brand/ layout/ simulator/ ui/
  lib/
    scenario/               # tipe, registry, 5 konfigurasi skenario, pertanyaan refleks
    attempt.ts              # state machine attempt, skoring, XP, badge
    auth/session.ts         # sesi, requireUser, requireAdmin
    kab.ts                  # instrumen + scoring KAB
    gamification.ts         # pangkat, lencana, aturan XP
    validators.ts           # skema Zod
    db.ts / api.ts / utils.ts
  middleware.ts             # redirect rute terlindungi tanpa cookie sesi
prisma/
  schema.prisma
  migrations/
  seed.ts
scripts/
  verify-flow.ts
  verify-responsive.ts
  verify-interactive.ts
```

Prinsip utama: **satu engine, banyak skenario**. Logika simulasi tidak mengetahui skenario tertentu; UI memetakan tipe scene ke komponen, sedangkan konten dan keputusan berasal dari `ScenarioConfig`.

## Skema database (ringkas)

- `User` — kredensial hash bcrypt, peran, XP, relasi ke seluruh aktivitas.
- `Session` — token hash unik, kedaluwarsa, relasi pengguna (cascade).
- `Scenario` — metadata + `config` JSON, publikasi, level, kesulitan, jumlah variasi.
- `SimulationAttempt` — status, scene aktif, outcome, skor, XP, red flag, kategori rentan, waktu.
- `SimulationResponse` — keputusan per scene beserta verdict.
- `Assessment` — tipe `PRE`/`POST`, jawaban JSON, skor tiga dimensi, indeks KAB.
- `UserBadge` — unik per pengguna + kunci lencana.
- `EducationModule` + `ModuleProgress` — modul dan penyelesaian unik per pengguna.
- `ReflexAttempt` — jawaban refleks cepat, benar/salah, XP.

Indeks disediakan untuk pencarian sesi, percobaan per pengguna/status, assessment per pengguna/tipe, dan progres modul.

## Asumsi desain

Dokumen acuan tidak memuat mockup penuh untuk halaman autentikasi, profil, modul, dan radar. Halaman tersebut mengikuti bahasa visual yang sama: krem hangat, teal utama, kartu putih, aksen pastel, sudut membulat, dan target sentuh minimal 44 px.

Instrumen KAB memakai 12 butir yang diadaptasi dari kerangka HAIS-Q dengan tiga dimensi. Ambang interpretasi 0–39/40–69/70–89/90–100 adalah panduan edukatif internal, bukan skala klinis.

## Keamanan & privasi

- Kata sandi di-hash dengan bcrypt (cost 12).
- Token sesi 32 byte acak, hanya hash HMAC yang disimpan; cookie `HttpOnly`, `SameSite=Lax`, `Secure` di produksi.
- Validasi input dengan Zod pada semua Route Handler.
- Otorisasi dicek di server (`requireUser`, `requireAdmin`) dan pada setiap Route Handler.
- Tidak ada eksekusi berkas, pengiriman pesan, atau koleksi kredensial nyata.
- Semua contoh memakai data sintetis.

## Batasan & Phase 2

- Belum ada rate limiting/login throttling, verifikasi email, dan reset kata sandi.
- Belum ada pagination pada tabel riwayat/admin untuk data besar.
- Konfigurasi percakapan skenario masih dikelola lewat seed; panel admin baru mengelola metadata dan publikasi.
- Radar menandai seluruh kategori red flag skenario ketika terjadi keputusan rentan; pemetaan kategori per pilihan dapat diperhalus.
- Belum ada ekspor laporan KAB, leaderboard publik, PWA/offline, atau notifikasi.
- Uji otomatis mencakup alur HTTP utama dan pemeriksaan visual responsif; belum ada unit test terpisah untuk setiap fungsi skoring.
