import { SCENARIO_SEEDS } from "../src/lib/scenario";
import { KAB_QUESTIONS } from "../src/lib/kab";
import type { ScenarioConfig, ScenarioScene } from "../src/lib/scenario/types";
import { ensureTestUser, disconnectFixtures } from "./test-fixtures";

function kabAnswers() {
  const answers: Record<string, number | boolean> = {};
  for (const question of KAB_QUESTIONS) {
    if (question.type === "boolean") {
      answers[question.id] = Boolean(question.correct);
    } else if (question.reverse) {
      answers[question.id] = 1;
    } else {
      answers[question.id] = 5;
    }
  }
  return answers;
}

const BASE = process.env.BASE_URL ?? "http://localhost:3100";

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
  if (jar.size) headers.set("cookie", cookieHeader(jar));
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  saveCookies(jar, response);
  if (response.status !== (init.expected ?? 200)) {
    const text = await response.text();
    throw new Error(`${init.method ?? "GET"} ${path} → ${response.status}\n${text.slice(0, 400)}`);
  }
  return response;
}

function safeAction(scene: ScenarioScene) {
  if (scene.action) return scene.action;
  return (
    scene.decision?.choices.find((choice) => choice.verdict === "safe") ??
    scene.decision?.choices[0]
  );
}

async function main() {
  const creds = await ensureTestUser();
  const jar: Jar = new Map();
  await request("/api/auth/login", jar, {
    method: "POST",
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  console.log("PASS  login fixture uji");

  // Complete the pre-test once so the simulation catalog is unlocked; repeated
  // runs reuse the existing attempt and stay idempotent.
  await request("/api/assessments", jar, {
    method: "POST",
    body: JSON.stringify({ type: "PRE", answers: kabAnswers() }),
    expected: 201,
  });

  for (const seed of SCENARIO_SEEDS) {
    const config = seed.config as ScenarioConfig;
    const startResponse = await request("/api/attempts", jar, {
      method: "POST",
      body: JSON.stringify({ scenarioSlug: seed.slug, restart: true }),
      expected: 201,
    });
    const started = (await startResponse.json()) as {
      attemptId: string;
      currentSceneId: string;
    };

    let sceneId: string | null = started.currentSceneId;
    let completed = false;
    let outcome: string | null = null;
    let steps = 0;

    while (sceneId && !completed && steps < 15) {
      const scene = config.scenes.find((item) => item.id === sceneId);
      if (!scene) throw new Error(`[${seed.slug}] scene ${sceneId} tidak dikenal`);
      const action = safeAction(scene);
      if (!action) throw new Error(`[${seed.slug}] scene ${sceneId} tanpa aksi`);

      const response = await request(`/api/attempts/${started.attemptId}/step`, jar, {
        method: "POST",
        body: JSON.stringify({ sceneId, actionId: action.id }),
      });
      const data = (await response.json()) as {
        completed: boolean;
        nextSceneId: string | null;
        outcome?: string;
      };
      completed = data.completed;
      outcome = data.outcome ?? outcome;
      sceneId = data.nextSceneId;
      steps += 1;
    }

    if (!completed) throw new Error(`[${seed.slug}] tidak selesai dalam 15 langkah`);
    if (outcome !== "SAFE") throw new Error(`[${seed.slug}] outcome ${outcome}, bukan SAFE`);
    console.log(`PASS  ${seed.slug}: ${steps} langkah, hasil SAFE`);
  }

  console.log("\n5 skenario berhasil diselesaikan dengan jalur aman.");
}

main().catch((error) => {
  console.error("SCENARIO CHECK GAGAL");
  console.error(error);
  process.exitCode = 1;
}).finally(() => disconnectFixtures());
