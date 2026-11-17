import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: apiError("Body JSON tidak valid.", 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      response: apiError(
        parsed.error.issues[0]?.message ?? "Data tidak valid.",
        422,
        parsed.error.flatten(),
      ),
    };
  }
  return { data: parsed.data };
}
