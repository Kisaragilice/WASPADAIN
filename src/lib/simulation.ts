import type { RadarCategory } from "./scenario/types";

export interface StepResponseRecord {
  sceneId: string;
  actionId: string;
  verdict: "SAFE" | "VULNERABLE";
  radarCategories?: RadarCategory[] | null;
}

export interface SimulationScore {
  outcome: "SAFE" | "VULNERABLE";
  score: number;
  vulnerableCategories: RadarCategory[];
  redFlagsIdentified: number;
  vulnerableDecisions: number;
}

/**
 * Pure scoring engine shared by the API, tests, and reporting views.
 * Keeping it free of Prisma makes the concurrency-sensitive code easier to
 * verify and prevents scoring rules from drifting between callers.
 */
export function scoreSimulation(
  responses: StepResponseRecord[],
  redFlags: { category: RadarCategory }[],
): SimulationScore {
  const vulnerableResponses = responses.filter(
    (response) => response.verdict === "VULNERABLE",
  );
  const outcome = vulnerableResponses.length > 0 ? "VULNERABLE" : "SAFE";

  const categories = new Set<RadarCategory>();
  for (const response of vulnerableResponses) {
    for (const category of response.radarCategories ?? []) {
      categories.add(category);
    }
  }

  // Legacy responses (created before per-choice mapping) fall back to the
  // scenario-level red flags so the radar never silently loses data.
  if (outcome === "VULNERABLE" && categories.size === 0) {
    for (const flag of redFlags) categories.add(flag.category);
  }

  return {
    outcome,
    score: Math.max(0, 100 - vulnerableResponses.length * 50),
    vulnerableCategories: Array.from(categories),
    redFlagsIdentified: outcome === "SAFE" ? redFlags.length : 0,
    vulnerableDecisions: vulnerableResponses.length,
  };
}

export interface BadgeAttempt {
  outcome: string | null;
  scenarioId: string;
  scenario: { badgeKey: string | null };
}

export interface BadgeContext {
  attempts: BadgeAttempt[];
  assessmentTypes: string[];
  completedModuleIds: string[];
  publishedModuleIds: string[];
}

/**
 * Badge rules used by awardBadges. "pelapor-cepat" deliberately unlocks on
 * any safe completion: the old rule only looked at the earliest attempt, so a
 * single early mistake locked the badge forever.
 */
export function computeEligibleBadgeKeys({
  attempts,
  assessmentTypes,
  completedModuleIds,
  publishedModuleIds,
}: BadgeContext): string[] {
  const eligible = new Set<string>();
  const safeAttempts = attempts.filter((attempt) => attempt.outcome === "SAFE");
  for (const attempt of safeAttempts) {
    if (attempt.scenario.badgeKey) eligible.add(attempt.scenario.badgeKey);
  }

  const assessmentSet = new Set(assessmentTypes);
  if (safeAttempts.length > 0) eligible.add("pelapor-cepat");
  if (safeScenarioCount(attempts) >= 3) eligible.add("zero-click-hero");
  if (assessmentSet.has("PRE") && assessmentSet.has("POST")) {
    eligible.add("kab-tuntas");
  }
  if (
    publishedModuleIds.length > 0 &&
    publishedModuleIds.every((id) => completedModuleIds.includes(id))
  ) {
    eligible.add("modul-tuntas");
  }

  return Array.from(eligible);
}

/** Distinct scenario ids with at least one safe completion. */
export function safeScenarioCount(attempts: { outcome: string | null; scenarioId: string }[]) {
  return new Set(
    attempts
      .filter((attempt) => attempt.outcome === "SAFE")
      .map((attempt) => attempt.scenarioId),
  ).size;
}
