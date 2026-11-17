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
npm run test:phase1     # regresi mobile: login, menu, dropdown profil, dialog hasil, logout
```

Semua skrip verifikasi memakai `BASE_URL` (default `http://localhost:3100`) dan membutuhkan server yang sedang berjalan.

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
- **Navigasi aplikasi** dengan brand yang selalu kembali ke beranda, nav desktop/tablet, bottom nav mobile lima menu, serta dropdown avatar berisi beranda, profil, radar, KAB, admin, dan logout.
- **Panel admin** untuk statistik agregat, percobaan terbaru, publikasi skenario, serta edit metadata (judul, deskripsi, kesulitan, level, estimasi menit).

## Catatan performa pengembangan

- `npm run dev` memakai Turbopack (`next dev --turbopack`) agar kompilasi rute lebih cepat.
- Indikator mengambang Next.js dimatikan lewat `devIndicators: false`; sebelumnya portal dev-tools menutupi menu bawah dan menelan tap di mobile.
- Loading skeleton pada grup `(app)` memberi umpan balik instan saat perpindahan menu.
- Kompilasi pertama tiap rute di mode dev tetap memakan waktu; kunjungan berikutnya dan build produksi jauh lebih cepat. Pada pengukuran produksi lokal, perpindahan menu 54–85 ms.
- Login/logout memakai navigasi penuh setelah sesi dibuat/dihapus agar cookie sesi selalu terbaca dan tidak balapan dengan `router.push` + `router.refresh`.

## Status perbaikan Fase 1

Perbaikan berikut sudah diterapkan dan diuji ulang pada build produksi serta container Docker.

| Masalah | Akar masalah | Perbaikan |
| --- | --- | --- |
| Tap mobile tidak responsif | Portal indikator dev Next.js menutupi area menu bawah dan menangkap pointer event | `devIndicators: false`; error overlay tetap aktif |
| Login kadang tidak masuk dashboard | `router.push()` langsung diikuti `router.refresh()` dapat saling membatalkan | Navigasi penuh setelah cookie sesi dibuat; tombol tetap disabled selama proses |
| Tombol tutup popup hasil tidak bekerja | Dialog dikontrol `open={completed}` tanpa `onOpenChange`, sehingga X/backdrop/Escape tidak pernah menutup | `onOpenChange`, tombol tutup eksplisit, ringkasan inline yang bisa dibuka kembali, target sentuh 40 px |
| Menu membingungkan | Hierarki berbeda antara mobile, tablet, dan desktop; belum ada dropdown akun | Nav desktop/tablet konsisten, bottom nav 5 menu, dropdown avatar lengkap |
| Logo tidak kembali ke homepage | Brand mengarah ke `/simulasi` | Brand sekarang mengarah ke `/` |
| Overflow horizontal di Mode Bongkar | Teks panjang + grid item tanpa `min-w-0` | `min-w-0`, `break-words`, dan `overflow-hidden` pada preview |
| Navigasi dev lambat | Kompilasi webpack on-demand + tidak ada loading state | Turbopack + loading skeleton grup `(app)` |

Hasil pengukuran lokal:

- Perpindahan menu produksi: **±54–85 ms**.
- Perpindahan menu dev setelah rute terkompilasi: **±209–399 ms**.
- Kunjungan pertama rute baru di dev tetap bisa ±1 detik karena kompilasi on-demand.
- Uji: `lint` bersih, `typecheck` bersih, `build` sukses, `test:flow` 53 pemeriksaan, `test:scenarios` 5 skenario, `test:responsive` 42 pemeriksaan, `test:interactive` lulus, `test:phase1` lulus.

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
  verify-flow.ts          # alur HTTP end-to-end + RBAC
  verify-scenarios.ts     # kelima skenario lewat jalur aman
  verify-responsive.ts    # overflow + screenshot 375/768/1440
  verify-interactive.ts   # simulator, Mode Bongkar, console errors
  verify-phase1-fixes.ts  # regresi mobile Fase 1
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

## Batasan saat ini

