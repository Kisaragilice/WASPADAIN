import "server-only";

import type { Prisma, Scenario } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BADGES, XP_RULES } from "@/lib/gamification";
import { grantXp } from "@/lib/xp";
import {
  isUniqueConstraintError,
  StateConflictError,
} from "@/lib/prisma-errors";
import {
  computeEligibleBadgeKeys,
  scoreSimulation,
  type StepResponseRecord,
} from "@/lib/simulation";
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
      alreadyCompleted?: boolean;
    }
  | { ok: false; error: string; status: number };

class StepError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StepError";
    this.status = status;
  }
}

async function existingCompletedResult(
  attemptId: string,
  userId: string,
): Promise<StepResult | null> {
  const attempt = await prisma.simulationAttempt.findUnique({
    where: { id: attemptId },
    include: { scenario: true },
  });
  if (
    !attempt ||
    attempt.userId !== userId ||
    attempt.status !== "COMPLETED" ||
    !attempt.outcome
  ) {
    return null;
  }

  return {
    ok: true,
    completed: true,
    alreadyCompleted: true,
    outcome: attempt.outcome,
    score: attempt.score,
    xpEarned: attempt.xpEarned,
    feedback:
      "Simulasi ini sudah selesai. Hasil tersimpan tidak dihitung ulang.",
    redFlagsTotal: attempt.redFlagsTotal,
    newBadges: [],
  };
}

