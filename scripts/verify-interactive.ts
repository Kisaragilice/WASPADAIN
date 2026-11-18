import { chromium, type Browser } from "playwright";
import { resetAuthRateLimits } from "./reset-rate-limits";
import { ensureTestUser, TEST_USER, disconnectFixtures } from "./test-fixtures";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = "/tmp/opencode/waspadain-shots";
const consoleErrors: string[] = [];

async function main() {
  await ensureTestUser();
  const browser = await chromium.launch();
  try {
    await run(browser);
  } finally {
    await browser.close();
  }
}

async function run(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    locale: "id-ID",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon")) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${BASE}/masuk`, { waitUntil: "networkidle" });
  await page.fill("#email", TEST_USER.email);
  await page.fill("#password", TEST_USER.password);
  await Promise.all([
    page.waitForURL("**/simulasi"),
    page.click('button[type="submit"]'),
  ]);

  await page.goto(`${BASE}/simulasi/etle-apk?restart=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const overflowAtStart = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (overflowAtStart > 1) throw new Error(`Simulator overflow ${overflowAtStart}px`);
  await page.getByRole("button", { name: /Buka notifikasi WhatsApp/i }).click();
  await page.getByText("Uji Refleks Keamanan").waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: /Blokir & laporkan nomor/i }).click();
  await page.getByRole("heading", { name: "Aman!", exact: true }).waitFor({ timeout: 10000 });
  await page.screenshot({ path: `${OUT}/flow-simulator-result-375.png`, fullPage: true });
  console.log("PASS  simulasi interaktif: buka pesan → pilih blokir → hasil aman");

  await page.getByRole("link", { name: /Bongkar modus penipuan/i }).click();
  await page.waitForURL("**/bongkar/**");
  await page.waitForLoadState("networkidle");
  await page.getByText(/Bongkar — Layar tadi kita tandai/i).first().waitFor({ timeout: 10000 });
  console.log("PASS  Mode Bongkar terbuka dari dialog hasil");

  for (let index = 0; index < 5; index += 1) {
    const next = page.getByRole("button", { name: /^Lanjut( ke Red Flag \d+)?$/ });
    if ((await next.count()) > 0) {
      await next.first().click();
      await page.waitForTimeout(250);
      continue;
    }
    const finish = page.getByRole("button", { name: /Selesai & lihat intinya/i });
    if ((await finish.count()) > 0) {
      await finish.first().click();
      await page.waitForTimeout(400);
      break;
    }
    if ((await page.getByText(/Inti pertahanan/i).count()) > 0) break;
  }
  await page.screenshot({ path: `${OUT}/flow-bongkar-final-375.png`, fullPage: true });
  const overflowBongkar = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (overflowBongkar > 1) throw new Error(`Bongkar overflow ${overflowBongkar}px`);
  console.log("PASS  alur Mode Bongkar dapat diselesaikan tanpa overflow");

  await page.goto(`${BASE}/kab/pre-test`, { waitUntil: "networkidle" });
  const firstScale = page.getByRole("button", { name: "Sangat setuju" }).first();
  if ((await firstScale.count()) > 0) {
    await firstScale.click();
    console.log("PASS  tombol skala KAB dapat ditekan (target sentuh)");
  }

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }
  console.log("PASS  tidak ada error console selama alur interaktif");
  console.log(`Screenshot: ${OUT}`);

  await context.close();
}

resetAuthRateLimits()
  .then(() => main())
  .catch((error) => {
  console.error("INTERACTIVE CHECK GAGAL");
  console.error(error);
  process.exitCode = 1;
}).finally(() => disconnectFixtures());