- Belum ada rate limiting/login throttling, verifikasi email, dan reset kata sandi.
- Belum ada pagination pada tabel riwayat/admin untuk data besar.
- Konfigurasi percakapan skenario masih dikelola lewat seed; panel admin baru mengelola metadata dan publikasi.
- Radar menandai seluruh kategori red flag skenario ketika terjadi keputusan rentan; pemetaan kategori per pilihan dapat diperhalus.
- Belum ada ekspor laporan KAB, leaderboard publik, PWA/offline, atau notifikasi.
- Uji otomatis mencakup alur HTTP utama dan pemeriksaan visual responsif; belum ada unit test terpisah untuk setiap fungsi skoring.
- Seluruh uji browser masih memakai satu database demo dan akun demo yang sama.

## Masukan Phase 2

Bagian ini adalah backlog yang **belum dikerjakan**. Item di bawah ini disusun berdasarkan prioritas risiko, termasuk bug laten yang belum terlihat di alur uji saat ini.

### Prioritas 0 — bug laten & keamanan

1. **Idempotensi langkah simulasi dan XP ganda.**
   `submitStep` membaca attempt, memeriksa `status`, lalu menulis di beberapa query terpisah. Dua request paralel (double tap, retry jaringan, refresh saat submit) dapat sama-sama lolos pemeriksaan dan menyelesaikan attempt dua kali, termasuk menambah XP dua kali dan menyimpan respons ganda.
   - Saran: bungkus penyelesaian dalam satu `prisma.$transaction`, gunakan `updateMany({ where: { id, status: "IN_PROGRESS" }, data: { status: "COMPLETED", ... } })` dan berikan XP hanya bila `count === 1`.
   - Tambahkan idempotency key per langkah atau unique constraint `(attemptId, sceneId)` pada `SimulationResponse` bila satu scene hanya boleh dijawab sekali.

2. **Balapan XP pada refleks, modul, dan assessment.**
   Pola `findFirst` → `create` → `user.update` juga ada di `/api/reflex`, `/api/modules/[slug]/complete`, dan `/api/assessments`. Request paralel dapat memberi XP lebih dari sekali.
   - Saran: unique constraint untuk klaim XP pertama (mis. `ReflexAttempt` unik per `userId + questionId` untuk jawaban benar pertama), tangani `P2002`, dan gunakan tabel XP ledger agar pemberian XP bisa diaudit.

3. **Badge `pelapor-cepat` bisa terkunci permanen.**
   `awardBadges` memakai attempt paling awal (`startedAt asc`) dan hanya memberi badge bila attempt pertama itu `SAFE`. Jika percobaan pertama pengguna rentan, badge tidak akan pernah bisa diraih meskipun seluruh latihan berikutnya aman.
   - Saran: tentukan ulang kriteria (mis. “minimal satu hasil aman” atau “attempt pertama pada skenario pertama yang diselesaikan”) dan tulis di UI.

4. **Open redirect lewat `next` dengan backslash.**
   Pemeriksaan saat ini hanya menolak `//`. Nilai seperti `/\evil.example` dapat dinormalisasi browser menjadi `//evil.example`.
   - Saran: validasi dengan `new URL(next, origin)`, wajibkan `url.origin === origin`, tolak backslash/karakter kontrol, lalu gunakan `url.pathname + url.search`. Terapkan di `auth-form.tsx` dan halaman `masuk`/`daftar`.

5. **Attempt `IN_PROGRESS` ganda.**
   `startAttempt` memakai `findFirst` lalu `create` tanpa transaksi. Dua request pembukaan skenario bersamaan dapat membuat dua attempt aktif.
   - Saran: partial unique index `(userId, scenarioId) WHERE status = 'IN_PROGRESS'`, atau `upsert` dalam transaksi dengan advisory lock.

6. **Gating post-test tidak sesuai teks.**
   Pesan menyarankan “simulasi dan Mode Bongkar”, tetapi server hanya memeriksa attempt berstatus `COMPLETED`. Penyelesaian Mode Bongkar tidak pernah disimpan.
   - Saran: tambahkan penanda `bongkarCompletedAt` pada attempt, atau ubah copy agar konsisten dengan aturan yang benar-benar ditegakkan.

