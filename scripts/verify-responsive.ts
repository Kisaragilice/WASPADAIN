import { chromium, type Browser, type Page } from "playwright";
import { resetAuthRateLimits } from "./reset-rate-limits";
import {
  ensureTestUser,
  ensureTestAdmin,
  TEST_USER,
  TEST_ADMIN,
  disconnectFixtures,
} from "./test-fixtures";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = "/tmp/opencode/waspadain-shots";

const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

const PUBLIC_PAGES = ["/", "/masuk", "/daftar"];
const USER_PAGES = [
  "/simulasi",
  "/simulasi/katalog",
  "/modul",
  "/modul/format-berkas",
  "/radar",
  "/kab",
  "/kab/pre-test",
  "/kab/post-test",
  "/profil",
];
const ADMIN_PAGES = ["/admin"];

const results: string[] = [];

async function login(page: Page, email: string, password: string, expectedPath: string) {
  await page.goto(`${BASE}/masuk`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([
    page.waitForURL(`**${expectedPath}`, { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

async function audit(page: Page, label: string, path: string, width: number) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(350);

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth,
    hasHeading: Boolean(document.querySelector("h1")),
    title: document.title,
  }));

  const overflow = Math.max(metrics.scrollWidth, metrics.bodyWidth) - metrics.innerWidth;
  if (overflow > 1) {
    throw new Error(
      `${label} ${path} @${width}px overflow horizontal ${overflow}px ` +
        `(doc ${metrics.scrollWidth}, body ${metrics.bodyWidth}, viewport ${metrics.innerWidth})`,
    );
  }
  if (!metrics.hasHeading) {
    throw new Error(`${label} ${path} @${width}px tidak memiliki heading h1`);
  }

  const safe = path.replace(/\//g, "_").replace(/^_/, "") || "root";
  await page.screenshot({
    path: `${OUT}/${label}-${safe}-${width}.png`,
    fullPage: true,
  });

  results.push(`PASS  ${label} ${path} @${width}px (tanpa overflow)`);
  console.log(`PASS  ${label} ${path} @${width}px`);
}

async function runContext(browser: Browser, viewport: (typeof VIEWPORTS)[number]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (!text.includes("favicon")) {
        console.log(`  console error @${viewport.name}px: ${text.slice(0, 200)}`);
      }
    }
  });

  for (const path of PUBLIC_PAGES) {
    await audit(page, "public", path, viewport.width);
  }

  await login(page, TEST_USER.email, TEST_USER.password, "/simulasi");
  results.push(`PASS  login warga @${viewport.width}px`);
  console.log(`PASS  login warga @${viewport.width}px`);

  for (const path of USER_PAGES) {
    await audit(page, "user", path, viewport.width);
  }

  await context.close();

  const adminContext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    locale: "id-ID",
  });
  const adminPage = await adminContext.newPage();
  await login(adminPage, TEST_ADMIN.email, TEST_ADMIN.password, "/admin");
  for (const path of ADMIN_PAGES) {
    await audit(adminPage, "admin", path, viewport.width);
  }
  await adminContext.close();
}

async function main() {
  await ensureTestUser();
  await ensureTestAdmin();
  await resetAuthRateLimits();
  const browser = await chromium.launch();
  try {
    for (const viewport of VIEWPORTS) {
      await runContext(browser, viewport);
    }
  } finally {
    await browser.close();
  }

  console.log(`\n${results.length} pemeriksaan responsif lulus.`);
  console.log(`Screenshot: ${OUT}`);
}

main().catch((error) => {
  console.error("\nRESPONSIVE CHECK GAGAL");
  console.error(error);
  process.exitCode = 1;
}).finally(() => disconnectFixtures());
