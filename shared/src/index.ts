/**
 * Shared types — the single source of truth for the data shape exchanged between
 * the Cloudflare Worker proxy and the PWA frontend. Defined once here and imported
 * by both `/worker` and `/web` so the normalized contract never drifts.
 */

/** How a provider's usage is sourced. */
export type ProviderKind =
  /** Auto-polled from an official API via the Worker proxy. */
  | "api"
  /** No API exists (consumer subscription plans) — tracked via manual entry + deep-link. */
  | "manual";

/** Health bucket derived from `percent`, used for card coloring. */
export type UsageStatus = "ok" | "warn" | "critical" | "unknown";

/** A single usage window for a provider (some providers expose several, e.g. 5h + weekly). */
export interface UsageWindow {
  /** Stable id, e.g. "5h", "weekly", "monthly-spend". */
  id: string;
  /** Human label, e.g. "5-hour session", "Weekly", "Monthly spend". */
  label: string;
  /** Amount consumed so far in this window (in `unit`). */
  used: number | null;
  /** Allowance for this window in `unit`, or null if unknown/unmetered. */
  limit: number | null;
  /** Unit of `used`/`limit`, e.g. "USD", "tokens", "requests", "messages". */
  unit: string;
  /** 0–100, computed when both used and limit are known. */
  percent: number | null;
  /** ISO timestamp when this window resets, if known. */
  resetsAt: string | null;
}

/** A normalized snapshot of one provider's usage at a point in time. */
export interface UsageSnapshot {
  /** Provider id, e.g. "openrouter", "anthropic-api", "claude-pro". */
  providerId: string;
  /** Display name, e.g. "OpenRouter", "Claude Pro". */
  label: string;
  kind: ProviderKind;
  /** One or more usage windows. Empty if data couldn't be fetched. */
  windows: UsageWindow[];
  /** Overall status, typically the worst across windows. */
  status: UsageStatus;
  /** ISO timestamp when this snapshot was produced. */
  fetchedAt: string;
  /** Present when an API fetch failed; the card renders an error state. */
  error?: string;
  /** Raw provider payload for debugging; never relied on by the UI. */
  raw?: unknown;
}

/** Response shape for `GET /api/usage`. */
export interface UsageResponse {
  snapshots: UsageSnapshot[];
  /** ISO timestamp the Worker assembled this response. */
  generatedAt: string;
}

/** A point in the stored time-series, used by the history chart. */
export interface HistoryPoint {
  providerId: string;
  windowId: string;
  t: string; // ISO timestamp
  used: number | null;
  limit: number | null;
  percent: number | null;
}

/** Response shape for `GET /api/history`. */
export interface HistoryResponse {
  points: HistoryPoint[];
}

/** Metadata describing a manual (consumer-plan) provider rendered by the frontend. */
export interface ManualProviderDef {
  providerId: string;
  label: string;
  /** URL the "Open usage page" button deep-links to (user is already logged in there). */
  usageUrl: string;
  /** Default windows to prompt the user to fill, e.g. 5h + weekly for Claude. */
  windows: { id: string; label: string; unit: string }[];
}

/** A manual reading the user logged for a consumer plan (persisted client-side). */
export interface ManualReading {
  providerId: string;
  windowId: string;
  used: number;
  limit: number;
  resetsAt: string | null;
  loggedAt: string;
}

/** Derive a status bucket from a percentage. */
export function statusFromPercent(percent: number | null): UsageStatus {
  if (percent === null || Number.isNaN(percent)) return "unknown";
  if (percent >= 90) return "critical";
  if (percent >= 70) return "warn";
  return "ok";
}

/** Worst-case status across a set of windows. */
export function worstStatus(windows: UsageWindow[]): UsageStatus {
  const order: UsageStatus[] = ["unknown", "ok", "warn", "critical"];
  return windows.reduce<UsageStatus>((worst, w) => {
    const s = statusFromPercent(w.percent);
    return order.indexOf(s) > order.indexOf(worst) ? s : worst;
  }, "ok");
}
