# WASPADAIN

WASPADAIN adalah aplikasi latihan anti-modus penipuan digital: simulasi multikanal, Mode Bongkar, radar kerentanan, modul edukasi, serta pengukuran KAB (pengetahuan, sikap, perilaku) pre-test dan post-test. Seluruh pesan, nomor, domain, dan dokumen adalah **data sintetis**; aplikasi tidak mengirim pesan nyata, tidak menjalankan malware, dan tidak meminta kredensial asli.

## Stack

- Next.js 15 App Router + TypeScript strict
- Tailwind CSS 3 + shadcn-style primitives (Radix UI)
- Framer Motion, Zustand
- PostgreSQL 16 + Prisma ORM
- Zod untuk validasi
- Sesi opaque berbasis database (cookie HttpOnly, token di-HMAC dengan `AUTH_SECRET`)
- Rate limiter atomik berbasis PostgreSQL
- Resend (opsional) untuk email reset kata sandi
- Docker Compose untuk database + aplikasi

## Menjalankan secara lokal

Prasyarat: Node.js 22+, npm, PostgreSQL 16 (atau Docker).

```bash
cp .env.example .env
# sesuaikan DATABASE_URL dan AUTH_SECRET (gunakan nilai acak minimal 32 karakter)

docker compose up -d db
npm install
npx prisma migrate deploy
npm run db:seed          # katalog skenario + modul edukasi
npm run admin:create     # bootstrap admin (opsional, diminta interaktif)
npm run dev
```

Buka <http://localhost:3000>. Database Docker diarahkan ke port host **5433** agar tidak bentrok dengan PostgreSQL lokal yang mungkin sudah memakai 5432. Ubah `DB_PORT`/`DATABASE_URL` bila perlu.

### Menjalankan seluruh stack dengan Docker

```bash
cp .env.docker.example .env.docker
# isi AUTH_SECRET, POSTGRES_PASSWORD, APP_URL, dan (opsional) Resend
docker compose --env-file .env.docker up -d --build
```

`APP_PORT` mengatur port host (default `3000`); port internal Next.js tetap `3000`. Contoh `APP_PORT=3100` membuat aplikasi tersedia di <http://localhost:3100>. Database hanya di-bind ke `127.0.0.1` sehingga tidak terekspos ke jaringan publik.

Container aplikasi otomatis menjalankan `prisma migrate deploy` dan seed **katalog** saja. Tidak ada akun demo atau admin otomatis di production.

### Bootstrap administrator

Akun admin tidak dibuat oleh seed. Buat satu kali secara eksplisit:

```bash
# Interaktif (kata sandi tidak ditampilkan)
npm run admin:create

# Atau lewat environment sementara
ADMIN_EMAIL="admin@waspadain.id" ADMIN_PASSWORD="kata-sandi-awal-kuat" npm run admin:create
```

Ketentuan:
- Kata sandi di-hash bcrypt (cost 12); tidak pernah disimpan sebagai teks asli.
- Script tidak menimpa kata sandi admin yang sudah ada.
- Akun baru wajib mengganti kata sandi pada login pertama (diarahkan ke `/ubah-sandi`).
- Hapus `ADMIN_PASSWORD` dari environment setelah provisioning.
- Tidak ada endpoint publik untuk membuat admin.

Untuk Docker:

```bash
docker compose --env-file .env.docker run --rm \
  -e ADMIN_EMAIL=admin@waspadain.id \
  -e ADMIN_PASSWORD='kata-sandi-awal-kuat' \
  app npm run admin:create
```

### Data demo (hanya development)

Seed demo terpisah dan tidak berjalan otomatis:

```bash
SEED_DEMO_DATA=true DEMO_PASSWORD='kata-sandi-demo' npm run db:seed:demo
```

Bersihkan akun demo/test beserta seluruh aktivitasnya (dengan backup JSON otomatis di `backups/`):

```bash
npm run cleanup:demo                    # akun demo
npm run cleanup:demo -- --include-test  # demo + artifact pengujian lokal
npm run cleanup:demo -- --include-admin # ikut hapus admin demo lama (hati-hati)
npm run cleanup:demo -- --dry-run       # pratinjau tanpa menghapus
```

## Perintah penting

