import assert from "node:assert/strict";
import test from "node:test";
import {
  computeEligibleBadgeKeys,
  safeScenarioCount,
  scoreSimulation,
  type BadgeContext,
} from "../../src/lib/simulation";

const redFlags = [
  { category: "format_tautan" as const },
  { category: "tekanan_waktu" as const },
];

test("safe simulation scores 100 and identifies all red flags", () => {
  const result = scoreSimulation(
    [
      { sceneId: "s1", actionId: "a1", verdict: "SAFE" },
      { sceneId: "s2", actionId: "a2", verdict: "SAFE" },
    ],
    redFlags,
  );

  assert.equal(result.outcome, "SAFE");
  assert.equal(result.score, 100);
  assert.equal(result.redFlagsIdentified, 2);
  assert.equal(result.vulnerableDecisions, 0);
  assert.deepEqual(result.vulnerableCategories, []);
});

test("each vulnerable decision removes 50 points and unions categories", () => {
  const result = scoreSimulation(
    [
      {
        sceneId: "s1",
        actionId: "a1",
        verdict: "VULNERABLE",
        radarCategories: ["format_tautan"],
      },
      {
        sceneId: "s2",
        actionId: "a2",
        verdict: "VULNERABLE",
        radarCategories: ["format_tautan", "data_rahasia"],
      },
    ],
    redFlags,
  );

  assert.equal(result.outcome, "VULNERABLE");
  assert.equal(result.score, 0);
  assert.equal(result.vulnerableDecisions, 2);
  assert.equal(result.redFlagsIdentified, 0);
  assert.deepEqual(result.vulnerableCategories.sort(), [
    "data_rahasia",
    "format_tautan",
  ]);
});

test("score never drops below zero for many mistakes", () => {
  const result = scoreSimulation(
    Array.from({ length: 5 }, (_, index) => ({
      sceneId: `s${index}`,
      actionId: "a",
      verdict: "VULNERABLE" as const,
      radarCategories: ["tekanan_waktu" as const],
    })),
    redFlags,
  );
  assert.equal(result.score, 0);
});

test("legacy responses without radar categories fall back to scenario flags", () => {
  const result = scoreSimulation(
    [{ sceneId: "s1", actionId: "a1", verdict: "VULNERABLE" }],
    redFlags,
  );
  assert.deepEqual(result.vulnerableCategories.sort(), [
    "format_tautan",
    "tekanan_waktu",
  ]);
});

test("per-choice categories take precedence over scenario fallback", () => {
  const result = scoreSimulation(
    [
      {
        sceneId: "s1",
        actionId: "a1",
        verdict: "VULNERABLE",
        radarCategories: ["umpan_hadiah"],
      },
    ],
    redFlags,
  );
  assert.deepEqual(result.vulnerableCategories, ["umpan_hadiah"]);
});

test("pelapor-cepat unlocks on any later safe completion", () => {
  const context: BadgeContext = {
    attempts: [
      {
        outcome: "VULNERABLE",
        scenarioId: "sc-1",
        scenario: { badgeKey: "detektif-apk" },
      },
      {
        outcome: "SAFE",
        scenarioId: "sc-2",
        scenario: { badgeKey: "penjaga-otp" },
      },
    ],
    assessmentTypes: [],
    completedModuleIds: [],
    publishedModuleIds: ["m1", "m2"],
  };
  const keys = computeEligibleBadgeKeys(context);
  assert.ok(keys.includes("pelapor-cepat"));
  assert.ok(keys.includes("penjaga-otp"));
  assert.ok(!keys.includes("detektif-apk"));
  assert.ok(!keys.includes("modul-tuntas"));
});

test("zero-click-hero needs three distinct safe scenarios", () => {
  const attempts = [1, 2, 3].map((index) => ({
    outcome: "SAFE",
    scenarioId: `sc-${index}`,
    scenario: { badgeKey: null },
  }));
  assert.equal(safeScenarioCount(attempts), 3);
  const keys = computeEligibleBadgeKeys({
    attempts,
    assessmentTypes: [],
    completedModuleIds: [],
    publishedModuleIds: [],
  });
  assert.ok(keys.includes("zero-click-hero"));
});

test("repeating one safe scenario does not unlock zero-click-hero", () => {
  const attempts = [1, 2, 3].map(() => ({
    outcome: "SAFE",
    scenarioId: "same",
    scenario: { badgeKey: null },
  }));
  assert.equal(safeScenarioCount(attempts), 1);
  const keys = computeEligibleBadgeKeys({
    attempts,
    assessmentTypes: [],
    completedModuleIds: [],
    publishedModuleIds: [],
  });
  assert.ok(!keys.includes("zero-click-hero"));
});

test("KAB and module badges require completing both sides", () => {
  const base = {
    attempts: [],
    assessmentTypes: ["PRE"],
    completedModuleIds: ["m1"],
    publishedModuleIds: ["m1", "m2"],
  } satisfies BadgeContext;
  const partial = computeEligibleBadgeKeys(base);
  assert.ok(!partial.includes("kab-tuntas"));
  assert.ok(!partial.includes("modul-tuntas"));

  const complete = computeEligibleBadgeKeys({
    ...base,
    assessmentTypes: ["PRE", "POST"],
    completedModuleIds: ["m1", "m2"],
  });
  assert.ok(complete.includes("kab-tuntas"));
  assert.ok(complete.includes("modul-tuntas"));
});
