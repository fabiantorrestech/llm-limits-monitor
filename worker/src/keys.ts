import type { Env } from "./env";

/** The set of provider credentials resolved for a given user. */
export interface ProviderKeys {
  openrouter?: string;
  anthropic?: string;
  openai?: string;
  google?: string;
}

/**
 * Pluggable key-resolution seam.
 *
 * v1 (single-tenant): there is one implicit user, so we return the keys configured
 * as Worker secrets in `env`. To go multi-tenant later, swap this for a per-user
 * lookup (e.g. read encrypted keys from KV/D1 keyed by `userId`) — callers that
 * iterate providers don't change.
 */
export function getKeys(userId: string, env: Env): ProviderKeys {
  void userId; // unused in single-tenant; the seam keeps the signature stable.
  return {
    openrouter: env.OPENROUTER_API_KEY,
    anthropic: env.ANTHROPIC_ADMIN_KEY,
    openai: env.OPENAI_ADMIN_KEY,
    google: env.GOOGLE_API_KEY,
  };
}
