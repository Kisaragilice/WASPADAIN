import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { apiError, parseBody } from "@/lib/api";
import {
  passwordChangeSchema,
  profileSchema,
} from "@/lib/validators";
import {
  getCurrentUser,
  revokeOtherSessions,
  clearPasswordChangePending,
} from "@/lib/auth/session";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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

  const limit = await checkRateLimit({
    key: `password-change:${user.id}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

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
    data: {
      passwordHash: await hash(parsed.data.newPassword, 12),
      mustChangePassword: false,
    },
  });

  // The device that changed the password stays signed in; every other session
  // is revoked so a stolen cookie cannot outlive the change.
  const revoked = await revokeOtherSessions(user.id);
  await clearPasswordChangePending();

  return NextResponse.json({ ok: true, revokedSessions: revoked.count });
}
