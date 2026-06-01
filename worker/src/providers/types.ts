import type { UsageSnapshot } from "@llm-limits/shared";
import type { ProviderKeys } from "../keys";

/**
 * A provider adapter knows how to call one provider's API and normalize the
 * response into a `UsageSnapshot`. Adapters never throw — they return a snapshot
 * with an `error` field so one failing provider can't break the whole dashboard.
 */
export interface ProviderAdapter {
  /** Stable provider id, matches UsageSnapshot.providerId. */
  id: string;
  /** Display name. */
  label: string;
  /** Whether this provider has a usable key in the resolved key set. */
  isConfigured(keys: ProviderKeys): boolean;
  /** Fetch + normalize. Must resolve (never reject) with a snapshot. */
  fetchUsage(keys: ProviderKeys): Promise<UsageSnapshot>;
}

/** Helper: build a uniform "fetch failed" snapshot. */
export function errorSnapshot(id: string, label: string, message: string): UsageSnapshot {
  return {
    providerId: id,
    label,
    kind: "api",
    windows: [],
    status: "unknown",
    fetchedAt: new Date().toISOString(),
    error: message,
  };
}
