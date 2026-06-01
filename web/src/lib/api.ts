import type { UsageResponse, HistoryResponse } from "@llm-limits/shared";
import type { Settings } from "./settings";

/** Thin client for the Worker proxy. Throws on non-2xx so React Query surfaces errors. */
async function get<T>(settings: Settings, path: string): Promise<T> {
  if (!settings.workerUrl) throw new Error("Worker URL not configured (open Settings)");
  const res = await fetch(`${settings.workerUrl.replace(/\/$/, "")}${path}`, {
    headers: { Authorization: `Bearer ${settings.token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized — check your token in Settings");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export const api = {
  usage: (s: Settings) => get<UsageResponse>(s, "/api/usage"),
  history: (s: Settings) => get<HistoryResponse>(s, "/api/history"),
  health: (s: Settings) => get<{ ok: boolean }>(s, "/api/health"),
};
