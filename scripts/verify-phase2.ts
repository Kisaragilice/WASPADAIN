/**
 * Phase 2 integration checks. Requires a running server (default
 * http://localhost:3100) and the same PostgreSQL database configured in .env.
 *
 *   npm run test:phase2
 */
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { SCENARIO_SEEDS } from "../src/lib/scenario";
import type { ScenarioConfig, ScenarioScene } from "../src/lib/scenario/types";

function loadEnv() {
  if (!fs.existsSync(".env")) return;
  const text = fs.readFileSync(".env", "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnv();

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const prisma = new PrismaClient();

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
  init: RequestInit & { expected?: number | number[] } = {},
) {
  const headers = new Headers(init.headers);
  if (jar.size > 0) headers.set("cookie", cookieHeader(jar));
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    redirect: init.redirect ?? "manual",
  });
  saveCookies(jar, response);
  const expected = init.expected;
  if (expected !== undefined) {
    const allowed = Array.isArray(expected) ? expected : [expected];
    if (!allowed.includes(response.status)) {
      const text = await response.text();
      throw new Error(
        `${init.method ?? "GET"} ${path} -> ${response.status} (expected ${allowed.join("/")})\n${text.slice(0, 600)}`,
      );
    }
  }
  return response;
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

let passed = 0;
function pass(label: string) {
  passed += 1;
  console.log(`PASS  ${label}`);
}

function assertOk(condition: unknown, label: string) {
  assert.ok(condition, label);
  pass(label);
}

