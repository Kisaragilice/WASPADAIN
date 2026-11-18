import assert from "node:assert/strict";
import test from "node:test";
import { SCENARIO_SEEDS, assertScenarioConfig } from "../../src/lib/scenario";
import {
  RADAR_CATEGORIES,
  type ScenarioConfig,
} from "../../src/lib/scenario/types";

const validCategories = new Set(RADAR_CATEGORIES.map((item) => item.key));

test("every seeded scenario passes structural validation", () => {
  assert.ok(SCENARIO_SEEDS.length >= 5);
  for (const seed of SCENARIO_SEEDS) {
    assert.doesNotThrow(() => assertScenarioConfig(seed), seed.slug);
  }
});

test("scenario slugs are unique", () => {
  const slugs = SCENARIO_SEEDS.map((seed) => seed.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("every vulnerable decision maps to at least one radar category", () => {
  for (const seed of SCENARIO_SEEDS) {
    const config = seed.config as ScenarioConfig;
    for (const scene of config.scenes) {
      for (const choice of scene.decision?.choices ?? []) {
        if (choice.verdict !== "vulnerable") continue;
        assert.ok(
          choice.categories && choice.categories.length > 0,
          `${seed.slug}/${scene.id}/${choice.id} must define categories`,
        );
        for (const category of choice.categories ?? []) {
          assert.ok(
            validCategories.has(category),
            `${seed.slug}/${scene.id}/${choice.id} has unknown category ${category}`,
          );
        }
      }
      if (scene.action?.verdict === "vulnerable") {
        const categories = scene.action.categories ?? [];
        assert.ok(
          categories.length > 0,
          `${seed.slug}/${scene.id} action must define categories`,
        );
        for (const category of categories) {
          assert.ok(validCategories.has(category));
        }
      }
    }
  }
});

test("every Bongkar step references a known scene and red flag", () => {
  for (const seed of SCENARIO_SEEDS) {
    const config = seed.config as ScenarioConfig;
    const sceneIds = new Set(config.scenes.map((scene) => scene.id));
    const flagIds = new Set(config.redFlags.map((flag) => flag.id));
    assert.ok(config.bongkar.steps.length > 0, seed.slug);
    for (const step of config.bongkar.steps) {
      assert.ok(sceneIds.has(step.sceneId), `${seed.slug}: unknown scene`);
      for (const flagId of step.flagIds) {
        assert.ok(flagIds.has(flagId), `${seed.slug}: unknown flag ${flagId}`);
      }
    }
  }
});
