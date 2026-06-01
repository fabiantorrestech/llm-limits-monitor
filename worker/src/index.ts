import type { UsageResponse, HistoryResponse } from "@llm-limits/shared";
import type { Env } from "./env";
import { authenticate } from "./auth";
import { getKeys } from "./keys";
import { fetchAllUsage, fetchOneUsage } from "./providers";
import { recordSnapshots, readHistory } from "./history";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");

    // CORS preflight.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    const url = new URL(request.url);

    // Public health check (no auth) so the PWA can verify connectivity.
    if (url.pathname === "/api/health") {
      return json(env, origin, { ok: true });
    }

    // Everything else requires auth.
    const userId = authenticate(request, env);
    if (!userId) {
      return json(env, origin, { error: "unauthorized" }, 401);
    }
    const keys = getKeys(userId, env);

    if (url.pathname === "/api/usage") {
      const snapshots = await fetchAllUsage(keys);
      const body: UsageResponse = { snapshots, generatedAt: new Date().toISOString() };
      return json(env, origin, body);
    }

    const oneMatch = url.pathname.match(/^\/api\/usage\/([\w-]+)$/);
    if (oneMatch) {
      const snapshot = await fetchOneUsage(oneMatch[1], keys);
      if (!snapshot) return json(env, origin, { error: "unknown provider" }, 404);
      return json(env, origin, snapshot);
    }

    if (url.pathname === "/api/history") {
      const points = await readHistory(env);
      const body: HistoryResponse = { points };
      return json(env, origin, body);
    }

    return json(env, origin, { error: "not found" }, 404);
  },

  /** Cron Trigger: snapshot usage so history accrues even while the app is closed. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const keys = getKeys("default", env);
        const snapshots = await fetchAllUsage(keys);
        await recordSnapshots(env, snapshots);
      })(),
    );
  },
};

function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  // Echo the origin only if it matches the configured allow-list; else lock down.
  const allow = origin && origin === env.ALLOWED_ORIGIN ? origin : env.ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(env: Env, origin: string | null, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env, origin) },
  });
}
