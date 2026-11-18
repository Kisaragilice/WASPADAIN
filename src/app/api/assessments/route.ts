import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";
import { assessmentSchema } from "@/lib/validators";
import { getCurrentUser } from "@/lib/auth/session";
import { scoreKab } from "@/lib/kab";
import { XP_RULES } from "@/lib/gamification";
import { awardBadges } from "@/lib/attempt";
import { grantXp } from "@/lib/xp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const limit = await checkRateLimit({
    key: `assessment:${user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const parsed = await parseBody(request, assessmentSchema);
  if ("response" in parsed) return parsed.response;
  const { type, answers } = parsed.data;

  const preTest = await prisma.assessment.findFirst({
    where: { userId: user.id, type: "PRE" },
    select: { id: true },
  });

  if (type === "POST") {
    if (!preTest) {
      return apiError("Selesaikan pre-test sebelum post-test.", 403);
    }
    const bongkarDone = await prisma.simulationAttempt.findFirst({
      where: {
        userId: user.id,
        status: "COMPLETED",
        bongkarCompletedAt: { not: null },
      },
      select: { id: true },
    });
    if (!bongkarDone) {
      return apiError(
        "Selesaikan minimal satu simulasi dan Mode Bongkar sebelum post-test.",
        403,
      );
    }
  }

  const result = scoreKab(answers);

  const { assessment, xpEarned } = await prisma.$transaction(async (tx) => {
    const created = await tx.assessment.create({
      data: {
        userId: user.id,
        type,
        answers,
        knowledge: result.knowledge,
        attitude: result.attitude,
        behavior: result.behavior,
        kabIndex: result.kabIndex,
      },
    });

    // XP is granted once per assessment type; retakes still record a new row.
    const grant = await grantXp(tx, user.id, {
      amount: XP_RULES.assessmentComplete,
      source: "ASSESSMENT",
      referenceId: type,
    });

    return { assessment: created, xpEarned: grant.amount };
  });

  const newBadges = await awardBadges(user.id);

  return NextResponse.json(
    {
      assessmentId: assessment.id,
      result,
      xpEarned,
      newBadges,
      redirectTo: type === "PRE" ? "/simulasi" : "/radar",
    },
    { status: 201 },
  );
}
