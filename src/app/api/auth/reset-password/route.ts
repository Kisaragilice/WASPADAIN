import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { apiError, parseBody } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validators";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { consumePasswordResetToken } from "@/lib/auth/password-reset";

const INVALID_MESSAGE = "Tautan reset tidak valid atau sudah kedaluwarsa.";

export async function POST(request: Request) {
  const parsed = await parseBody(request, resetPasswordSchema);
  if ("response" in parsed) return parsed.response;

  const ip = getClientIp(request);
  const limit = await checkRateLimit({
    key: `reset:ip:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const passwordHash = await hash(parsed.data.password, 12);
  const userId = await consumePasswordResetToken({
    token: parsed.data.token,
    passwordHash,
  });

  if (!userId) return apiError(INVALID_MESSAGE, 400);

  return NextResponse.json(
    {
      ok: true,
      message:
        "Kata sandi berhasil diperbarui. Semua sesi lama sudah dikeluarkan.",
      redirectTo: "/masuk",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