```bash
npm run dev             # server pengembangan (Turbopack)
npm run build           # prisma generate + build produksi
npm run start           # server produksi
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run db:migrate      # prisma migrate dev
npm run db:deploy       # prisma migrate deploy
npm run db:seed         # seed katalog (skenario + modul)
npm run db:seed:catalog # alias seed katalog
npm run db:seed:demo    # data demo (dev/test, butuh SEED_DEMO_DATA=true)
npm run db:studio       # Prisma Studio
npm run admin:create    # bootstrap admin (interaktif atau env)
npm run admin:bootstrap # alias bootstrap admin
npm run cleanup:demo    # hapus akun demo/test + backup JSON
npm run test:unit       # unit test Node test runner + tsx
npm run test:phase2     # integrasi keamanan/idempotensi (butuh server)
npm run test:flow       # uji alur HTTP end-to-end (butuh server)
npm run test:scenarios  # selesaikan kelima skenario lewat jalur aman
npm run test:responsive # cek overflow 375/768/1440 + screenshot (server + Playwright)
npm run test:interactive # uji klik simulator + Mode Bongkar + console errors
npm run test:phase1     # regresi mobile: login, menu, dropdown profil, dialog hasil, logout
```

Semua skrip verifikasi HTTP memakai `BASE_URL` (default `http://localhost:3100`) dan membutuhkan server yang sedang berjalan. Skrip browser/flow membuat akun fixture sementara (`test-*`) secara otomatis, bukan akun demo. Bersihkan dengan `npm run cleanup:demo -- --include-test`.

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
- **Lupa & reset kata sandi** dengan token acak sekali pakai, hash HMAC, masa berlaku 30 menit, dan pencabutan seluruh sesi.
- **Pre-test & post-test KAB** 12 butir (4 pengetahuan, 4 sikap, 4 perilaku), skoring 0–100, riwayat, XP, dan gating post-test yang benar-benar menuntut penyelesaian simulasi **dan** Mode Bongkar.
- **Katalog skenario** dengan filter kanal, kategori, kesulitan, pencarian, dan progres per skenario.
- **5 skenario, 16 variasi**: tilang ETLE `.APK`, poin bank hangus, pemadanan NPWP, resi paket, dan quishing QRIS.
- **Satu mesin simulasi** dengan scene `phone-home`, `whatsapp`, `sms`, `email`, `browser`, dan `dialog`; konten berasal dari konfigurasi JSON bertipe.
- **Mode Bongkar** langkah-demi-langkah: red flag, preview layar, fakta resmi, dan inti pertahanan. Penyelesaiannya disimpan dan membuka post-test.
- **Halaman hasil** dengan skor, XP, red flag, keputusan, dampak radar per pilihan, dan rekomendasi berikutnya.
- **Radar modus** lima parameter (tekanan waktu, umpan hadiah, otoritas palsu, format tautan, data rahasia), perbandingan KAB, dan SOP darurat.
- **XP, enam pangkat, sembilan lencana**, riwayat, statistik, refleks cepat. Setiap pemberian XP dicatat di ledger unik.
- **Lima modul edukasi** dengan penandaan tuntas dan XP.
- **Profil** dengan riwayat simulasi berpaginasi, riwayat KAB, lencana, peringkat pengguna, ubah nama/kata sandi, dan logout.
- **Navigasi aplikasi** dengan brand yang selalu kembali ke beranda, nav desktop/tablet, bottom nav mobile lima menu, skip-link, serta dropdown avatar.
- **Panel admin** untuk statistik agregat, percobaan terbaru berpaginasi, publikasi skenario, serta edit metadata.
- **Aksesibilitas** skip-link, fokus terlihat, `prefers-reduced-motion`, kontras teks mikro yang dinaikkan, target sentuh ≥44 px, dan `error`/`not-found` yang ramah.

## Keamanan & privasi

