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

Buka <http://localhost:3000>. Contoh environment memakai port database host **7482** (rentang 7000–9999 yang jarang dipakai) agar tidak bentrok dengan PostgreSQL lokal di 5432. Ubah `DB_PORT`/`DATABASE_URL` bila perlu.

### Deploy dengan Docker Compose (server)

Prasyarat di server: Docker Engine 24+, plugin Compose v2, Git, dan disarankan reverse proxy HTTPS (nginx/Caddy). Seluruh perintah dijalankan dari root project (`cd waspadain`).

**1. Ambil kode dan siapkan environment**

```bash
git clone <URL_REPO> waspadain
cd waspadain
cp .env.docker.example .env.docker
openssl rand -hex 32   # contoh nilai AUTH_SECRET
openssl rand -hex 32   # contoh nilai POSTGRES_PASSWORD (harus URL-safe)
```

Edit `.env.docker`, lalu isi minimal:

- `AUTH_SECRET` — hasil `openssl rand -hex 32`
- `POSTGRES_PASSWORD` — hasil `openssl rand -hex 32`
- `APP_URL` — URL publik, mis. `https://domain-anda.id`
- `RESEND_API_KEY` dan `RESEND_FROM_EMAIL` — opsional, untuk reset kata sandi

Jangan commit `.env.docker`. Default port host adalah `APP_PORT=7481` dan `DB_PORT=7482` (rentang 7000–9999 yang jarang dipakai). Port internal Next.js tetap `3000`; database hanya di-bind ke `127.0.0.1` sehingga tidak terbuka ke publik.

**2. Build dan jalankan**

```bash
docker compose --env-file .env.docker up -d --build
```

Compose **tidak** membaca `.env.docker` otomatis. Agar perintah berikutnya lebih pendek, ekspor sekali per sesi shell:

```bash
export COMPOSE_ENV_FILES=.env.docker
docker compose up -d --build
```

**3. Verifikasi**

```bash
docker compose --env-file .env.docker ps
curl -fsS http://127.0.0.1:7481/api/health
docker compose --env-file .env.docker logs -f app
```

Container aplikasi otomatis menjalankan `prisma migrate deploy` dan seed **katalog** saja. Tidak ada akun demo atau admin otomatis di production. Health check memakai `GET /api/health` yang juga memverifikasi koneksi database.

**Perintah operasional harian**

```bash
# Status & log
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f app
docker compose --env-file .env.docker logs -f db

# Restart tanpa rebuild
docker compose --env-file .env.docker restart app

# Stop (data tetap tersimpan)
docker compose --env-file .env.docker stop
docker compose --env-file .env.docker start

# Hapus container & network (volume database tetap)
docker compose --env-file .env.docker down

# Hapus SEMUA termasuk data database (hati-hati)
docker compose --env-file .env.docker down -v
```

**Update dari GitHub**

```bash
cd waspadain
git pull --ff-only
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker ps
docker image prune -f
```

`up -d --build` membangun image baru dan mengganti container aplikasi; migrasi database berjalan otomatis saat boot. Untuk rollback kode, checkout commit sebelumnya lalu jalankan perintah yang sama. Migrasi Prisma tidak otomatis dibalik, jadi uji perubahan skema di staging sebelum production.

**Membuat / merotasi kredensial admin**

```bash
# Admin baru (interaktif, kata sandi tidak ditampilkan)
docker compose --env-file .env.docker run --rm app npm run admin:create

# Non-interaktif, mis. untuk provisioning
docker compose --env-file .env.docker run --rm \
  -e ADMIN_EMAIL=admin@domain-anda.id \
  -e ADMIN_PASSWORD='kata-sandi-awal-kuat' \
  app npm run admin:create

# Rotasi kata sandi admin yang sudah ada + cabut semua sesi
docker compose --env-file .env.docker run --rm \
  -e ADMIN_EMAIL=admin@domain-anda.id \
  -e ADMIN_PASSWORD='kata-sandi-baru-yang-kuat' \
  app npm run admin:reset
```

Kata sandi di-hash bcrypt (cost 12), tidak pernah disimpan sebagai teks asli, dan akun admin baru wajib mengganti kata sandi pada login pertama. Hapus `ADMIN_PASSWORD` dari environment setelah provisioning.

