import type { UsageSnapshot, UsageWindow } from "@llm-limits/shared";
import type { ProviderKeys } from "../keys";
import { errorSnapshot, type ProviderAdapter } from "./types";
import { monthStartISO } from "./time";

const ID = "anthropic-api";
const LABEL = "Anthropic API";

/**
 * Developer-API spend for the current month via the Anthropic Admin cost report.
 * Requires an Admin API key. API billing has no fixed ceiling, so we surface spend
 * with no limit/percent. Degrades to an error snapshot if the org doesn't expose it.
 * Docs: https://platform.claude.com/docs/en/api/ (admin usage & cost reports)
 */
export const anthropic: ProviderAdapter = {
  id: ID,
  label: LABEL,
  isConfigured: (keys) => Boolean(keys.anthropic),

  async fetchUsage(keys: ProviderKeys): Promise<UsageSnapshot> {
    const key = keys.anthropic;
    if (!key) return errorSnapshot(ID, LABEL, "No Anthropic admin key configured");

    try {
      const url = new URL("https://api.anthropic.com/v1/organizations/cost_report");
      url.searchParams.set("starting_at", monthStartISO());
      const res = await fetch(url, {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      });
      if (!res.ok) return errorSnapshot(ID, LABEL, `cost_report ${res.status}`);

      const json = (await res.json()) as { data?: Array<{ results?: Array<Record<string, unknown>> }> };
      const spend = sumAmounts(json.data);
      const window: UsageWindow = {
        id: "monthly-spend",
        label: "Spend this month",
        used: spend,
        limit: null,
        unit: "USD",
        percent: null,
        resetsAt: null,
      };
      return {
        providerId: ID,
        label: LABEL,
        kind: "api",
        windows: [window],
        status: "ok",
        fetchedAt: new Date().toISOString(),
        raw: json,
      };
    } catch (err) {
      return errorSnapshot(ID, LABEL, err instanceof Error ? err.message : "fetch failed");
    }
  },
};

/** Defensively sum any numeric `amount` fields across the report's result rows. */
function sumAmounts(data: Array<{ results?: Array<Record<string, unknown>> }> | undefined): number {
  let total = 0;
  for (const bucket of data ?? []) {
    for (const row of bucket.results ?? []) {
      const amount = row.amount;
      if (typeof amount === "number") total += amount;
      else if (typeof amount === "string" && !Number.isNaN(parseFloat(amount))) total += parseFloat(amount);
    }
  }
  return Math.round(total * 100) / 100;
}
