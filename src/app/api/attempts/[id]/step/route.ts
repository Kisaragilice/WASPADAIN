import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError, parseBody } from "@/lib/api";
import { attemptStepSchema } from "@/lib/validators";
import { submitStep } from "@/lib/attempt";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const parsed = await parseBody(request, attemptStepSchema);
  if ("response" in parsed) return parsed.response;

  const { id } = await context.params;
  if (!id) return apiError("ID simulasi tidak valid.", 400);

  const result = await submitStep({
    userId: user.id,
    attemptId: id,
    sceneId: parsed.data.sceneId,
    actionId: parsed.data.actionId,
  });

  if (!result.ok) {
    return apiError(result.error, result.status);
  }

  if (result.completed) {
    return NextResponse.json({
      completed: true,
      outcome: result.outcome,
      score: result.score,
      xpEarned: result.xpEarned,
      feedback: result.feedback,
      redFlagsTotal: result.redFlagsTotal,
      newBadges: result.newBadges,
      nextSceneId: null,
    });
  }

  return NextResponse.json({
    completed: false,
    nextSceneId: result.nextSceneId,
    feedback: result.feedback ?? null,
  });
}
