/** Bindings & secrets available to the Worker. Secrets are set via `wrangler secret put`. */
export interface Env {
  /** Origin allowed to call this Worker (CORS). Set in wrangler.toml [vars]. */
  ALLOWED_ORIGIN: string;

  /** Single-tenant gate: shared bearer token the PWA must send. (secret) */
  APP_SHARED_TOKEN?: string;

  /** Provider keys (all optional — a missing key just disables that provider). (secrets) */
  OPENROUTER_API_KEY?: string;
  ANTHROPIC_ADMIN_KEY?: string;
  OPENAI_ADMIN_KEY?: string;
  GOOGLE_API_KEY?: string;

  /** KV namespace for history snapshots (optional; history disabled if unbound). */
  HISTORY?: KVNamespace;
}
