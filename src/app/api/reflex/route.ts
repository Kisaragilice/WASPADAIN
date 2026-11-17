import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";
import { reflexSchema } from "@/lib/validators";
import { getCurrentUser } from "@/lib/auth/session";
import { QUICK_REFLEX_QUESTIONS } from "@/lib/scenario";
import { XP_RULES } from "@/lib/gamification";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

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

  const alreadyCorrect = await prisma.reflexAttempt.findFirst({
    where: {
      userId: user.id,
      questionId: question.id,
      isCorrect: true,
    },
    select: { id: true },
  });

  const xpEarned =
    choice.correct && !alreadyCorrect ? XP_RULES.reflexCorrect : 0;

  await prisma.reflexAttempt.create({
    data: {
      userId: user.id,
      questionId: question.id,
      choiceId: choice.id,
      isCorrect: choice.correct,
      xpEarned,
    },
  });

  if (xpEarned > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: xpEarned } },
    });
  }

  return NextResponse.json({
    correct: choice.correct,
    explanation: choice.explanation,
    xpEarned,
  });
}
