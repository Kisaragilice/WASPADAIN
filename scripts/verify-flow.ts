import { PrismaClient } from "@prisma/client";
import { SCENARIO_SEEDS } from "../src/lib/scenario";
import { KAB_QUESTIONS } from "../src/lib/kab";
import { QUICK_REFLEX_QUESTIONS } from "../src/lib/scenario";
import type { ScenarioConfig, ScenarioScene } from "../src/lib/scenario/types";
import { ensureTestAdmin } from "./test-fixtures";

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
  init: RequestInit & { expected?: number } = {},
) {
  const headers = new Headers(init.headers);
  if (jar.size > 0) headers.set("cookie", cookieHeader(jar));
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    redirect: init.redirect ?? "follow",
  });
  saveCookies(jar, response);
  const expected = init.expected ?? 200;
  if (response.status !== expected) {
    const text = await response.text();
    throw new Error(
      `${init.method ?? "GET"} ${path} → ${response.status} (expected ${expected})\n${text.slice(0, 500)}`,
    );
  }
  return response;
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

const results: string[] = [];
function pass(label: string) {
  results.push(`PASS  ${label}`);
  console.log(`PASS  ${label}`);
}

function assert(condition: unknown, label: string) {
  if (!condition) throw new Error(`ASSERT FAILED: ${label}`);
  pass(label);
}

async function page(path: string, jar: Jar, marker?: string) {
  const response = await request(path, jar, { expected: 200 });
  const html = await response.text();
  assert(html.length > 1000, `${path} merender HTML`);
  if (marker) assert(html.includes(marker), `${path} memuat “${marker}”`);
  return html;
}

function safeAction(scene: ScenarioScene) {
  if (scene.action) return scene.action;
  const choice = scene.decision?.choices.find((item) => item.verdict === "safe");
  return choice ?? scene.decision?.choices[0];
}

function kabAnswers(knowledgeCorrect: boolean) {
  const answers: Record<string, number | boolean> = {};
  for (const question of KAB_QUESTIONS) {
    if (question.type === "boolean") {
      answers[question.id] = knowledgeCorrect ? Boolean(question.correct) : !question.correct;
    } else if (question.reverse) {
      answers[question.id] = knowledgeCorrect ? 1 : 5;
    } else {
      answers[question.id] = knowledgeCorrect ? 5 : 2;
    }
  }
  return answers;
}

async function registerUser(jar: Jar) {
  const email = `flow-${Date.now()}-${Math.floor(Math.random() * 9999)}@waspadain.id`;
  const response = await request("/api/auth/register", jar, {
    method: "POST",
    body: JSON.stringify({ name: "Penguji Alur", email, password: "Rahasia#2026" }),
    expected: 201,
  });
  const data = await json<{ user: { id: string; name: string } }>(response);
  pass(`registrasi pengguna baru (${email})`);
  return { id: data.user.id, email };
}

async function login(jar: Jar, email: string, password: string, expectedRedirect: string) {
  const response = await request("/api/auth/login", jar, {
    method: "POST",
    body: JSON.stringify({ email, password }),
    expected: 200,
  });
  const data = await json<{ redirectTo: string; user: { role: string } }>(response);
  assert(data.redirectTo === expectedRedirect, `login ${email} diarahkan ke ${expectedRedirect}`);
  return data;
}

