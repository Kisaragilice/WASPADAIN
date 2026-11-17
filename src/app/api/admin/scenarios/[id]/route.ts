import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { adminScenarioSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);
  if (user.role !== "ADMIN") return apiError("Akses ditolak.", 403);

  const parsed = await parseBody(request, adminScenarioSchema);
  if ("response" in parsed) return parsed.response;
  if (Object.keys(parsed.data).length === 0) {
    return apiError("Tidak ada perubahan yang dikirim.", 422);
  }

  const { id } = await context.params;
  const existing = await prisma.scenario.findUnique({ where: { id } });
  if (!existing) return apiError("Skenario tidak ditemukan.", 404);

  const scenario = await prisma.scenario.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      slug: true,
      title: true,
      isPublished: true,
      difficulty: true,
      level: true,
      estimatedMinutes: true,
    },
  });

  return NextResponse.json({ scenario });
}