- Kata sandi di-hash dengan bcrypt (cost 12). Login memakai perbandingan dummy untuk email tidak dikenal sehingga waktu respons tidak membocorkan keberadaan akun.
- Token sesi 32 byte acak; hanya hash HMAC yang disimpan. Cookie `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` di produksi, dan bernama `__Host-waspadain_session` di produksi.
- **CSRF/origin:** semua mutasi `/api/*` memeriksa `Origin`/`Sec-Fetch-Site`. Browser lintas situs ditolak; klien non-browser tanpa header Origin tetap diizinkan.
- **Rate limiting** atomik di PostgreSQL: login per IP/email, registrasi, lupa/reset password, refleks, modul, simulasi, langkah, dan Mode Bongkar.
- **Otorisasi** dicek di server (`requireUser`, `requireAdmin`) dan di setiap Route Handler; attempt/response selalu diverifikasi kepemilikannya.
- **Idempotensi** langkah simulasi memakai transaksi + guard `updateMany`, unique `(attemptId, sceneId)`, dan partial unique index satu attempt `IN_PROGRESS` per pengguna+skenario.
- **XP ledger** `XpTransaction` dengan kunci unik `(userId, source, referenceId)`: XP hanya bertambah setelah klaim ledger berhasil.
- **Reset kata sandi** memakai token sekali pakai ber-hash, respons generik (anti-enumerasi), dan mencabut semua sesi.
- **Header keamanan:** CSP, HSTS (produksi), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
- **Produksi gagal cepat** bila `AUTH_SECRET` lemah/contoh, `DATABASE_URL` kosong, atau `APP_URL` tidak valid.
- **Repository:** `.env`, `.env.docker`, dan `session-*.json` diabaikan Git; file example hanya berisi placeholder. File session OpenCode sudah dikeluarkan dari indeks Git, tetapi masih ada di riwayat commit lama (lihat catatan di bawah).
- Tidak ada eksekusi berkas, pengiriman pesan, atau koleksi kredensial nyata. Semua contoh memakai data sintetis.

> **Tindakan manual riwayat Git:** file `session-e397e8f8-…json` pernah ter-commit di `main` dan sudah ter-push. Menghapusnya dari commit baru tidak menghapusnya dari riwayat. Untuk repo publik, bersihkan riwayat dengan `git filter-repo`/BFG dan force-push **setelah persetujuan**, lalu rotasi kredensial bila file itu pernah memuat secret.

## Status Phase 2

| Area | Perbaikan |
| --- | --- |
| Balapan langkah simulasi | Transaksi, guard scene, unique response, hasil tersimpan idempoten |
| XP ganda | Ledger `XpTransaction` unik per sumber+referensi; refleks, modul, assessment, simulasi |
| Attempt ganda | Advisory lock + partial unique index `IN_PROGRESS` |
| Badge `pelapor-cepat` | Terbuka pada penyelesaian aman mana pun, bukan hanya attempt paling awal |
| Open redirect `next` | `sanitizeNextPath` menolak URL absolut, `//`, backslash, karakter kontrol |
| Gating post-test | `bongkarCompletedAt` wajib; klien menandai penyelesaian Mode Bongkar |
| Sesi | Perubahan kata sandi mencabut sesi lain; reset mencabut semua sesi |
| Kebersihan sesi | Baris kedaluwarsa dihapus saat login; token reset/rate limit ikut dibersihkan |
| Docker | Tanpa fallback `AUTH_SECRET`; password DB wajib; DB hanya loopback; seed katalog saja, tanpa akun demo |
| Admin | Bootstrap eksplisit via CLI; wajib ganti kata sandi pada login pertama |
| Data demo | Seed demo terpisah; cleanup dengan backup JSON dan verifikasi katalog |
| UX | Paginasi riwayat/admin, retry simulasi, radar per pilihan, reduced motion, skip-link, error/not-found |

### Catatan XP

- Simulasi memberi XP per attempt yang selesai (replay tetap memberi XP; ini perilaku produk yang disengaja dan idempoten per attempt).
- Refleks: XP hanya untuk jawaban benar pertama per pertanyaan.
- Modul: XP hanya pada penyelesaian pertama.
- Assessment: XP hanya pada pengisian pertama per tipe (`PRE`/`POST`).

## Konfigurasi lingkungan

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | PostgreSQL, mis. `postgresql://user:pass@host:5433/waspadain?schema=public` |
| `AUTH_SECRET` | Ya | ≥16 karakter di dev; ≥32 karakter acak di produksi |
| `APP_URL` | Produksi | URL publik http(s), dipakai untuk tautan reset password |
| `POSTGRES_USER/PASSWORD/DB` | Docker | Kredensial container database |
| `DB_PORT` | Tidak | Port loopback host untuk database (default `5433`) |
| `APP_PORT` | Docker | Port host aplikasi (default `3000`; internal tetap `3000`) |
| `RESEND_API_KEY` | Tidak | Aktifkan pengiriman email reset |
| `RESEND_FROM_EMAIL` | Tidak | Pengirim terverifikasi di Resend (mis. `WASPADAIN <admin@domain-anda.id>`) |
| `SEED_DEMO_DATA` | Tidak | `true` hanya untuk `db:seed:demo` di dev/test |

