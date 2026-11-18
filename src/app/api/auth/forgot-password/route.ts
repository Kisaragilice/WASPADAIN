import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseBody } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validators";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  emailRateLimitKey,
  issuePasswordResetToken,
  RESET_TOKEN_TTL_MINUTES,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/service";

// Neutral wording: never claims an email was delivered, because delivery may be
// disabled on installations without Resend credentials.
const GENERIC_MESSAGE =
  "Jika email tersebut terdaftar, instruksi untuk mengatur ulang kata sandi akan dikirim ke alamat itu.";

export async function POST(request: Request) {
  const parsed = await parseBody(request, forgotPasswordSchema);
  if ("response" in parsed) return parsed.response;
  const { email } = parsed.data;
  const ip = getClientIp(request);

  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit({
      key: `forgot:ip:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    }),
    checkRateLimit({
      key: `forgot:email:${emailRateLimitKey(email)}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    }),
  ]);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSeconds);
  if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfterSeconds);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    // Errors are logged inside the service; the response stays identical so an
    // attacker cannot enumerate accounts or probe email configuration.
    try {
      const { token } = await issuePasswordResetToken(user.id);
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
        fallbackOrigin: new URL(request.url).origin,
      });
    } catch (error) {
      console.error("[auth] forgot-password failed to prepare reset", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  return NextResponse.json(
    { ok: true, message: GENERIC_MESSAGE },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
