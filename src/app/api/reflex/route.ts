import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";
import { reflexSchema } from "@/lib/validators";
import { getCurrentUser } from "@/lib/auth/session";
import { QUICK_REFLEX_QUESTIONS } from "@/lib/scenario";
import { XP_RULES } from "@/lib/gamification";
import { grantXp } from "@/lib/xp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const limit = await checkRateLimit({
    key: `reflex:${user.id}`,
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const parsed = await parseBody(request, reflexSchema);
  if ("response" in parsed) return parsed.response;

  const question = QUICK_REFLEX_QUESTIONS.find(
    (item) => item.id === parsed.data.questionId,
  );
  if (!question) return apiError("Pertanyaan tidak ditemukan.", 404);

  const choice = question.options.find(
    (item) => item.id === parsed.data.choiceId,
  );
  if (!choice) return apiError("Pilihan tidak valid.", 422);

  const xpEarned = await prisma.$transaction(async (tx) => {
    let granted = 0;
    if (choice.correct) {
      // Only the first correct answer per question earns XP.
      const result = await grantXp(tx, user.id, {
        amount: XP_RULES.reflexCorrect,
        source: "REFLEX",
        referenceId: question.id,
      });
      granted = result.amount;
    }

    await tx.reflexAttempt.create({
      data: {
        userId: user.id,
        questionId: question.id,
        choiceId: choice.id,
        isCorrect: choice.correct,
        xpEarned: granted,
      },
    });

    return granted;
  });

  return NextResponse.json({
    correct: choice.correct,
    explanation: choice.explanation,
    xpEarned,
  });
}
