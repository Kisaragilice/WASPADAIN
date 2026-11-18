import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Marks Mode Bongkar as reviewed for a completed attempt. Idempotent so the
 * client can call it on mount and again when the user finishes.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const limit = await checkRateLimit({
    key: `bongkar:${user.id}`,
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const { id } = await context.params;
  if (!id) return apiError("ID simulasi tidak valid.", 400);

  const attempt = await prisma.simulationAttempt.findUnique({
    where: { id },
    select: { userId: true, status: true, bongkarCompletedAt: true },
  });
  if (!attempt || attempt.userId !== user.id) {
    return apiError("Simulasi tidak ditemukan.", 404);
  }
  if (attempt.status !== "COMPLETED") {
    return apiError("Simulasi belum selesai.", 409);
  }

  const completedAt = attempt.bongkarCompletedAt ?? new Date();
  if (!attempt.bongkarCompletedAt) {
    await prisma.simulationAttempt.updateMany({
      where: { id, userId: user.id, status: "COMPLETED", bongkarCompletedAt: null },
      data: { bongkarCompletedAt: completedAt },
    });
  }

  return NextResponse.json(
    { ok: true, bongkarCompletedAt: completedAt },
    { headers: { "Cache-Control": "no-store" } },
  );
}
