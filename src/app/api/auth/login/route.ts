import { NextResponse } from "next/server";
import { compare, hashSync } from "bcryptjs";
import { prisma } from "@/lib/db";
import { parseBody, apiError } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { createUserSession, setPasswordChangePending } from "@/lib/auth/session";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { emailRateLimitKey } from "@/lib/auth/password-reset";

// Compared against when the account does not exist so both branches spend
// roughly the same time in bcrypt and cannot be distinguished by timing.
const DUMMY_HASH = hashSync("waspadain-dummy-password", 12);

const INVALID_CREDENTIALS = "Email atau kata sandi salah.";

export async function POST(request: Request) {
  const parsed = await parseBody(request, loginSchema);
  if ("response" in parsed) return parsed.response;
  const { email, password } = parsed.data;
  const ip = getClientIp(request);

  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit({ key: `login:ip:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 }),
    checkRateLimit({
      key: `login:email:${emailRateLimitKey(email)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    }),
  ]);
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSeconds);
  if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfterSeconds);

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    return apiError(INVALID_CREDENTIALS, 401);
  }

  await createUserSession(user.id);
  if (user.mustChangePassword) {
    await setPasswordChangePending();
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      mustChangePassword: user.mustChangePassword,
      redirectTo: user.mustChangePassword
        ? "/ubah-sandi"
        : user.role === "ADMIN"
          ? "/admin"
          : "/simulasi",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
