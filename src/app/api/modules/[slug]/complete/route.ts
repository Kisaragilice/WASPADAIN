import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { awardBadges } from "@/lib/attempt";
import { XP_RULES } from "@/lib/gamification";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const { slug } = await context.params;
  const material = await prisma.educationModule.findFirst({
    where: { slug, isPublished: true },
  });
  if (!material) return apiError("Modul tidak ditemukan.", 404);

  const existing = await prisma.moduleProgress.findUnique({
    where: { userId_moduleId: { userId: user.id, moduleId: material.id } },
    select: { id: true },
  });

  if (!existing) {
    await prisma.moduleProgress.create({
      data: { userId: user.id, moduleId: material.id },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: XP_RULES.moduleComplete } },
    });
  }

  const newBadges = await awardBadges(user.id);

  return NextResponse.json({
    completed: true,
    xpEarned: existing ? 0 : XP_RULES.moduleComplete,
    newBadges,
  });
}
