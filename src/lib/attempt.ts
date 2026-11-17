import "server-only";

import type { Prisma, Scenario } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BADGES, XP_RULES } from "@/lib/gamification";
import type {
  RadarCategory,
  ScenarioConfig,
  ScenarioScene,
  SceneAction,
} from "@/lib/scenario/types";
import { interpolateDeep } from "@/lib/scenario/types";

export function resolveConfig(
  scenario: Pick<Scenario, "config" | "variantCount">,
  variantIndex: number,
) {
  const raw = scenario.config as unknown as ScenarioConfig;
  const count = Math.max(raw.variants.length, 1);
  const index = ((variantIndex % count) + count) % count;
  const variant = raw.variants[index];
  const resolved = interpolateDeep(raw, variant?.vars ?? {});
  return { config: resolved, index };
}

export function resolveAttemptConfig(
  scenario: Pick<Scenario, "config" | "variantCount">,
  variantIndex: number,
) {
  return resolveConfig(scenario, variantIndex);
}

export type StepResult =
  | {
      ok: true;
      completed: false;
      nextSceneId: string;
      feedback?: string;
      nextScene: ScenarioScene;
    }
  | {
      ok: true;
      completed: true;
      outcome: "SAFE" | "VULNERABLE";
      score: number;
      xpEarned: number;
      feedback: string;
      redFlagsTotal: number;
      newBadges: string[];
    }
  | { ok: false; error: string; status: number };

export async function startAttempt(params: {
  userId: string;
  scenario: Scenario;
  restart?: boolean;
}) {
  const { userId, scenario } = params;

  if (!params.restart) {
    const existing = await prisma.simulationAttempt.findFirst({
      where: { userId, scenarioId: scenario.id, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
    });
    if (existing) return existing;
  } else {
    await prisma.simulationAttempt.updateMany({
      where: { userId, scenarioId: scenario.id, status: "IN_PROGRESS" },
      data: { status: "ABANDONED" },
    });
  }

  const config = scenario.config as unknown as ScenarioConfig;
  const variantIndex = Math.floor(Math.random() * Math.max(config.variants.length, 1));

  return prisma.simulationAttempt.create({
    data: {
      userId,
      scenarioId: scenario.id,
      variantIndex,
      currentSceneId: config.startSceneId,
      redFlagsTotal: config.redFlags.length,
    },
  });
}

export async function submitStep(params: {
  userId: string;
  attemptId: string;
  sceneId: string;
  actionId: string;
}): Promise<StepResult> {
  const attempt = await prisma.simulationAttempt.findUnique({
    where: { id: params.attemptId },
    include: { scenario: true },
  });

  if (!attempt || attempt.userId !== params.userId) {
    return { ok: false, error: "Simulasi tidak ditemukan.", status: 404 };
  }
  if (attempt.status !== "IN_PROGRESS") {
    return { ok: false, error: "Simulasi ini sudah selesai.", status: 409 };
  }

  const { config } = resolveConfig(attempt.scenario, attempt.variantIndex);

  if (attempt.currentSceneId !== params.sceneId) {
    return {
      ok: false,
      error: "Langkah simulasi tidak sinkron. Muat ulang halaman.",
      status: 409,
    };
  }

  const scene = config.scenes.find((item) => item.id === params.sceneId);
  if (!scene) {
    return { ok: false, error: "Scene tidak ditemukan.", status: 404 };
  }

  const choice = scene.decision?.choices.find(
    (item) => item.id === params.actionId,
  );
  const plainAction: SceneAction | undefined =
    scene.action && scene.action.id === params.actionId ? scene.action : undefined;

  if (!choice && !plainAction) {
    return { ok: false, error: "Aksi tidak valid.", status: 422 };
  }

  const label = choice?.label ?? plainAction?.label ?? params.actionId;
  const verdict = choice?.verdict ?? plainAction?.verdict;
  const next = choice?.next ?? plainAction?.next ?? null;

  if (verdict) {
    await prisma.simulationResponse.create({
      data: {
        attemptId: attempt.id,
        sceneId: scene.id,
        actionId: params.actionId,
        label,
        verdict: verdict === "safe" ? "SAFE" : "VULNERABLE",
      },
    });

    if (next) {
      await prisma.simulationAttempt.update({
        where: { id: attempt.id },
        data: { currentSceneId: next },
      });
      const nextScene = config.scenes.find((item) => item.id === next);
      return {
        ok: true,
        completed: false,
        nextSceneId: next,
        feedback: choice?.feedback ?? plainAction?.label,
        nextScene: nextScene ?? scene,
      };
    }

    const responses = await prisma.simulationResponse.findMany({
      where: { attemptId: attempt.id },
    });
    const anyVulnerable = responses.some((item) => item.verdict === "VULNERABLE");
    const outcome = anyVulnerable ? "VULNERABLE" : "SAFE";
    const vulnerableDecisions = responses.filter(
      (item) => item.verdict === "VULNERABLE",
    ).length;
    const score = Math.max(0, 100 - vulnerableDecisions * 50);
    const xpEarned =
      outcome === "SAFE" ? XP_RULES.safeSimulation : XP_RULES.vulnerableSimulation;
    const categories: RadarCategory[] = anyVulnerable
      ? Array.from(new Set(config.redFlags.map((flag) => flag.category)))
      : [];

    await prisma.$transaction([
      prisma.simulationAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "COMPLETED",
          currentSceneId: null,
          outcome,
          score,
          xpEarned,
          redFlagsIdentified: outcome === "SAFE" ? config.redFlags.length : 0,
          vulnerableCategories: categories as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: params.userId },
        data: { xp: { increment: xpEarned } },
      }),
    ]);

    if (outcome === "SAFE" && attempt.scenario.badgeKey) {
      await prisma.userBadge
        .create({
          data: {
            userId: params.userId,
            badgeKey: attempt.scenario.badgeKey,
            scenarioId: attempt.scenarioId,
          },
        })
        .catch(() => null);
    }

    const newBadges = await awardBadges(params.userId);

    return {
      ok: true,
      completed: true,
      outcome,
      score,
      xpEarned,
      feedback:
        choice?.feedback ??
        plainAction?.label ??
        "Simulasi selesai. Pelajari pola jebakannya di Mode Bongkar.",
      redFlagsTotal: config.redFlags.length,
      newBadges: newBadges.filter(
        (key) => key !== attempt.scenario.badgeKey || outcome === "SAFE",
      ),
    };
  }

  await prisma.simulationAttempt.update({
    where: { id: attempt.id },
    data: { currentSceneId: next },
  });

  const nextScene = next
    ? config.scenes.find((item) => item.id === next)
    : undefined;
  if (!nextScene) {
    return { ok: false, error: "Alur simulasi berakhir tanpa hasil.", status: 500 };
  }

  return {
    ok: true,
    completed: false,
    nextSceneId: nextScene.id,
    nextScene,
  };
}