`AUTH_SECRET` produksi harus dibuat dengan `openssl rand -hex 32` atau setara. Jangan memakai nilai di `.env.example`.

## Setup Resend (manual)

Email reset **tidak** aktif sampai Anda mengonfigurasinya. Tanpa konfigurasi, endpoint tetap memberi respons generik dan tidak melakukan panggilan jaringan.

1. Buat akun di <https://resend.com> dan tambahkan domain pengirim.
2. Tambahkan record DNS yang diminta Resend (SPF/DKIM, dan DMARC bila disarankan), lalu tunggu verifikasi.
3. Buat API key dengan izin kirim email.
4. Isi environment produksi:
   ```bash
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="WASPADAIN <no-reply@domain-anda.id>"
   APP_URL="https://domain-anda.id"
   ```
5. Restart aplikasi. Uji lewat `/lupa-password` dengan akun nyata milik Anda.
6. Pastikan `APP_URL` sama persis dengan domain publik agar tautan reset valid.

Jangan mengirim email massal dari lingkungan pengembangan, dan jangan memakai kredensial demo. Template email berada di `src/lib/email/templates/password-reset.ts`; layanan pengiriman di `src/lib/email/service.ts`.

## Deployment produksi

1. Siapkan PostgreSQL terkelola atau container dengan volume persisten. Jangan membuka port database ke publik.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, dan variabel Resend (opsional). Akses HTTPS wajib karena cookie `Secure` dan HSTS.
3. Jalankan migrasi:
   ```bash
   npx prisma migrate deploy
   ```
4. Seed katalog (aman diulang; tidak membuat akun):
   ```bash
   NODE_ENV=production npm run db:seed:catalog
   ```
5. Bootstrap admin (sekali, interaktif atau env sementara):
   ```bash
   npm run admin:create
   ```
6. Build dan jalankan:
   ```bash
   npm run build
   npm start
   ```
   atau `docker compose up -d --build`.
7. Verifikasi health dengan membuka `/` dan login. Log tidak boleh memuat token, kata sandi, atau detail database.

### Backup & restore PostgreSQL

Backup logis (custom format, cocok untuk restore selektif):

```bash
docker compose exec -T db pg_dump -U waspadain -Fc waspadain > waspadain-$(date +%F).dump
```

Restore ke database kosong:

```bash
docker compose exec -T db pg_restore -U waspadain -d waspadain --clean --if-exists < waspadain-2026-11-17.dump
```

Untuk produksi, jadwalkan `pg_dump` harian ke penyimpanan terenkripsi di luar host, simpan 7–30 hari, dan uji restore minimal sekali sebelum go-live. Uji restore ke database sementara, bukan ke database produksi.

## Arsitektur

```
src/
  app/
    (auth)/                 # /masuk, /daftar, /lupa-password, /reset-password
    (app)/                  # rute terlindungi: simulasi, modul, radar, kab, profil, admin, hasil
    api/                    # Route Handlers: auth, attempts, assessments, modules, reflex, account, admin
    error.tsx / not-found.tsx
    page.tsx                # landing publik
  components/
    admin/ auth/ bongkar/ brand/ layout/ simulator/ ui/
  lib/
    scenario/               # tipe, registry, 5 konfigurasi skenario, pertanyaan refleks
    attempt.ts              # state machine attempt, skoring, XP, badge
    simulation.ts           # skoring & aturan badge murni (unit-testable)
    xp.ts                   # ledger XP idempoten
    auth/                   # sesi, cookie, token, reset password
    email/                  # konfigurasi, layanan Resend, template
    rate-limit.ts           # limiter PostgreSQL
    security.ts             # validasi origin/CSRF
    env.ts                  # validasi konfigurasi produksi
    kab.ts / gamification.ts / validators.ts / api.ts / utils.ts
  instrumentation.ts        # validasi env saat server start
  middleware.ts             # proteksi rute + origin check
prisma/
  schema.prisma
  migrations/
  seed.ts
scripts/
  create-admin.ts         # bootstrap admin aman (interaktif/env)
  cleanup-demo-data.ts    # backup + hapus akun demo/test, verifikasi katalog
  seed-demo.ts (prisma/)  # data demo dev/test (butuh DEMO_PASSWORD)
  test-fixtures.ts        # akun fixture sementara untuk skrip uji
  verify-phase2.ts        # keamanan, reset password, idempotensi, ledger, sesi
  verify-admin-bootstrap.ts # wajib ganti sandi + akses admin
  verify-flow.ts          # alur HTTP end-to-end + RBAC
  verify-scenarios.ts     # kelima skenario lewat jalur aman
  verify-responsive.ts    # overflow + screenshot
  verify-interactive.ts   # simulator, Mode Bongkar, console errors
  verify-phase1-fixes.ts  # regresi mobile Fase 1
tests/unit/               # Node test runner (simulasi, gamifikasi, utils, config skenario)
```

