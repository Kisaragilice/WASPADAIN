import { chromium, type Browser, type Page } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const OUT = "/tmp/opencode/waspadain-shots";

const consoleErrors: string[] = [];

function now() {
  return Date.now();
}

async function login(page: Page) {
  await page.goto(`${BASE}/masuk`, { waitUntil: "networkidle" });
  await page.fill("#email", "warga@waspadain.id");
  await page.fill("#password", "Waspada#2026");
  const started = now();
  await Promise.all([
    page.waitForURL("**/simulasi", { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("domcontentloaded");
  return now() - started;
}

async function run(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon")) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const loginMs = await login(page);
  console.log(`MEASURE login selesai dalam ${loginMs}ms`);

  // Brand logo harus menuju homepage.
  const brandHref = await page
    .getByRole("link", { name: /kembali ke beranda/i })
    .first()
    .getAttribute("href");
  if (brandHref !== "/") throw new Error(`Brand href salah: ${brandHref}`);
  console.log("PASS  logo WASPADAIN menuju /");

  // Menu bawah mobile: semua tujuan ada dan bisa diklik.
  const mobileNav = ["Simulasi", "Modul", "Radar", "KAB", "Profil"];
  for (const label of mobileNav) {
    const link = page.locator('nav[aria-label="Navigasi bawah"] a', {
      hasText: label,
    });
    if ((await link.count()) === 0) throw new Error(`Menu mobile ${label} tidak ada`);
  }
  console.log("PASS  navigasi bawah mobile lengkap (5 menu)");

  const timings: Array<{ path: string; ms: number }> = [];
  for (const item of [
    { label: "Modul", path: "/modul" },
    { label: "Radar", path: "/radar" },
    { label: "KAB", path: "/kab" },
    { label: "Profil", path: "/profil" },
    { label: "Simulasi", path: "/simulasi" },
  ]) {
    const started = now();
    console.log(`  → klik ${item.label} (${page.url()})`);
    await page
      .locator('nav[aria-label="Navigasi bawah"] a', { hasText: item.label })
      .first()
      .click();
    await page.waitForURL(`**${item.path}`, { timeout: 30000 });
    timings.push({ path: item.path, ms: now() - started });
    console.log(`  ✓ ${item.path} ${now() - started}ms`);
  }
  console.log(
    `MEASURE navigasi mobile (kunjungan pertama, dev): ${timings
      .map((item) => `${item.path} ${item.ms}ms`)
      .join(", ")}`,
  );

  const warmTimings: Array<{ path: string; ms: number }> = [];
  for (const item of [
    { label: "Modul", path: "/modul" },
    { label: "Radar", path: "/radar" },
    { label: "KAB", path: "/kab" },
    { label: "Profil", path: "/profil" },
    { label: "Simulasi", path: "/simulasi" },
  ]) {
    const started = now();
    await page
      .locator('nav[aria-label="Navigasi bawah"] a', { hasText: item.label })
      .first()
      .click();
    await page.waitForURL(`**${item.path}`, { timeout: 30000 });
    warmTimings.push({ path: item.path, ms: now() - started });
  }
  console.log(
    `MEASURE navigasi mobile (kunjungan kedua, dev): ${warmTimings
      .map((item) => `${item.path} ${item.ms}ms`)
      .join(", ")}`,
  );

  const warm = await page.evaluate(async () => {
    const routes = ["/modul", "/radar", "/kab", "/simulasi"];
    const output: Array<{ route: string; ms: number }> = [];
    for (const route of routes) {
      const started = performance.now();
      const response = await fetch(route, { headers: { "x-probe": "1" } });
      await response.text();
      output.push({ route, ms: Math.round(performance.now() - started) });
    }
    return output;
  });
  console.log(
    `MEASURE server render hangat: ${warm
      .map((item) => `${item.route} ${item.ms}ms`)
      .join(", ")}`,
  );

  // Dropdown profil.
  await page.getByRole("button", { name: "Menu akun" }).click();
  await page.getByRole("menu").waitFor({ timeout: 5000 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/phase1-profile-dropdown-375.png`, fullPage: false });
  for (const label of ["Beranda utama", "Dasbor simulasi", "Profil & riwayat", "Keluar dari akun"]) {
    if ((await page.getByRole("menuitem", { name: new RegExp(label, "i") }).count()) === 0) {
      throw new Error(`Item dropdown ${label} tidak ditemukan`);
    }
  }
  const homeItem = page.getByRole("menuitem", { name: /Beranda utama/i });
  const homeHref = await homeItem.getAttribute("href");
  if (homeHref && homeHref !== "/") throw new Error(`Dropdown beranda href salah: ${homeHref}`);
  await page.keyboard.press("Escape");
  console.log("PASS  dropdown profil berisi navigasi + logout");

  // Alur simulasi dan dialog hasil.
  await page.goto(`${BASE}/simulasi/etle-apk?restart=1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Buka notifikasi WhatsApp/i }).click();
  await page.getByText("Uji Refleks Keamanan").waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Blokir & laporkan nomor/i }).click();
  await page.getByRole("heading", { name: "Aman!", exact: true }).waitFor({ timeout: 15000 });

  // Tombol X pada dialog harus benar-benar menutup dialog.
  await page.getByRole("button", { name: /Tutup dialog/i }).click();
  await page.waitForTimeout(300);
  if ((await page.getByRole("dialog").count()) > 0) {
    throw new Error("Dialog tidak tertutup lewat tombol X");
  }
  await page.getByText(/Aman! Simulasi selesai/i).waitFor({ timeout: 5000 });
  console.log("PASS  tombol tutup dialog hasil berfungsi");

  // Ringkasan bisa dibuka kembali, lalu tombol aksi di dalamnya bekerja.
  await page.getByRole("button", { name: /Buka lagi ringkasan hasil/i }).click();
  await page.getByRole("dialog").waitFor({ timeout: 5000 });
  await Promise.all([
    page.waitForURL("**/bongkar/**", { timeout: 30000 }),
    page.getByRole("link", { name: /Bongkar modus penipuan/i }).click(),
  ]);
  await page.getByText(/Bongkar — Layar tadi kita tandai/i).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(500);
  console.log("PASS  aksi Bongkar dari dialog hasil berfungsi");

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  console.log(
    `MEASURE lebar bongkar: doc ${metrics.scrollWidth}, body ${metrics.bodyWidth}, viewport ${metrics.innerWidth}`,
  );
  const overflow = Math.max(metrics.scrollWidth, metrics.bodyWidth) - metrics.innerWidth;
  if (overflow > 1) {
    const offenders = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            className: (element.className || "").toString().slice(0, 160),
            text: (element.textContent || "").trim().slice(0, 60),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((item) => item.width > 0 && item.right > window.innerWidth + 1)
        .slice(0, 12),
    );
    console.log("Elemen melewati viewport:", JSON.stringify(offenders, null, 2));
    throw new Error(`Overflow horizontal ${overflow}px`);
  }
  console.log("PASS  tidak ada overflow horizontal setelah perbaikan navigasi");

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }
  console.log("PASS  tidak ada error console");

  // Logout lewat dropdown harus benar-benar menghapus sesi.
  await page.getByRole("button", { name: "Menu akun" }).click();
  await Promise.all([
    page.waitForURL(`${BASE}/`, { timeout: 30000 }),
    page.getByRole("menuitem", { name: /Keluar dari akun/i }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  if (!page.url().endsWith("/")) throw new Error(`Logout tidak kembali ke beranda: ${page.url()}`);
  await page.goto(`${BASE}/simulasi`, { waitUntil: "networkidle" });
  if (!page.url().includes("/masuk")) {
    throw new Error(`Sesi masih aktif setelah logout: ${page.url()}`);
  }
  console.log("PASS  logout dari dropdown menghapus sesi dan kembali ke beranda");

  await page.goto(`${BASE}/masuk`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/phase1-fixes-375.png`, fullPage: false });
  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  try {
    await run(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("PHASE 1 FIX CHECK GAGAL");
  console.error(error);
  process.exitCode = 1;
});