export async function awardBadges(userId: string): Promise<string[]> {
  const [attempts, badges, assessments, moduleProgress, publishedModules] =
    await Promise.all([
      prisma.simulationAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        include: { scenario: { select: { badgeKey: true } } },
        orderBy: { startedAt: "asc" },
      }),
      prisma.userBadge.findMany({ where: { userId }, select: { badgeKey: true } }),
      prisma.assessment.findMany({ where: { userId }, select: { type: true } }),
      prisma.moduleProgress.findMany({ where: { userId }, select: { moduleId: true } }),
      prisma.educationModule.findMany({
        where: { isPublished: true },
        select: { id: true },
      }),
    ]);

  const owned = new Set(badges.map((badge) => badge.badgeKey));
  const safeAttempts = attempts.filter((attempt) => attempt.outcome === "SAFE");
  const safeDistinctScenarios = new Set(
    safeAttempts.map((attempt) => attempt.scenarioId),
  );
  const assessmentTypes = new Set(assessments.map((item) => item.type));

  const eligible = new Set<string>();
  for (const attempt of safeAttempts) {
    if (attempt.scenario.badgeKey) eligible.add(attempt.scenario.badgeKey);
  }
  if (attempts[0]?.outcome === "SAFE") eligible.add("pelapor-cepat");
  if (safeDistinctScenarios.size >= 3) eligible.add("zero-click-hero");
  if (assessmentTypes.has("PRE") && assessmentTypes.has("POST")) {
    eligible.add("kab-tuntas");
  }
  if (
    publishedModules.length > 0 &&
    publishedModules.every((module) =>
      moduleProgress.some((progress) => progress.moduleId === module.id),
    )
  ) {
    eligible.add("modul-tuntas");
  }

  const toAward = Array.from(eligible).filter(
    (key) => !owned.has(key) && BADGES.some((badge) => badge.key === key),
  );

  for (const badgeKey of toAward) {
    await prisma.userBadge
      .create({ data: { userId, badgeKey } })
      .catch(() => null);
  }

  return toAward;
}