7. **Perubahan kata sandi tidak mencabut sesi lain.**
   Sesi lama tetap valid setelah kata sandi diubah, dan sesi saat ini juga tidak diperbarui.
   - Saran: hapus seluruh sesi pengguna selain sesi aktif (atau seluruh sesi), lalu minta login ulang; sediakan opsi “keluar dari semua perangkat”.

8. **Sesi kedaluwarsa tidak dibersihkan.**
   `getCurrentUser` menolak sesi kedaluwarsa, tetapi baris `Session` lama tetap menumpuk.
   - Saran: cleanup berkala (`deleteMany` untuk `expiresAt < now`) saat login atau lewat cron/job; pertimbangkan sliding expiration.

9. **Secret default dan akun demo di Docker.**
   `docker-compose.yml` memakai fallback `AUTH_SECRET` yang diketahui publik, sementara seed membuat akun demo dengan kata sandi tetap. Ini berbahaya bila stack dijalankan apa adanya di server publik.
   - Saran: gagalkan startup bila `AUTH_SECRET` tidak di-set di produksi, wajibkan penggantian kata sandi demo, dan jangan menjalankan seed akun demo di environment produksi.

10. **Belum ada proteksi CSRF eksplisit dan rate limiting.**
    `SameSite=Lax` membantu, tetapi belum ada pemeriksaan `Origin`/`Host` pada request mutasi. Login, daftar, refleks, dan langkah simulasi juga belum dibatasi per IP/pengguna.
    - Saran: verifikasi `Origin`/`Host` untuk semua POST/PATCH, lalu tambahkan rate limit (Redis/Upstash untuk multi-instance). Pertimbangkan juga respons login yang seragam secara waktu untuk mengurangi enumerasi email.

### Prioritas 1 — konsistensi produk & UX

- **XP bisa di-farm dengan mengulang skenario aman.** Setiap penyelesaian aman memberi XP lagi. Putuskan apakah ini disengaja; jika tidak, beri XP hanya pada penyelesaian aman pertama per skenario (atau batasi per hari) dan tampilkan “latihan ulang tanpa XP”.
- **Assessment boleh dikirim berkali-kali.** Hanya pengisian pertama per tipe yang memberi XP, tetapi UI tidak menjelaskan bahwa hasil terbaru yang ditampilkan. Tambahkan riwayat pengisian atau batasi satu hasil final per tipe.
- **Skor dan radar masih kasar.** `redFlagsIdentified` bersifat all-or-nothing dan skor hanya `100 - 50 × keputusan rentan`. Radar menandai semua kategori begitu ada satu keputusan rentan. Petakan kategori per pilihan agar umpan balik lebih tepat.
- **Mode Bongkar tidak bisa dilanjutkan.** Progres langkah tidak disimpan; menutup tab mengulang dari langkah pertama. Simpan `bongkarStep` per attempt bila alur panjang ditambahkan.
- **Toast sukses login bisa tidak terlihat** karena langsung diikuti navigasi penuh. Ganti dengan pesan selamat datang di halaman tujuan, atau tampilkan status pada tombol sampai navigasi selesai.
- **Belum menghormati `prefers-reduced-motion`.** Animasi Framer Motion dan `scroll-behavior: smooth` sebaiknya dinonaktifkan/dipercepat untuk pengguna yang memintanya.
- **Kontras teks mikro perlu diaudit.** Banyak teks 9–10 px dengan opacity 35–45% berpotensi gagal WCAG AA, terutama di layar terang.
- **Navigasi keyboard dan fokus.** Tambahkan skip-link ke konten utama, pindahkan fokus ke `h1` setelah navigasi client-side, dan pastikan `aria-live` mengumumkan umpan balik langkah simulasi.
- **Uji viewport ekstrem.** Tambahkan 320 px, 360 px, dan orientasi landscape; gunakan `100dvh`/`svh` serta `env(safe-area-inset-top)` agar bottom nav dan dialog tidak bertabrakan dengan browser chrome atau keyboard.
- **Belum ada `error.tsx`, `not-found.tsx`, dan retry jaringan.** Kegagalan `fetch` langkah simulasi hanya memunculkan toast; sediakan tombol “Coba lagi” yang mengulang aksi terakhir tanpa kehilangan posisi.
- **Dropdown dan dialog pada layar pendek.** Radix sudah menangani collision, tetapi perlu diuji pada 568 px tinggi dan landscape; pastikan dialog tetap bisa di-scroll dan tidak menutupi tombol aksi.
- **Akses admin di mobile hanya lewat dropdown.** Jika admin sering memakai ponsel, pertimbangkan item “Admin” di halaman profil atau shortcut khusus, bukan menambah item bottom nav menjadi enam.

