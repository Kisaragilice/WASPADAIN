import assert from "node:assert/strict";
import test from "node:test";
import {
  BADGES,
  RANKS,
  XP_RULES,
  getBadge,
  getRank,
} from "../../src/lib/gamification";

test("rank starts at level 1 for new users", () => {
  const rank = getRank(0);
  assert.equal(rank.current.name, "Kadet Pengamat");
  assert.equal(rank.level, 1);
  assert.equal(rank.next?.name, "Letnan Waspada");
  assert.equal(rank.progress, 0);
  assert.equal(rank.xpForNext, 100);
});

test("rank boundaries are inclusive", () => {
  assert.equal(getRank(99).current.name, "Kadet Pengamat");
  assert.equal(getRank(100).current.name, "Letnan Waspada");
  assert.equal(getRank(249).current.name, "Letnan Waspada");
  assert.equal(getRank(250).current.name, "Kapten Siaga");
});

test("highest rank reports full progress and no next rank", () => {
  const last = RANKS[RANKS.length - 1];
  const rank = getRank(last.minXp + 500);
  assert.equal(rank.current.name, last.name);
  assert.equal(rank.next, null);
  assert.equal(rank.progress, 100);
  assert.equal(rank.level, RANKS.length);
  assert.equal(rank.xpForNext, 0);
});

test("progress is monotonic inside a rank", () => {
  const low = getRank(100).progress;
  const mid = getRank(175).progress;
  const high = getRank(249).progress;
  assert.ok(low <= mid && mid <= high);
  assert.ok(high <= 100);
});

test("XP rules preserve the documented economy", () => {
  assert.deepEqual(XP_RULES, {
    safeSimulation: 60,
    vulnerableSimulation: 15,
    reflexCorrect: 10,
    moduleComplete: 20,
    assessmentComplete: 30,
  });
});

test("badge keys are unique and resolvable", () => {
  const keys = BADGES.map((badge) => badge.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const key of keys) {
    assert.equal(getBadge(key)?.key, key);
  }
  assert.equal(getBadge("tidak-ada"), undefined);
});

test("pelapor-cepat copy reflects the any-safe-completion rule", () => {
  const badge = getBadge("pelapor-cepat");
  assert.ok(badge);
  assert.match(badge.description, /minimal satu simulasi/i);
  assert.match(badge.hint, /tidak mengunci/i);
});
