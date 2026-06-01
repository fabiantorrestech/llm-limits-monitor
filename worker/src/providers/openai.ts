import type { UsageSnapshot, UsageWindow } from "@llm-limits/shared";
import type { ProviderKeys } from "../keys";
import { errorSnapshot, type ProviderAdapter } from "./types";
import { monthStartUnix } from "./time";

const ID = "openai-api";
const LABEL = "OpenAI API";

/**
 * Developer-API spend for the current month via the OpenAI Costs API.
 * Requires an admin/org key. Surfaces spend with no limit/percent; degrades
 * to an error snapshot if unavailable.
 */
export const openai: ProviderAdapter = {
  id: ID,
  label: LABEL,
  isConfigured: (keys) => Boolean(keys.openai),

  async fetchUsage(keys: ProviderKeys): Promise<UsageSnapshot> {
    const key = keys.openai;
    if (!key) return errorSnapshot(ID, LABEL, "No OpenAI admin key configured");

    try {
      const url = new URL("https://api.openai.com/v1/organization/costs");
      url.searchParams.set("start_time", String(monthStartUnix()));
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) return errorSnapshot(ID, LABEL, `costs ${res.status}`);

      const json = (await res.json()) as {
        data?: Array<{ results?: Array<{ amount?: { value?: number } }> }>;
      };
      let spend = 0;
      for (const bucket of json.data ?? []) {
        for (const row of bucket.results ?? []) {
          if (typeof row.amount?.value === "number") spend += row.amount.value;
        }
      }
      spend = Math.round(spend * 100) / 100;

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