**Reset semua akun (termasuk admin)**

Perintah ini menulis backup JSON ke volume `waspadain_backups` sebelum menghapus seluruh akun. Katalog skenario dan modul tetap utuh.

```bash
# Pratinjau jumlah akun tanpa menghapus
docker compose --env-file .env.docker exec app npm run accounts:reset -- --dry-run

# Hapus semua akun; wajib memakai --yes
docker compose --env-file .env.docker exec app npm run accounts:reset -- --yes

# Salin backup dari container ke host
docker compose --env-file .env.docker cp app:/app/backups ./backups
```

Setelah reset, buat admin baru dengan perintah `admin:create` di atas. Untuk instalasi lokal (tanpa Docker): `npm run accounts:reset -- --yes`.

**Uji Resend dari terminal server**

```bash
docker compose --env-file .env.docker run --rm \
  app npm run email:test -- alamat-anda@domain.id
```

Perintah ini memakai `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, dan `APP_URL` yang sama dengan aplikasi. Keluar dengan kode non-zero bila Resend menolak permintaan. Tanpa argumen, alamat tujuan diambil dari `RESEND_TEST_TO` di `.env.docker`. Untuk pratinjau konfigurasi tanpa mengirim email, tambahkan `--dry-run`.

**Contoh reverse proxy nginx**

```nginx
server {
  listen 80;
  server_name domain-anda.id;
  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl;
  server_name domain-anda.id;

  ssl_certificate     /etc/letsencrypt/live/domain-anda.id/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/domain-anda.id/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:7481;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Di belakang reverse proxy pada host yang sama, set `APP_HOST=127.0.0.1` di `.env.docker` agar aplikasi hanya menerima koneksi dari proxy.

Catatan operasional:

- **Gunakan password DB yang URL-safe** (mis. `openssl rand -hex 32`). Password berisi `@ : / % #` merusak `DATABASE_URL`; jika perlu, gunakan `docker-compose.override.yml` untuk mengisi `DATABASE_URL` penuh.
- **Password DB hanya berlaku saat volume dibuat.** Mengubah `POSTGRES_PASSWORD` setelah volume ada tidak mengubah password di dalam PostgreSQL dan membuat app gagal dengan error `P1000`. Untuk instalasi baru, hapus volume dengan `docker compose --env-file .env.docker down -v` (menghapus semua data) sebelum start ulang.
- **Produksi wajib HTTPS.** Cookie sesi memakai prefix `__Host-` + `Secure`, jadi login tidak akan tersimpan bila diakses lewat `http://IP:7481`. Pasang reverse proxy dengan sertifikat, dan teruskan header `Host` serta `X-Forwarded-Proto` agar validasi origin aplikasi lolos.
- Log container dibatasi `10 MB × 3` per service.
- Backup JSON hasil reset akun tersimpan di volume `waspadain_backups`; salin ke host secara berkala.

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

Perintah akun dan email untuk instalasi lokal:

```bash
# Rotasi kata sandi admin yang sudah ada + cabut semua sesi
ADMIN_EMAIL="admin@waspadain.id" ADMIN_PASSWORD="kata-sandi-baru" npm run admin:reset

# Hapus semua akun termasuk admin (backup JSON di backups/)
npm run accounts:reset -- --yes
npm run accounts:reset -- --yes --dry-run

# Uji konfigurasi Resend
npm run email:test -- alamat-anda@domain.id
npm run email:test -- --to alamat-anda@domain.id --dry-run

# Kembalikan data demo setelah reset
SEED_DEMO_DATA=true DEMO_PASSWORD='kata-sandi-demo' npm run db:seed:demo
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
npm run admin:reset     # rotasi kata sandi admin + cabut sesi
npm run accounts:reset  # hapus semua akun termasuk admin (butuh --yes)
npm run email:test      # kirim email uji Resend dari terminal
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
| `DATABASE_URL` | Ya | PostgreSQL, mis. `postgresql://user:pass@host:7482/waspadain?schema=public` |
| `AUTH_SECRET` | Ya | ≥16 karakter di dev; ≥32 karakter acak di produksi |
| `APP_URL` | Produksi | URL publik http(s), dipakai untuk tautan reset password |
| `POSTGRES_USER/PASSWORD/DB` | Docker | Kredensial container database |
| `DB_PORT` | Tidak | Port loopback host untuk database (default `7482`) |
| `APP_HOST` | Docker | Alamat bind host aplikasi (default `0.0.0.0`; pakai `127.0.0.1` di belakang reverse proxy) |
| `APP_PORT` | Docker | Port host aplikasi (default `7481`; internal tetap `3000`) |
| `TZ` | Tidak | Zona waktu container (default `Asia/Jakarta`) |
| `RESEND_API_KEY` | Tidak | Aktifkan pengiriman email reset |
| `RESEND_FROM_EMAIL` | Tidak | Pengirim terverifikasi di Resend (mis. `WASPADAIN <admin@domain-anda.id>`) |
| `RESEND_TEST_TO` | Tidak | Tujuan default `npm run email:test` tanpa argumen |
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
5. Restart aplikasi, lalu uji pengiriman dari terminal server sebelum mencoba alur lupa kata sandi:
   ```bash
   # Docker
   docker compose --env-file .env.docker run --rm \
     app npm run email:test -- alamat-anda@domain.id

   # Tanpa Docker
   npm run email:test -- alamat-anda@domain.id
   ```
6. Uji lewat `/lupa-password` dengan akun nyata milik Anda.
7. Pastikan `APP_URL` sama persis dengan domain publik agar tautan reset valid.

Script `email:test` memakai konfigurasi yang sama dengan aplikasi, menampilkan ID email dari Resend, dan keluar non-zero bila provider menolak. Gunakan `--from "Nama <no-reply@domain-anda.id>"` untuk mencoba pengirim terverifikasi lain tanpa mengubah `.env`. Jika muncul `403`/`invalid_from_address` atau pesan *not authorized to send emails from …*, domain pengirim belum terverifikasi di akun Resend milik API key tersebut atau API key dibatasi ke domain lain. Sebelum domain diverifikasi, pengirim `onboarding@resend.dev` hanya boleh mengirim ke email pemilik akun Resend; ini cukup untuk memastikan API key dan jaringan server bekerja:

```bash
npm run email:test -- --to email-pemilik-akun@example.com \
  --from "WASPADAIN <onboarding@resend.dev>"
```

Pengiriman reset password memakai idempotency key turunan token agar retry tidak menggandakan email. Template email berada di `src/lib/email/templates/password-reset.ts`; layanan pengiriman di `src/lib/email/service.ts`.

Jangan mengirim email massal dari lingkungan pengembangan, dan jangan memakai kredensial demo.

## Deployment produksi

Jalur yang direkomendasikan adalah **Docker Compose** (lihat [Deploy dengan Docker Compose](#deploy-dengan-docker-compose-server) di atas): satu perintah `up -d --build` sudah mencakup build, migrasi, seed katalog, health check, dan restart policy.

Jika aplikasi dijalankan tanpa Docker:

1. Siapkan PostgreSQL 16 dengan volume persisten. Jangan membuka port database ke publik.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `NODE_ENV=production`, dan variabel Resend (opsional). Akses HTTPS wajib karena cookie `Secure` dan HSTS.
3. Jalankan migrasi dan seed katalog:
   ```bash
   npx prisma migrate deploy
   NODE_ENV=production npm run db:seed:catalog
   ```
4. Bootstrap admin:
   ```bash
   ADMIN_EMAIL="admin@domain-anda.id" ADMIN_PASSWORD="kata-sandi-awal-kuat" npm run admin:create
   ```
5. Build dan jalankan:
   ```bash
   npm run build
   npm start
   ```
6. Verifikasi `GET /api/health`, buka `/`, dan login. Log tidak boleh memuat token, kata sandi, atau detail database.

### Backup & restore PostgreSQL

Backup logis (custom format, cocok untuk restore selektif):

```bash
docker compose --env-file .env.docker exec -T db sh -c \
  'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > waspadain-$(date +%F).dump
```

Restore ke database kosong:

```bash
docker compose --env-file .env.docker exec -T db sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < waspadain-2026-11-17.dump
```

Untuk produksi, jadwalkan `pg_dump` harian ke penyimpanan terenkripsi di luar host, simpan 7–30 hari, dan uji restore minimal sekali sebelum go-live. Uji restore ke database sementara, bukan ke database produksi. Backup JSON dari `accounts:reset` berada di volume `waspadain_backups` dan bukan pengganti backup PostgreSQL.

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
  create-admin.ts         # bootstrap admin aman + rotasi kata sandi (--reset)
  reset-all-accounts.ts   # hapus semua akun termasuk admin, backup JSON
  test-email.ts           # uji pengiriman Resend dari terminal
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

## 🚀 Server-Side Optimization Roadmap (Docker Compose)

> **Status:** `Planned / Not Implemented`

Bagian ini merupakan catatan rencana optimasi infrastruktur **WASPADAIN** untuk meningkatkan efisiensi penggunaan *resource* server, mengurangi *overhead* Docker, dan menjaga performa aplikasi ketika jumlah pengguna meningkat.

Fokus optimasi berada pada sisi server dan *deployment* menggunakan **Docker Compose**, tanpa mengurangi fitur, keamanan, maupun fungsionalitas aplikasi.

---

### 1. Current Infrastructure

#### Production Stack
* **Frontend & SSR:** Next.js 15 + React 19
* **Runtime:** Node.js 22 Alpine
* **Language:** TypeScript
* **Database:** PostgreSQL 16 Alpine
* **ORM:** Prisma ORM 6
* **Orchestration:** Docker Compose

#### Baseline Resource Usage *(Server Monitoring Snapshot)*
| Resource | Penggunaan |
| :--- | :--- |
| **Application Container** | `~128 MiB` RAM |
| **PostgreSQL Container** | `~32 MiB` RAM |
| **CPU Aplikasi (Idle)** | `~0.01%` |
| **Total RAM (App + DB)** | `~160 MiB` |

> **Catatan:** Angka di atas merupakan *snapshot* monitoring kondisi ringan, bukan hasil *benchmark* beban maksimum.

---

### 2. Optimization Checklist

#### A. Docker Image Optimization
* [ ] Evaluasi penggunaan Next.js `output: "standalone"`.
* [ ] Optimalkan *production image* agar tidak membawa seluruh *development dependencies*.
* [ ] Minimalkan jumlah file yang disalin ke dalam *production image*.
* [ ] Evaluasi penggunaan *multi-stage build* yang lebih efisien.
* [ ] Optimalkan aturan pada `.dockerignore`.
* [ ] Bandingkan ukuran *image* sebelum dan sesudah optimasi.

🎯 **Target:** Mengurangi ukuran *image*, waktu *build*, dan kebutuhan *storage deployment*.

#### B. Container Resource Optimization
* [ ] Evaluasi penggunaan RAM setiap *container* menggunakan `docker stats`.
* [ ] Tentukan *memory limit* dan *CPU limit* yang sesuai untuk aplikasi dan database.
* [ ] Evaluasi kebutuhan *heap memory* Node.js (`--max-old-space-size`).
* [ ] Pastikan *container* tidak mengalami `OOMKilled`.
* [ ] Evaluasi penggunaan `mem_reservation` dan `mem_limit`.
* [ ] Pastikan alokasi *resource* tidak mengganggu *service* Docker lainnya di server.

🎯 **Target:** Penggunaan *resource* lebih terkontrol tanpa mengorbankan stabilitas aplikasi.

#### C. Next.js Production Runtime
* [ ] Evaluasi konfigurasi Next.js *standalone output*.
* [ ] Evaluasi penggunaan Node.js *production runtime*.
* [ ] Optimalkan penggunaan *server-side rendering* (SSR).
* [ ] Evaluasi strategi *caching* untuk data yang jarang berubah.
* [ ] Hindari pekerjaan berat yang tidak diperlukan saat *startup* aplikasi.
* [ ] Evaluasi penggunaan *worker* atau *background job* jika diperlukan.

🎯 **Target:** Mengurangi *overhead runtime* dan mempercepat *response* aplikasi.

#### D. Prisma & PostgreSQL Optimization
* [ ] Audit *query* Prisma yang paling sering dieksekusi.
* [ ] Identifikasi dan perbaiki potensi *N+1 query*.
* [ ] Gunakan `select` agar hanya kolom yang dibutuhkan yang diambil.
* [ ] Evaluasi *index* PostgreSQL berdasarkan pola *query* aktual.
* [ ] Evaluasi manajemen koneksi database dan *connection pooling*.
* [ ] Evaluasi konfigurasi `shared_buffers` dan memori PostgreSQL.
* [ ] Optimalkan *query* untuk halaman *dashboard*, statistik, riwayat simulasi, dan panel admin.

🎯 **Target:** Mengurangi beban database, penggunaan RAM, dan waktu eksekusi *query*.

#### E. Docker Compose Optimization
* [ ] Evaluasi *resource limits* untuk masing-masing *service*.
* [ ] Pertahankan *logging rotation* agar file log tidak memenuhi *disk*.
* [ ] Evaluasi konfigurasi `healthcheck` dan `restart` *policy*.
* [ ] Pastikan setiap *service* hanya mengekspos *port* yang benar-benar diperlukan.
* [ ] Evaluasi penggunaan *Docker network* internal.
* [ ] Pastikan database tidak dapat diakses langsung dari jaringan publik.
* [ ] Evaluasi strategi *backup* dan *recovery* untuk *volume* PostgreSQL.

🎯 **Target:** Infrastruktur lebih ringan, aman, dan mudah dipelihara.

#### F. Monitoring & Benchmarking
* [ ] Dokumentasikan penggunaan RAM saat kondisi *idle*.
* [ ] Ukur beban CPU saat aplikasi menerima *request*.
* [ ] Ukur waktu respons (*response time*) API.
* [ ] Uji aplikasi dengan beberapa skenario *concurrent users*.
* [ ] Monitor jumlah koneksi aktif PostgreSQL.
* [ ] Monitor penggunaan *disk* dan pertumbuhan *Docker logs*.
* [ ] Bandingkan metrik performa sebelum dan sesudah optimasi.

🎯 **Target:** Optimasi didasarkan pada hasil pengukuran nyata, bukan sekadar asumsi.

---

### 3. Optimization Principles

Prinsip utama yang wajib dipertahankan selama proses optimasi:

1. **Tidak menghilangkan** fitur aplikasi yang sudah tersedia.
2. **Tidak menurunkan** standar keamanan autentikasi dan otorisasi.
3. **Tidak menghapus** validasi di sisi server (*server-side validation*).
4. **Tidak mengorbankan** integritas data pada PostgreSQL.
5. **Tidak menambahkan** *service* eksternal baru (seperti Redis) tanpa kebutuhan dan justifikasi yang jelas.
6. **Menguji seluruh perubahan** di lingkungan *staging*/lokal sebelum diterapkan ke *production*.
7. **Selalu menyiapkan *backup* database** sebelum melakukan perubahan infrastruktur yang berisiko.
8. **Membandingkan hasil *benchmark*** sebelum dan sesudah optimasi dilakukan.

---

### 4. Suggested Implementation Order

| Priority | Task | Status |
| :---: | :--- | :---: |
| **1** | Audit Docker image dan *standalone build* | `Pending` |
| **2** | Audit penggunaan RAM dan CPU *container* | `Pending` |
| **3** | Optimasi *query* Prisma dan PostgreSQL | `Pending` |
| **4** | Evaluasi *resource limits* Docker Compose | `Pending` |
| **5** | Optimasi Next.js *production runtime* | `Pending` |
| **6** | Monitoring dan *load testing* | `Pending` |
| **7** | Evaluasi strategi *backup* dan *recovery* | `Pending` |

---

### 5. Expected Outcome

* **Docker image** berukuran jauh lebih ringkas.
* **Penggunaan RAM** lebih efisien dan terprediksi.
* **CPU overhead** lebih rendah saat *idle* maupun beban aktif.
* **Database** memproses *query* dengan latensi yang lebih rendah.
* **Response time API** lebih cepat.
* **Container** lebih stabil saat menangani lonjakan *request*.
* **Infrastruktur** lebih siap menghadapi pertumbuhan jumlah pengguna.

> [!IMPORTANT]
> Seluruh poin di atas masih berstatus **rencana**. Hindari menetapkan *memory limit* terlalu rendah hanya demi mengejar angka penggunaan RAM yang kecil. Selalu prioritaskan **stabilitas, keamanan, dan performa aplikasi**.
