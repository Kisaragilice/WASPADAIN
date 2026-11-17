import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";
import { assessmentSchema } from "@/lib/validators";
import { getCurrentUser } from "@/lib/auth/session";
import { scoreKab } from "@/lib/kab";
import { XP_RULES } from "@/lib/gamification";
import { awardBadges } from "@/lib/attempt";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

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
    const completedAttempt = await prisma.simulationAttempt.findFirst({
      where: { userId: user.id, status: "COMPLETED" },
      select: { id: true },
    });
    if (!completedAttempt) {
      return apiError(
        "Selesaikan minimal satu simulasi dan Mode Bongkar sebelum post-test.",
        403,
      );
    }
  }

  const result = scoreKab(answers);

  const existsSameType = await prisma.assessment.findFirst({
    where: { userId: user.id, type },
    select: { id: true },
  });

  const assessment = await prisma.assessment.create({
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

  let xpEarned = 0;
  if (!existsSameType) {
    xpEarned = XP_RULES.assessmentComplete;
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: xpEarned } },
    });
  }

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