async function main() {
  const userJar: Jar = new Map();

  await page("/", userJar, "Jangan tunggu");
  await page("/masuk", userJar, "Masuk dan lanjutkan latihanmu");
  await page("/daftar", userJar, "Buat akun WASPADAIN");
  pass("halaman publik dapat diakses tanpa sesi");

  const unauth = await fetch(`${BASE}/profil`, { redirect: "manual" });
  assert(
    unauth.status >= 300 && unauth.status < 400 && Boolean(unauth.headers.get("location")?.includes("/masuk")),
    "middleware mengalihkan /profil tanpa sesi ke /masuk",
  );

  const user = await registerUser(userJar);
  await page("/kab/pre-test", userJar, "Mulai dari garis dasar");
  await page("/profil", userJar, "Ruang belajar pribadi");

  const preResponse = await request("/api/assessments", userJar, {
    method: "POST",
    body: JSON.stringify({ type: "PRE", answers: kabAnswers(true) }),
    expected: 201,
  });
  const pre = await json<{ result: { kabIndex: number }; xpEarned: number }>(preResponse);
  assert(pre.result.kabIndex >= 80, `pre-test tersimpan dengan indeks ${pre.result.kabIndex}`);
  assert(pre.xpEarned > 0, "pre-test pertama memberi XP");

  await page("/kab", userJar, "Ukur pengetahuan, sikap, dan perilaku");
  await page("/simulasi", userJar, "Jangan tunggu kena tipu");
  await page("/simulasi/katalog", userJar, "Modus yang dekat dengan keseharianmu");
  await page("/modul", userJar, "Pahami polanya");
  await page("/radar", userJar, "Radar modus");
  await page("/kab/post-test", userJar, "Ukur perubahan setelah berlatih");

  const startResponse = await request("/api/attempts", userJar, {
    method: "POST",
    body: JSON.stringify({ scenarioSlug: "etle-apk", restart: true }),
    expected: 201,
  });
  const started = await json<{ attemptId: string; currentSceneId: string }>(startResponse);
  assert(Boolean(started.attemptId), "simulasi ETLE dimulai");

  const seed = SCENARIO_SEEDS.find((item) => item.slug === "etle-apk");
  if (!seed) throw new Error("Seed ETLE tidak ditemukan");
  const config = seed.config as ScenarioConfig;

  let sceneId: string | null = started.currentSceneId;
  let completed = false;
  let finalOutcome: string | null = null;
  for (let step = 0; step < 8 && sceneId && !completed; step += 1) {
    const scene = config.scenes.find((item) => item.id === sceneId);
    if (!scene) throw new Error(`Scene ${sceneId} tidak ditemukan`);
    const action = safeAction(scene);
    if (!action) throw new Error(`Scene ${sceneId} tidak punya aksi`);
    const stepResponse = await request(`/api/attempts/${started.attemptId}/step`, userJar, {
      method: "POST",
      body: JSON.stringify({ sceneId, actionId: action.id }),
      expected: 200,
    });
    const stepData = await json<{
      completed: boolean;
      nextSceneId: string | null;
      outcome?: string;
    }>(stepResponse);
    completed = stepData.completed;
    finalOutcome = stepData.outcome ?? finalOutcome;
    sceneId = stepData.nextSceneId;
  }
  assert(completed, "alur simulasi selesai melalui API");
  assert(finalOutcome === "SAFE", "keputusan aman menghasilkan outcome SAFE");

  await page(
    `/hasil/${started.attemptId}`,
    userJar,
    "Hasil simulasi",
  );
  await page(
    `/simulasi/etle-apk/bongkar/${started.attemptId}`,
    userJar,
    "Bongkar",
  );
  await request(`/api/attempts/${started.attemptId}/bongkar`, userJar, {
    method: "POST",
    expected: 200,
  });
  pass("Mode Bongkar ditandai selesai");

  const postResponse = await request("/api/assessments", userJar, {
    method: "POST",
    body: JSON.stringify({ type: "POST", answers: kabAnswers(true) }),
    expected: 201,
  });
  const post = await json<{ result: { kabIndex: number }; xpEarned: number }>(postResponse);
  assert(post.result.kabIndex >= 80, `post-test tersimpan dengan indeks ${post.result.kabIndex}`);
  assert(post.xpEarned > 0, "post-test pertama memberi XP");
  await page("/kab/post-test", userJar, "Post-test terakhir");

  const moduleResponse = await request("/api/modules/format-berkas/complete", userJar, {
    method: "POST",
    expected: 200,
  });
  const moduleData = await json<{ xpEarned: number }>(moduleResponse);
  assert(moduleData.xpEarned > 0, "modul pertama memberi XP");

  const reflex = QUICK_REFLEX_QUESTIONS[0];
  const correctChoice = reflex.options.find((item) => item.correct);
  if (!correctChoice) throw new Error("Reflex question tanpa jawaban benar");
  const reflexResponse = await request("/api/reflex", userJar, {
    method: "POST",
    body: JSON.stringify({ questionId: reflex.id, choiceId: correctChoice.id }),
    expected: 200,
  });
  const reflexData = await json<{ correct: boolean; xpEarned: number }>(reflexResponse);
  assert(reflexData.correct && reflexData.xpEarned > 0, "reflex benar memberi XP");

  const accountResponse = await request("/api/account", userJar, {
    method: "PATCH",
    body: JSON.stringify({ name: "Penguji Alur Diperbarui" }),
    expected: 200,
  });
  const accountData = await json<{ user: { name: string } }>(accountResponse);
  assert(accountData.user.name === "Penguji Alur Diperbarui", "nama profil dapat diperbarui");

  const weakPost = await request("/api/assessments", userJar, {
    method: "POST",
    body: JSON.stringify({ type: "POST", answers: { k1: false } }),
    expected: 422,
  });
  assert(weakPost.status === 422, "payload KAB tidak lengkap ditolak");

  const forbiddenAdmin = await request("/api/admin/scenarios/does-not-exist", userJar, {
    method: "PATCH",
    body: JSON.stringify({ isPublished: false }),
    expected: 403,
  });
  assert(forbiddenAdmin.status === 403, "pengguna biasa tidak dapat mengakses API admin");

  await page("/radar", userJar, "Perubahan KAB");
  await page("/profil", userJar, "Penguji Alur Diperbarui");

  const adminJar: Jar = new Map();
  const adminCreds = await ensureTestAdmin();
  await login(adminJar, adminCreds.email, adminCreds.password, "/admin");
  await page("/admin", adminJar, "Kelola katalog dan pantau latihan");

  const scenario = await prisma.scenario.findUnique({ where: { slug: "etle-apk" } });
  if (!scenario) throw new Error("Skenario ETLE tidak ada di database");
  const patchResponse = await request(`/api/admin/scenarios/${scenario.id}`, adminJar, {
    method: "PATCH",
    body: JSON.stringify({ estimatedMinutes: scenario.estimatedMinutes, isPublished: true }),
    expected: 200,
  });
  const patchData = await json<{ scenario: { isPublished: boolean } }>(patchResponse);
  assert(patchData.scenario.isPublished, "admin dapat memperbarui metadata skenario");

  const logoutResponse = await request("/api/auth/logout", adminJar, {
    method: "POST",
    expected: 200,
  });
  assert(logoutResponse.status === 200, "logout admin berhasil");

  await request("/api/attempts", new Map(), {
    method: "POST",
    body: JSON.stringify({ scenarioSlug: "etle-apk" }),
    expected: 401,
  });
  pass("API simulasi menolak permintaan tanpa sesi");

  console.log("\nRingkasan alur:");
  console.log(results.map((line) => `  ${line}`).join("\n"));
  console.log(`\n${results.length} pemeriksaan lulus.`);

  await prisma.user.deleteMany({ where: { email: user.email } });
}

main()
  .catch((error) => {
    console.error("\nFLOW TEST GAGAL");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
