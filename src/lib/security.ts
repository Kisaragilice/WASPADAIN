const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isMutationMethod(method: string) {
  return MUTATION_METHODS.has(method.toUpperCase());
}

function requestHost(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) return forwardedHost.split(",")[0]?.trim().toLowerCase();
  return request.headers.get("host")?.trim().toLowerCase() ?? null;
}

/**
 * Validates the Origin header for cookie-authenticated mutations. Requests
 * from non-browser clients (scripts) that send neither Origin nor
 * Sec-Fetch-Site are allowed; browsers cannot omit Origin on cross-site
 * unsafe requests.
 */
export function isTrustedMutationRequest(request: Request) {
  if (!isMutationMethod(request.method)) return true;

  const origin = request.headers.get("origin");
  if (!origin) {
    const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
    return !fetchSite || fetchSite !== "cross-site";
  }
  if (origin === "null") return false;

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  const host = requestHost(request);
  if (!host) return false;
  if (parsed.host.toLowerCase() !== host) return false;

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto && parsed.protocol !== `${forwardedProto}:`) {
    return false;
  }

  return parsed.protocol === "https:" || parsed.protocol === "http:";
}