Prinsip utama: **satu engine, banyak skenario**. Logika simulasi tidak mengetahui skenario tertentu; UI memetakan tipe scene ke komponen, sedangkan konten dan keputusan berasal dari `ScenarioConfig`.

## Skema database (ringkas)

- `User` — kredensial hash bcrypt, peran, XP, relasi ke seluruh aktivitas.
- `Session` — token hash unik, kedaluwarsa, relasi pengguna (cascade).
- `Scenario` — metadata + `config` JSON, publikasi, level, kesulitan, jumlah variasi.
- `SimulationAttempt` — status, scene aktif, outcome, skor, XP, red flag, kategori rentan, waktu selesai, `bongkarCompletedAt`.
- `SimulationResponse` — keputusan per scene, verdict, dan kategori radar per pilihan; unik `(attemptId, sceneId)`.
- `Assessment` — tipe `PRE`/`POST`, jawaban JSON, skor tiga dimensi, indeks KAB.
- `UserBadge` — unik per pengguna + kunci lencana.
- `EducationModule` + `ModuleProgress` — modul dan penyelesaian unik per pengguna.
- `ReflexAttempt` — jawaban refleks cepat, benar/salah, XP.
- `XpTransaction` — ledger XP unik per `(userId, source, referenceId)`.
- `PasswordResetToken` — hash token, kedaluwarsa, waktu pakai.
- `RateLimit` — fixed-window counter atomik per kunci.

## Pengujian

```bash
npm run test:unit       # 26 unit test
npm run test:phase2     # integrasi: CSRF, rate limit, RBAC, idempotensi, XP ledger, reset password, sesi
npm run test:admin      # bootstrap admin + wajib ganti kata sandi
npm run test:flow
npm run test:scenarios
npm run test:responsive
npm run test:interactive
npm run test:phase1
```

Uji integrasi membutuhkan server berjalan dan database yang sudah dimigrasi + di-seed. `test:phase2` membersihkan window rate limit lokal sebelum mulai, memakai akun unik, dan menghapus akun ujinya di akhir.

## Asumsi desain

Dokumen acuan tidak memuat mockup penuh untuk halaman autentikasi, profil, modul, dan radar. Halaman tersebut mengikuti bahasa visual yang sama: krem hangat, teal utama, kartu putih, aksen pastel, sudut membulat, dan target sentuh minimal 44 px.

Instrumen KAB memakai 12 butir yang diadaptasi dari kerangka HAIS-Q dengan tiga dimensi. Ambang interpretasi 0–39/40–69/70–89/90–100 adalah panduan edukatif internal, bukan skala klinis.

## Batasan yang tersisa

- Email reset memerlukan setup Resend manual (domain, DNS, API key). Tanpa itu, tautan tidak terkirim.
- Rate limiter memakai PostgreSQL; untuk trafik sangat tinggi pertimbangkan Redis/Upstash.
- Belum ada verifikasi email, login sosial, leaderboard publik, ekspor laporan KAB, PWA/offline, atau notifikasi.
- Panel admin baru mengelola metadata/publikasi; konfigurasi percakapan tetap lewat seed agar dapat ditinjau.
- Uji browser Playwright berbagi satu database; untuk CI gunakan database sementara.
- `next lint` sudah deprecated di Next.js 15; migrasi ke ESLint CLI dan Next.js 16 masih backlog.
