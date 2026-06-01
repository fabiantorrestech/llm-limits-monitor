import type { Env } from "./env";

/**
 * Pluggable authentication seam.
 *
 * v1 (single-tenant): validate the single shared bearer token and return a fixed
 * user id. To go multi-tenant later, replace the body with real session/OAuth
 * verification that returns the authenticated user's id — callers don't change.
 *
 * Returns the userId on success, or null if the request is unauthenticated.
 */
export function authenticate(request: Request, env: Env): string | null {
  // If no token is configured, the proxy is wide open — refuse rather than leak keys.
  if (!env.APP_SHARED_TOKEN) return null;

  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  if (!timingSafeEqual(token, env.APP_SHARED_TOKEN)) return null;

  // Single implicit user in v1.
  return "default";
}

/** Constant-time string comparison to avoid leaking token length/content via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}
