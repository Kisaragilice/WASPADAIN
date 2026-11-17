import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";
import {
  passwordChangeSchema,
  profileSchema,
} from "@/lib/validators";
import { getCurrentUser } from "@/lib/auth/session";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const parsed = await parseBody(request, profileSchema);
  if ("response" in parsed) return parsed.response;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ user: updated });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Silakan masuk terlebih dahulu.", 401);

  const parsed = await parseBody(request, passwordChangeSchema);
  if ("response" in parsed) return parsed.response;

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return apiError("Akun tidak ditemukan.", 404);

  const valid = await compare(parsed.data.currentPassword, record.passwordHash);
  if (!valid) return apiError("Kata sandi saat ini salah.", 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.newPassword, 12) },
  });

  return NextResponse.json({ ok: true });
}
