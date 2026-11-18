import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

const MAX_BODY_BYTES = 64 * 1024;

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: message, details },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function internalApiError() {
  return apiError("Terjadi kesalahan pada server. Coba lagi nanti.", 500);
}

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return { response: apiError("Payload terlalu besar.", 413) };
  }

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
