/**
 * Verifies the admin bootstrap contract:
 * - a bootstrapped account has mustChangePassword=true
 * - login redirects to /ubah-sandi and sets the pending cookie
 * - protected pages and APIs are blocked until the password is replaced
 * - after replacement the admin can access /admin
 *
 * Uses a temporary admin so the real bootstrap account is not consumed.
 * Optionally checks the real admin when ADMIN_PASSWORD is provided.
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const prisma = new PrismaClient();
const TEMP_EMAIL = process.env.TEMP_ADMIN_EMAIL ?? "test-bootstrap-admin@waspadain.test";
const TEMP_PASSWORD = process.env.TEMP_ADMIN_PASSWORD ?? "BootstrapUji#2026";
const TEMP_NEW_PASSWORD = process.env.TEMP_ADMIN_NEW_PASSWORD ?? "BootstrapBaru#2026";

type Jar = Map<string, string>;

function cookieHeader(jar: Jar) {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function saveCookies(jar: Jar, response: Response) {
  for (const cookie of response.headers.getSetCookie?.() ?? []) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    if (index <= 0) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (value) jar.set(name, value);
    else jar.delete(name);
  }
}

async function request(
  path: string,
  jar: Jar,
  init: RequestInit & { expected?: number; redirect?: RequestRedirect } = {},
) {
  const headers = new Headers(init.headers);
  headers.set("origin", BASE);
  if (jar.size) headers.set("cookie", cookieHeader(jar));
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: init.redirect ?? "follow",
    headers,
  });
  saveCookies(jar, response);
  if (init.expected !== undefined && response.status !== init.expected) {
    throw new Error(
      `${init.method ?? "GET"} ${path} -> ${response.status}\n${(await response.text()).slice(0, 300)}`,
    );
  }
  return response;
}

let passed = 0;
function pass(message: string) {
  passed += 1;
  console.log(`PASS  ${message}`);
}

async function main() {
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: "login:" } } });
  await prisma.user.deleteMany({ where: { email: TEMP_EMAIL } });
  await prisma.user.create({
    data: {
      email: TEMP_EMAIL,
      name: "Admin Bootstrap Uji",
      passwordHash: await hash(TEMP_PASSWORD, 12),
      role: "ADMIN",
      mustChangePassword: true,
    },
  });

  const jar: Jar = new Map();
  const login = await request("/api/auth/login", jar, {
    method: "POST",
    body: JSON.stringify({ email: TEMP_EMAIL, password: TEMP_PASSWORD }),
  });
  const loginData = (await login.json()) as {
    mustChangePassword?: boolean;
    redirectTo?: string;
  };
  if (loginData.mustChangePassword !== true) {
    throw new Error("Login admin bootstrap tidak menandai mustChangePassword.");
  }
  if (loginData.redirectTo !== "/ubah-sandi") {
    throw new Error(`Redirect admin bootstrap salah: ${loginData.redirectTo}`);
  }
  pass("admin bootstrap wajib ganti kata sandi (redirect /ubah-sandi)");

  const pendingCookie = [...jar.keys()].some((key) => key.includes("pwd_change"));
  if (!pendingCookie) throw new Error("Cookie pending ganti kata sandi tidak diset.");
  pass("cookie pending ganti kata sandi diset");

  const blockedPage = await request("/admin", jar, {
    redirect: "manual",
    expected: 307,
  });
  const location = blockedPage.headers.get("location") ?? "";
  if (!location.includes("/ubah-sandi")) {
    throw new Error(`Halaman admin tidak dialihkan ke /ubah-sandi: ${location}`);
  }
  pass("halaman admin diblokir sebelum ganti kata sandi");

  const blockedApi = await request("/api/attempts", jar, {
    method: "POST",
    body: JSON.stringify({ scenarioSlug: "etle-apk" }),
    expected: 403,
  });
  const blockedBody = (await blockedApi.json()) as { error?: string };
  if (!blockedBody.error?.includes("Ganti kata sandi")) {
    throw new Error("API tidak menolak sesi yang wajib ganti kata sandi.");
  }
  pass("API diblokir sebelum ganti kata sandi");

  await request("/api/account", jar, {
    method: "POST",
    body: JSON.stringify({
      currentPassword: TEMP_PASSWORD,
      newPassword: TEMP_NEW_PASSWORD,
      confirmPassword: TEMP_NEW_PASSWORD,
    }),
  });
  pass("kata sandi awal berhasil diganti");

  const adminPage = await request("/admin", jar, { expected: 200 });
  const html = await adminPage.text();
  if (!html.includes("Kelola katalog")) {
    throw new Error("Halaman admin tidak dapat diakses setelah ganti kata sandi.");
  }
  pass("admin dapat mengakses /admin setelah ganti kata sandi");

  if (process.env.ADMIN_PASSWORD) {
    const realEmail = process.env.ADMIN_EMAIL ?? "admin@waspadain.id";
    const realJar: Jar = new Map();
    const realLogin = await request("/api/auth/login", realJar, {
      method: "POST",
      body: JSON.stringify({ email: realEmail, password: process.env.ADMIN_PASSWORD }),
    });
    const realData = (await realLogin.json()) as {
      mustChangePassword?: boolean;
      redirectTo?: string;
    };
    if (realData.mustChangePassword !== true || realData.redirectTo !== "/ubah-sandi") {
      throw new Error("Admin hasil bootstrap tidak dalam status wajib ganti sandi.");
    }
    pass("admin hasil bootstrap dapat login dan wajib ganti sandi");
  } else {
    console.log("SKIP  verifikasi admin nyata (ADMIN_PASSWORD tidak diset)");
  }

  await prisma.user.deleteMany({ where: { email: TEMP_EMAIL } });
  console.log(`\n${passed} pemeriksaan bootstrap admin lulus.`);
}

main()
  .catch((error) => {
    console.error("\nADMIN BOOTSTRAP CHECK GAGAL");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.user.deleteMany({ where: { email: TEMP_EMAIL } }).catch(() => null);
    await prisma.$disconnect();
  });
