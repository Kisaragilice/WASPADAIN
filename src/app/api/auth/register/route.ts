import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { parseBody, apiError } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { createUserSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

const DUPLICATE_MESSAGE =
  "Email ini tidak dapat digunakan. Coba masuk atau pakai email lain.";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await checkRateLimit({
    key: `register:ip:${ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const parsed = await parseBody(request, registerSchema);
  if ("response" in parsed) return parsed.response;
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return apiError(DUPLICATE_MESSAGE, 409);

  const passwordHash = await hash(password, 12);
  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true },
    });

    await createUserSession(user.id);

    return NextResponse.json(
      {
        user,
        redirectTo: "/kab/pre-test",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // Concurrent registrations race on the unique email index.
    if (isUniqueConstraintError(error)) {
      return apiError(DUPLICATE_MESSAGE, 409);
    }
    throw error;
  }
}
