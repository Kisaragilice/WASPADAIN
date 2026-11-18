import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { awardBadges } from "@/lib/attempt";
import { XP_RULES } from "@/lib/gamification";
import { grantXp } from "@/lib/xp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const limit = await checkRateLimit({
    key: `module-complete:${user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const { slug } = await context.params;
  const material = await prisma.educationModule.findFirst({
    where: { slug, isPublished: true },
  });
  if (!material) return apiError("Modul tidak ditemukan.", 404);

  const xpEarned = await prisma.$transaction(async (tx) => {
    await tx.moduleProgress.createMany({
      data: [{ userId: user.id, moduleId: material.id }],
      skipDuplicates: true,
    });

    // First completion only. The ledger reference makes the grant idempotent
    // even when two tabs complete the module simultaneously.
    const grant = await grantXp(tx, user.id, {
      amount: XP_RULES.moduleComplete,
      source: "MODULE",
      referenceId: material.id,
    });

    return grant.amount;
  });

  const newBadges = await awardBadges(user.id);

  return NextResponse.json({
    completed: true,
    xpEarned,
    newBadges,
  });
}