function uniqueIp() {
  return `198.51.100.${Math.floor(Math.random() * 200) + 20}`;
}

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${randomBytes(3).toString("hex")}@waspadain.test`;
}

const PASSWORD = "Rahasia#2026";
const NEW_PASSWORD = "RahasiaBaru#2026";

function kabAnswers() {
  return {
    k1: true,
    k2: true,
    k3: true,
    k4: true,
    a1: 5,
    a2: 5,
    a3: 5,
    a4: 5,
    b1: 5,
    b2: 5,
    b3: 5,
    b4: 5,
  };
}

function safeAction(scene: ScenarioScene) {
  if (scene.action) return scene.action;
  return (
    scene.decision?.choices.find((item) => item.verdict === "safe") ??
    scene.decision?.choices[0]
  );
}

function hashToken(token: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET tidak tersedia untuk pengujian reset.");
  return createHmac("sha256", secret).update(token).digest("hex");
}

async function register(jar: Jar, email: string, name = "Penguji Phase2") {
  const response = await request("/api/auth/register", jar, {
    method: "POST",
    headers: { "x-forwarded-for": uniqueIp() },
    body: JSON.stringify({ name, email, password: PASSWORD }),
    expected: 201,
  });
  return json<{ user: { id: string; email: string } }>(response);
}

async function login(jar: Jar, email: string, password: string, expected = 200) {
  const response = await request("/api/auth/login", jar, {
    method: "POST",
    headers: { "x-forwarded-for": uniqueIp() },
    body: JSON.stringify({ email, password }),
    expected,
  });
  return response;
}

async function main() {
  console.log(`Phase 2 integration checks against ${BASE}`);

  // Clean rate-limit windows from previous local runs so this suite is
  // repeatable. Individual limiter tests below use fresh random keys.
  await prisma.rateLimit.deleteMany();

  const userJar: Jar = new Map();
  const email = uniqueEmail("phase2");
  const registered = await register(userJar, email);
  const cookie = [...userJar.values()][0] ?? "";
  pass("pengguna baru terdaftar dan mendapat sesi");
  assert.ok(cookie.length > 20, "cookie sesi dikirim");

  const setCookie = (await request("/api/auth/login", new Map(), {
    method: "POST",
    headers: { "x-forwarded-for": uniqueIp() },
    body: JSON.stringify({ email, password: PASSWORD }),
  })).headers.getSetCookie() ?? [];
  const rawCookie = setCookie.find((item) => item.includes("waspadain_session")) ?? "";
  assertOk(/HttpOnly/i.test(rawCookie), "cookie sesi HttpOnly");
  assertOk(/SameSite=Lax/i.test(rawCookie), "cookie sesi SameSite=Lax");
  assertOk(/Path=\//i.test(rawCookie), "cookie sesi Path=/");

  const storedSession = await prisma.session.findFirst({
    where: { userId: registered.user.id },
  });
  assertOk(
    Boolean(storedSession) && storedSession!.tokenHash !== cookie,
    "token sesi disimpan dalam bentuk hash, bukan nilai cookie",
  );

  // Registration must not reveal whether the address exists.
  const duplicate = await request("/api/auth/register", new Map(), {
    method: "POST",
    headers: { "x-forwarded-for": uniqueIp() },
    body: JSON.stringify({ name: "Duplikat", email, password: PASSWORD }),
    expected: 409,
  });
  const duplicateBody = await json<{ error: string }>(duplicate);
  assertOk(
    /tidak dapat digunakan/i.test(duplicateBody.error),
    "registrasi email duplikat memakai pesan generik",
  );

  // Wrong password and unknown email share one generic message.
  const wrongJar: Jar = new Map();
  const wrong = await login(wrongJar, email, "SalahBanget#2026", 401);
  const wrongBody = await json<{ error: string }>(wrong);
  const unknown = await login(new Map(), uniqueEmail("missing"), PASSWORD, 401);
  const unknownBody = await json<{ error: string }>(unknown);
  assertOk(
    wrongBody.error === unknownBody.error &&
      wrongBody.error === "Email atau kata sandi salah.",
    "login gagal tidak membocorkan keberadaan akun",
  );

  // Login throttling.
  const throttledEmail = uniqueEmail("throttle");
  const throttleIp = uniqueIp();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await request("/api/auth/login", new Map(), {
      method: "POST",
      headers: { "x-forwarded-for": throttleIp },
      body: JSON.stringify({ email: throttledEmail, password: "salah" }),
      expected: 401,
    });
  }
  const limited = await request("/api/auth/login", new Map(), {
    method: "POST",
    headers: { "x-forwarded-for": throttleIp },
    body: JSON.stringify({ email: throttledEmail, password: "salah" }),
    expected: 429,
  });
  assertOk(Boolean(limited.headers.get("retry-after")), "login dibatasi setelah 5 percobaan gagal");

  // CSRF / Origin validation on browser-style mutations.
  const crossSite = await request("/api/auth/logout", new Map(), {
    method: "POST",
    headers: { origin: "https://evil.example" },
    expected: 403,
  });
  pass(`mutasi lintas origin ditolak (${crossSite.status})`);
  const sameOrigin = await request("/api/auth/logout", new Map(), {
    method: "POST",
    headers: { origin: BASE },
    expected: 200,
  });
  pass(`mutasi same-origin diterima (${sameOrigin.status})`);

  // RBAC.
  const forbidden = await request("/api/admin/scenarios/does-not-exist", userJar, {
    method: "PATCH",
    body: JSON.stringify({ isPublished: false }),
    expected: 403,
  });
  pass(`pengguna biasa tidak dapat mengubah skenario (${forbidden.status})`);

  // Pre-test opens the simulation gate.
  const preResponse = await request("/api/assessments", userJar, {
    method: "POST",
    body: JSON.stringify({ type: "PRE", answers: kabAnswers() }),
    expected: 201,
  });
  const pre = await json<{ xpEarned: number }>(preResponse);
  assertOk(pre.xpEarned === 30, "pre-test pertama memberi 30 XP");

  // Post-test is locked until Mode Bongkar is completed.
  const lockedPost = await request("/api/assessments", userJar, {
    method: "POST",
    body: JSON.stringify({ type: "POST", answers: kabAnswers() }),
    expected: 403,
  });
  pass(`post-test terkunci sebelum Mode Bongkar (${lockedPost.status})`);

  // Concurrent attempt starts must not create duplicate IN_PROGRESS rows.
  const startBody = JSON.stringify({ scenarioSlug: "etle-apk" });
  const [startA, startB] = await Promise.all([
    request("/api/attempts", userJar, { method: "POST", body: startBody, expected: 201 }),
    request("/api/attempts", userJar, { method: "POST", body: startBody, expected: 201 }),
  ]);
  const startedA = await json<{ attemptId: string; currentSceneId: string }>(startA);
  const startedB = await json<{ attemptId: string; currentSceneId: string }>(startB);
  assertOk(
    startedA.attemptId === startedB.attemptId,
    "dua permintaan start bersamaan memakai attempt yang sama",
  );
  const activeCount = await prisma.simulationAttempt.count({
    where: { userId: registered.user.id, status: "IN_PROGRESS" },
  });
  assertOk(activeCount === 1, "hanya ada satu attempt IN_PROGRESS per skenario");

  const seed = SCENARIO_SEEDS.find((item) => item.slug === "etle-apk");
  if (!seed) throw new Error("Seed ETLE tidak ditemukan");
  const config = seed.config as ScenarioConfig;

  let sceneId: string | null = startedA.currentSceneId;
  let completed = false;
  let safeSceneId: string | null = null;
  let safeActionId: string | null = null;

  for (let step = 0; step < 10 && sceneId; step += 1) {
    const scene = config.scenes.find((item) => item.id === sceneId);
    if (!scene) throw new Error(`Scene ${sceneId} tidak ditemukan`);
    const action = safeAction(scene);
    if (!action) throw new Error(`Scene ${sceneId} tanpa aksi`);
    if (!action.next) {
      safeSceneId = sceneId;
      safeActionId = action.id;
      break;
    }
    const response = await request(
      `/api/attempts/${startedA.attemptId}/step`,
      userJar,
      {
        method: "POST",
        body: JSON.stringify({ sceneId, actionId: action.id }),
        expected: 200,
      },
    );
    const data = await json<{ completed: boolean; nextSceneId: string | null }>(response);
    completed = data.completed;
    sceneId = data.nextSceneId;
  }
  assertOk(!completed && Boolean(safeSceneId && safeActionId), "langkah aman terakhir ditemukan");

  // Fire the final decision twice at once: one winner, one replay/conflict.
  const finalBody = JSON.stringify({ sceneId: safeSceneId, actionId: safeActionId });
  const [finalA, finalB] = await Promise.all([
    request(`/api/attempts/${startedA.attemptId}/step`, userJar, {
      method: "POST",
      body: finalBody,
      expected: [200, 409],
    }),
    request(`/api/attempts/${startedA.attemptId}/step`, userJar, {
      method: "POST",
      body: finalBody,
      expected: [200, 409],
    }),
  ]);
  const finalStatuses = [finalA.status, finalB.status].sort();
  assertOk(
    finalStatuses.includes(200),
    `penyelesaian ganda tidak menghasilkan dua kemenangan (${finalStatuses.join(", ")})`,
  );

  const attempt = await prisma.simulationAttempt.findUniqueOrThrow({
    where: { id: startedA.attemptId },
  });
  assertOk(
    attempt.status === "COMPLETED" && attempt.outcome === "SAFE",
    "simulasi selesai dengan hasil aman",
  );
  const simulationLedger = await prisma.xpTransaction.count({
    where: { userId: registered.user.id, source: "SIMULATION" },
  });
  assertOk(simulationLedger === 1, "XP simulasi hanya tercatat sekali di ledger");

  const replay = await request(`/api/attempts/${startedA.attemptId}/step`, userJar, {
    method: "POST",
    body: finalBody,
    expected: 200,
  });
  const replayBody = await json<{ alreadyCompleted?: boolean }>(replay);
  assertOk(replayBody.alreadyCompleted === true, "pengulangan langkah mengembalikan hasil tersimpan");

  // Mode Bongkar unlocks post-test.
  await request(`/api/attempts/${startedA.attemptId}/bongkar`, userJar, {
    method: "POST",
    expected: 200,
  });
  pass("Mode Bongkar ditandai selesai");
  const postResponse = await request("/api/assessments", userJar, {
    method: "POST",
    body: JSON.stringify({ type: "POST", answers: kabAnswers() }),
    expected: 201,
  });
  const post = await json<{ xpEarned: number }>(postResponse);
  assertOk(post.xpEarned === 30, "post-test memberi 30 XP setelah Mode Bongkar");
  const postAgain = await request("/api/assessments", userJar, {
    method: "POST",
    body: JSON.stringify({ type: "POST", answers: kabAnswers() }),
    expected: 201,
  });
  const postAgainData = await json<{ xpEarned: number }>(postAgain);
  assertOk(postAgainData.xpEarned === 0, "post-test ulang tidak memberi XP ganda");

  // Module and reflex XP are idempotent.
  const moduleA = await request("/api/modules/format-berkas/complete", userJar, {
    method: "POST",
    expected: 200,
  });
  const moduleAData = await json<{ xpEarned: number }>(moduleA);
  const moduleB = await request("/api/modules/format-berkas/complete", userJar, {
    method: "POST",
    expected: 200,
  });
  const moduleBData = await json<{ xpEarned: number }>(moduleB);
  assertOk(moduleAData.xpEarned === 20 && moduleBData.xpEarned === 0, "XP modul hanya diberikan sekali");

  const reflexQuestionId = "reflex-otp";
  const question = (
    await import("../src/lib/scenario")
  ).QUICK_REFLEX_QUESTIONS.find((item) => item.id === reflexQuestionId) ??
    (await import("../src/lib/scenario")).QUICK_REFLEX_QUESTIONS[0];
  const correct = question.options.find((item) => item.correct);
  if (!correct) throw new Error("Pertanyaan refleks tanpa jawaban benar");
  const reflexBody = JSON.stringify({ questionId: question.id, choiceId: correct.id });
  const reflexA = await json<{ xpEarned: number }>(
    await request("/api/reflex", userJar, { method: "POST", body: reflexBody, expected: 200 }),
  );
  const reflexB = await json<{ xpEarned: number }>(
    await request("/api/reflex", userJar, { method: "POST", body: reflexBody, expected: 200 }),
  );
  assertOk(reflexA.xpEarned === 10 && reflexB.xpEarned === 0, "XP refleks hanya diberikan sekali");

  const freshUser = await prisma.user.findUniqueOrThrow({
    where: { id: registered.user.id },
    select: { xp: true },
  });
  const ledger = await prisma.xpTransaction.aggregate({
    where: { userId: registered.user.id },
    _sum: { amount: true },
    _count: { _all: true },
  });
  assertOk(
    freshUser.xp === (ledger._sum.amount ?? 0),
    `saldo XP sama dengan total ledger (${freshUser.xp} XP, ${ledger._count._all} transaksi)`,
  );

  // Password change revokes other sessions but keeps the current one.
  const otherJar: Jar = new Map();
  await login(otherJar, email, PASSWORD);
  const changed = await request("/api/account", userJar, {
    method: "POST",
    body: JSON.stringify({
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    }),
    expected: 200,
  });
  const changedBody = await json<{ revokedSessions: number }>(changed);
  assertOk(changedBody.revokedSessions >= 1, "perubahan kata sandi mencabut sesi lain");
  await request("/api/account", otherJar, {
    method: "PATCH",
    body: JSON.stringify({ name: "Sesi Lama" }),
    expected: 401,
  });
  pass("sesi lain tidak berlaku setelah kata sandi berubah");
  await request("/api/account", userJar, {
    method: "PATCH",
    body: JSON.stringify({ name: "Penguji Phase2" }),
    expected: 200,
  });
  pass("sesi saat ini tetap berlaku setelah perubahan kata sandi");

  // Old password no longer works.
  await login(new Map(), email, PASSWORD, 401);
  pass("kata sandi lama ditolak");

  // Forgot-password is generic and stores only a hashed token.
  const forgotExisting = await request("/api/auth/forgot-password", new Map(), {
    method: "POST",
    headers: { "x-forwarded-for": uniqueIp() },
    body: JSON.stringify({ email }),
    expected: 200,
  });
  const forgotExistingBody = await json<{ message: string }>(forgotExisting);
  const forgotMissing = await request("/api/auth/forgot-password", new Map(), {
    method: "POST",
    headers: { "x-forwarded-for": uniqueIp() },
    body: JSON.stringify({ email: uniqueEmail("nobody") }),
    expected: 200,
  });
  const forgotMissingBody = await json<{ message: string }>(forgotMissing);
  assertOk(
    forgotExistingBody.message === forgotMissingBody.message,
    "forgot-password memakai respons generik untuk email terdaftar dan tidak",
  );
  const resetRows = await prisma.passwordResetToken.findMany({
    where: { userId: registered.user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  assertOk(resetRows.length >= 1, "token reset disimpan untuk pengguna terdaftar");
  assertOk(
    resetRows.every((row) => /^[a-f0-9]{64}$/i.test(row.tokenHash)),
    "token reset disimpan sebagai hash",
  );

  // Inject a known token to exercise the real reset endpoint end to end.
  const rawToken = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: registered.user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  const resetResponse = await request("/api/auth/reset-password", new Map(), {
    method: "POST",
    headers: { "x-forwarded-for": uniqueIp() },
    body: JSON.stringify({
      token: rawToken,
      password: "ResetBaru#2026",
      confirmPassword: "ResetBaru#2026",
    }),
    expected: 200,
  });
  pass(`reset password berhasil (${resetResponse.status})`);
  await request("/api/account", userJar, {
    method: "PATCH",
    body: JSON.stringify({ name: "Harusnya Gagal" }),
    expected: 401,
  });
  pass("reset password mencabut semua sesi lama");
  await request("/api/auth/reset-password", new Map(), {
    method: "POST",
    headers: { "x-forwarded-for": uniqueIp() },
    body: JSON.stringify({
      token: rawToken,
      password: "ResetLagi#2026",
      confirmPassword: "ResetLagi#2026",
    }),
    expected: 400,
  });
  pass("token reset tidak dapat dipakai dua kali");
  await login(new Map(), email, "ResetBaru#2026");
  pass("login dengan kata sandi hasil reset berhasil");

  // The reset page itself is reachable and rejects unsafe tokens gracefully.
  const invalidReset = await request("/reset-password?token=zzz", new Map(), {
    expected: 200,
  });
  const invalidHtml = await invalidReset.text();
  assertOk(invalidHtml.includes("Tautan tidak valid"), "halaman reset menolak token cacat");

  // Cleanup test account (cascades sessions, attempts, ledger, tokens).
  await prisma.user.deleteMany({ where: { email } });
  console.log(`\n${passed} pemeriksaan Phase 2 lulus.`);
}

main()
  .catch((error) => {
    console.error("\nFAIL ", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