### Prioritas 2 — kualitas, skala, dan operasional

- **Pagination dan query agregat.** Riwayat profil mengambil 30 item, admin memuat beberapa tabel sekaligus, dan dashboard menjalankan banyak query. Untuk data besar, gunakan pagination cursor, `groupBy`/`aggregate`, dan indeks tambahan sesuai pola filter.
- **Validasi runtime konfigurasi skenario.** `resolveConfig` melakukan cast `JSON` ke `ScenarioConfig`. Tambahkan validasi Zod saat seed/import dan saat admin kelak mengedit konfigurasi agar konfigurasi rusak tidak menjadi error 500.
- **Pisahkan seed demo dari seed katalog.** Seed katalog/modul boleh idempoten di setiap start; akun demo dan data contoh sebaiknya hanya untuk development/test. Pindahkan seeding ke job satu kali di produksi.
- **CI dan database uji terisolasi.** Jalankan lint, typecheck, build, migrasi, dan seluruh skrip Playwright di CI dengan database sementara. Saat ini uji berbagi akun demo dan memutasi data, sehingga paralelisasi bisa saling mengganggu.
- **Unit test logika inti.** Tambahkan Vitest untuk `submitStep`, `resolveConfig`, `scoreKab`, `getRank`, `awardBadges`, dan perhitungan radar, termasuk kasus batas dan balapan.
- **Perluas cakupan E2E.** Halaman `/simulasi/[slug]`, `/bongkar/[attemptId]`, `/hasil/[attemptId]`, modal admin, login gagal, sesi kedaluwarsa, dan logout semua perangkat belum tercakup penuh.
- **Uji aksesibilitas otomatis.** Tambahkan `@axe-core/playwright` pada halaman utama dan dialog untuk menangkap kontras, nama tombol, dan urutan heading.
- **Security headers.** Tambahkan CSP, HSTS, `Referrer-Policy`, `Permissions-Policy`, dan `frame-ancestors`/`X-Frame-Options` yang sesuai. Pastikan juga cookie `Secure` hanya dipakai di HTTPS; akses produksi lewat IP/LAN HTTP dapat membuat login tampak gagal.
- **Observability.** Tambahkan structured logging, error tracking, health check aplikasi, dan metrik latensi per rute agar regresi performa tidak hanya terdeteksi dari log dev.
- **Backup, migrasi, dan rollback.** Dokumentasikan backup PostgreSQL, uji restore, dan strategi migrasi tanpa downtime sebelum data pengguna nyata masuk.
- **Modernisasi tooling.** `next lint` sudah deprecated; migrasikan ke ESLint CLI dan siapkan jalur upgrade Next.js 16. Pertimbangkan juga cache persisten Turbopack saat stabil.
- **Fitur lanjutan.** Verifikasi email, reset kata sandi, login sosial (opsional), leaderboard, ekspor laporan KAB, notifikasi, PWA/offline, serta editor skenario penuh dengan preview dan versioning.

### Urutan eksekusi yang disarankan

1. Idempotensi langkah simulasi + XP ledger/unique constraint (P0 nomor 1–2).
2. Validasi `next`, CSRF/origin, rate limit, dan hardening secret (P0 nomor 4, 9–10).
3. Perbaiki kriteria badge dan gating post-test agar aturan produk konsisten (P0 nomor 3, 6).
4. Tambahkan unit test + CI database terisolasi sebelum menambah fitur baru.
5. Audit aksesibilitas, reduced motion, dan viewport ekstrem.
6. Baru lanjut ke fitur pertumbuhan (leaderboard, ekspor, PWA) dan skala data.