export async function startAttempt(params: {
  userId: string;
  scenario: Scenario;
  restart?: boolean;
}) {
  const { userId, scenario } = params;
  const lockKey = `${userId}:${scenario.id}`;

  try {
    return await prisma.$transaction(async (tx) => {
      // Serializes concurrent starts for the same user + scenario across all
      // application replicas that share this database.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      if (params.restart) {
        await tx.simulationAttempt.updateMany({
          where: { userId, scenarioId: scenario.id, status: "IN_PROGRESS" },
          data: { status: "ABANDONED" },
        });
      } else {
        const existing = await tx.simulationAttempt.findFirst({
          where: { userId, scenarioId: scenario.id, status: "IN_PROGRESS" },
          orderBy: { startedAt: "desc" },
        });
        if (existing) return existing;
      }

      const config = scenario.config as unknown as ScenarioConfig;
      const variantIndex = Math.floor(
        Math.random() * Math.max(config.variants.length, 1),
      );

      return tx.simulationAttempt.create({
        data: {
          userId,
          scenarioId: scenario.id,
          variantIndex,
          currentSceneId: config.startSceneId,
          redFlagsTotal: config.redFlags.length,
        },
      });
    });
  } catch (error) {
    // The partial unique index is a second line of defence. If another
    // replica won the race before our lock, return its active attempt.
    if (isUniqueConstraintError(error) && !params.restart) {
      const existing = await prisma.simulationAttempt.findFirst({
        where: { userId, scenarioId: scenario.id, status: "IN_PROGRESS" },
        orderBy: { startedAt: "desc" },
      });
      if (existing) return existing;
    }
    throw error;
  }
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
    const completed = await existingCompletedResult(attempt.id, params.userId);
    if (completed) return completed;
    return { ok: false, error: "Simulasi ini sudah selesai.", status: 409 };
  }

  const { config } = resolveConfig(attempt.scenario, attempt.variantIndex);

  if (attempt.currentSceneId !== params.sceneId) {
    const completed = await existingCompletedResult(attempt.id, params.userId);
    if (completed) return completed;
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
    scene.action && scene.action.id === params.actionId
      ? scene.action
      : undefined;

  if (!choice && !plainAction) {
    return { ok: false, error: "Aksi tidak valid.", status: 422 };
  }

  const label = choice?.label ?? plainAction?.label ?? params.actionId;
  const verdict = choice?.verdict ?? plainAction?.verdict;
  const next = choice?.next ?? plainAction?.next ?? null;
  const categories: RadarCategory[] =
    verdict === "vulnerable"
      ? (choice?.categories ??
        plainAction?.categories ??
        config.redFlags.map((flag) => flag.category))
      : [];

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      // Re-read inside the transaction and gate every write on the exact
      // scene the client answered. Only one concurrent request can win.
      const fresh = await tx.simulationAttempt.findUnique({
        where: { id: attempt.id },
        select: { status: true, currentSceneId: true, userId: true },
      });
      if (!fresh || fresh.userId !== params.userId) {
        throw new StepError("Simulasi tidak ditemukan.", 404);
      }
      if (fresh.status !== "IN_PROGRESS") {
        throw new StepError("Simulasi ini sudah selesai.", 409);
      }
      if (fresh.currentSceneId !== scene.id) {
        throw new StepError(
          "Langkah simulasi tidak sinkron. Muat ulang halaman.",
          409,
        );
      }

      if (verdict) {
        await tx.simulationResponse.create({
          data: {
            attemptId: attempt.id,
            sceneId: scene.id,
            actionId: params.actionId,
            label,
            verdict: verdict === "safe" ? "SAFE" : "VULNERABLE",
            radarCategories: categories as unknown as Prisma.InputJsonValue,
          },
        });

        if (next) {
          const advanced = await tx.simulationAttempt.updateMany({
            where: {
              id: attempt.id,
              status: "IN_PROGRESS",
              currentSceneId: scene.id,
            },
            data: { currentSceneId: next },
          });
          if (advanced.count !== 1) {
            throw new StepError(
              "Langkah simulasi tidak sinkron. Muat ulang halaman.",
              409,
            );
          }
          return {
            kind: "next" as const,
            nextSceneId: next,
            feedback: choice?.feedback ?? plainAction?.label,
          };
        }

        const responses = await tx.simulationResponse.findMany({
          where: { attemptId: attempt.id },
          select: {
            sceneId: true,
            actionId: true,
            verdict: true,
            radarCategories: true,
          },
        });
        const scored = scoreSimulation(
          responses.map((response) => ({
            sceneId: response.sceneId,
            actionId: response.actionId,
            verdict: response.verdict,
            radarCategories:
              (response.radarCategories as RadarCategory[] | null) ?? [],
          })) satisfies StepResponseRecord[],
          config.redFlags,
        );
        const xpEarned =
          scored.outcome === "SAFE"
            ? XP_RULES.safeSimulation
            : XP_RULES.vulnerableSimulation;

        const completed = await tx.simulationAttempt.updateMany({
          where: {
            id: attempt.id,
            status: "IN_PROGRESS",
            currentSceneId: scene.id,
          },
          data: {
            status: "COMPLETED",
            currentSceneId: null,
            outcome: scored.outcome,
            score: scored.score,
            xpEarned,
            redFlagsIdentified: scored.redFlagsIdentified,
            vulnerableCategories:
              scored.vulnerableCategories as unknown as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });
        if (completed.count !== 1) {
          throw new StepError(
            "Simulasi ini sudah diproses oleh permintaan lain.",
            409,
          );
        }

        await grantXp(tx, params.userId, {
          amount: xpEarned,
          source: "SIMULATION",
          referenceId: attempt.id,
        });

        return {
          kind: "completed" as const,
          scored,
          xpEarned,
          feedback:
            choice?.feedback ??
            plainAction?.label ??
            "Simulasi selesai. Pelajari pola jebakannya di Mode Bongkar.",
        };
      }

      if (!next) {
        throw new StepError("Alur simulasi berakhir tanpa hasil.", 500);
      }

      const advanced = await tx.simulationAttempt.updateMany({
        where: {
          id: attempt.id,
          status: "IN_PROGRESS",
          currentSceneId: scene.id,
        },
        data: { currentSceneId: next },
      });
      if (advanced.count !== 1) {
        throw new StepError(
          "Langkah simulasi tidak sinkron. Muat ulang halaman.",
          409,
        );
      }

      return { kind: "next" as const, nextSceneId: next, feedback: undefined };
    });

    if (outcome.kind === "next") {
      const nextScene = config.scenes.find(
        (item) => item.id === outcome.nextSceneId,
      );
      if (!nextScene) {
        return {
          ok: false,
          error: "Alur simulasi berakhir tanpa hasil.",
          status: 500,
        };
      }
      return {
        ok: true,
        completed: false,
        nextSceneId: nextScene.id,
        feedback: outcome.feedback,
        nextScene,
      };
    }

    if (outcome.scored.outcome === "SAFE" && attempt.scenario.badgeKey) {
      await prisma.userBadge.createMany({
        data: [
          {
            userId: params.userId,
            badgeKey: attempt.scenario.badgeKey,
            scenarioId: attempt.scenarioId,
          },
        ],
        skipDuplicates: true,
      });
    }

    const newBadges = await awardBadges(params.userId);

    return {
      ok: true,
      completed: true,
      outcome: outcome.scored.outcome,
      score: outcome.scored.score,
      xpEarned: outcome.xpEarned,
      feedback: outcome.feedback,
      redFlagsTotal: config.redFlags.length,
      newBadges: newBadges.filter(
        (key) =>
          key !== attempt.scenario.badgeKey ||
          outcome.scored.outcome === "SAFE",
      ),
    };
  } catch (error) {
    if (error instanceof StepError) {
      return { ok: false, error: error.message, status: error.status };
    }
    if (error instanceof StateConflictError) {
      const completed = await existingCompletedResult(
        attempt.id,
        params.userId,
      );
      if (completed) return completed;
      return { ok: false, error: error.message, status: 409 };
    }
    if (isUniqueConstraintError(error)) {
      const completed = await existingCompletedResult(
        attempt.id,
        params.userId,
      );
      if (completed) return completed;
      return {
        ok: false,
        error: "Langkah ini sudah diproses. Muat ulang halaman.",
        status: 409,
      };
    }
    throw error;
  }
}

export async function awardBadges(userId: string): Promise<string[]> {
  const [attempts, badges, assessments, moduleProgress, publishedModules] =
    await Promise.all([
      prisma.simulationAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        include: { scenario: { select: { badgeKey: true } } },
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
  const eligible = computeEligibleBadgeKeys({
    attempts: attempts.map((attempt) => ({
      outcome: attempt.outcome,
      scenarioId: attempt.scenarioId,
      scenario: { badgeKey: attempt.scenario.badgeKey },
    })),
    assessmentTypes: assessments.map((item) => item.type),
    completedModuleIds: moduleProgress.map((progress) => progress.moduleId),
    publishedModuleIds: publishedModules.map((module) => module.id),
  });

  const toAward = eligible.filter(
    (key) => !owned.has(key) && BADGES.some((badge) => badge.key === key),
  );

  if (toAward.length > 0) {
    await prisma.userBadge.createMany({
      data: toAward.map((badgeKey) => ({ userId, badgeKey })),
      skipDuplicates: true,
    });
  }

  return toAward;
}
