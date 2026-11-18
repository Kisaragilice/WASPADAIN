import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";
import { attemptCreateSchema } from "@/lib/validators";
import { getCurrentUser } from "@/lib/auth/session";
import { startAttempt } from "@/lib/attempt";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const limit = await checkRateLimit({
    key: `attempt-start:${user.id}`,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const parsed = await parseBody(request, attemptCreateSchema);
  if ("response" in parsed) return parsed.response;
  const { scenarioSlug, restart } = parsed.data;

  const preTest = await prisma.assessment.findFirst({
    where: { userId: user.id, type: "PRE" },
    select: { id: true },
  });
  if (!preTest) {
    return NextResponse.json(
      {
        error: "Selesaikan pre-test KAB terlebih dahulu.",
        redirectTo: "/kab/pre-test",
      },
      { status: 403 },
    );
  }

  const scenario = await prisma.scenario.findFirst({
    where: { slug: scenarioSlug, isPublished: true },
  });
  if (!scenario) return apiError("Skenario tidak ditemukan.", 404);

  const attempt = await startAttempt({
    userId: user.id,
    scenario,
    restart,
  });

  return NextResponse.json(
    {
      attemptId: attempt.id,
      currentSceneId: attempt.currentSceneId,
      redirectTo: `/simulasi/${scenario.slug}`,
    },
    { status: 201 },
  );
}
