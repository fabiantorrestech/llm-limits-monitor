import type { HistoryPoint, UsageSnapshot } from "@llm-limits/shared";
import type { Env } from "./env";

const PREFIX = "h:"; // key layout: h:<isoTimestamp>
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Append a batch of snapshots to the KV history as one timestamped record.
 * No-op if KV isn't bound (history is an optional feature).
 */
export async function recordSnapshots(env: Env, snapshots: UsageSnapshot[]): Promise<void> {
  if (!env.HISTORY) return;
  const now = new Date().toISOString();
  const points: HistoryPoint[] = [];
  for (const s of snapshots) {
    for (const w of s.windows) {
      points.push({
        providerId: s.providerId,
        windowId: w.id,
        t: now,
        used: w.used,
        limit: w.limit,
        percent: w.percent,
      });
    }
  }
  if (points.length === 0) return;
  // Expire individual records automatically via KV TTL.
  await env.HISTORY.put(`${PREFIX}${now}`, JSON.stringify(points), {
    expirationTtl: Math.floor(RETENTION_MS / 1000),
  });
}

/** Read all retained history points, newest listing order not guaranteed. */
export async function readHistory(env: Env): Promise<HistoryPoint[]> {
  if (!env.HISTORY) return [];
  const list = await env.HISTORY.list({ prefix: PREFIX });
  const records = await Promise.all(
    list.keys.map((k) => env.HISTORY!.get(k.name, "json") as Promise<HistoryPoint[] | null>),
  );
  return records.flatMap((r) => r ?? []);
}
