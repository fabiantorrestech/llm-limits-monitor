import type { UsageSnapshot, UsageWindow } from "@llm-limits/shared";
import { worstStatus } from "@llm-limits/shared";
import type { ProviderKeys } from "../keys";
import { errorSnapshot, type ProviderAdapter } from "./types";

const ID = "openrouter";
const LABEL = "OpenRouter";

/**
 * Reference adapter — OpenRouter exposes a real usage API.
 *   GET /api/v1/key      → this key's usage + credit limit + rate limit
 *   GET /api/v1/credits  → account-wide total credits purchased vs used
 * Docs: https://openrouter.ai/docs/api/reference/limits
 */
export const openrouter: ProviderAdapter = {
  id: ID,
  label: LABEL,
  isConfigured: (keys) => Boolean(keys.openrouter),

  async fetchUsage(keys: ProviderKeys): Promise<UsageSnapshot> {
    const apiKey = keys.openrouter;
    if (!apiKey) return errorSnapshot(ID, LABEL, "No OpenRouter API key configured");

    try {
      const headers = { Authorization: `Bearer ${apiKey}` };
      const [keyRes, creditsRes] = await Promise.all([
        fetch("https://openrouter.ai/api/v1/key", { headers }),
        fetch("https://openrouter.ai/api/v1/credits", { headers }),
      ]);

      if (!keyRes.ok) {
        return errorSnapshot(ID, LABEL, `key endpoint ${keyRes.status}`);
      }

      const keyJson = (await keyRes.json()) as {
        data?: { usage?: number; limit?: number | null };
      };
      const creditsJson = creditsRes.ok
        ? ((await creditsRes.json()) as {
            data?: { total_credits?: number; total_usage?: number };
          })
        : null;

      const windows: UsageWindow[] = [];

      // Per-key credit limit (if the key is capped).
      const keyUsage = keyJson.data?.usage ?? null;
      const keyLimit = keyJson.data?.limit ?? null;
      if (keyLimit !== null) {
        windows.push(usd("key-limit", "Key credit limit", keyUsage, keyLimit));
      }

      // Account-wide credits.
      const credits = creditsJson?.data;
      if (credits) {
        const used = credits.total_usage ?? null;
        const total = credits.total_credits ?? null;
        windows.push(usd("account-credits", "Account credits", used, total));
      }

      // If the key is uncapped and credits weren't available, still surface raw usage.
      if (windows.length === 0 && keyUsage !== null) {
        windows.push(usd("key-usage", "Key usage", keyUsage, null));
      }

      return {
        providerId: ID,
        label: LABEL,
        kind: "api",
        windows,
        status: worstStatus(windows),
        fetchedAt: new Date().toISOString(),
        raw: { key: keyJson, credits: creditsJson },
      };
    } catch (err) {
      return errorSnapshot(ID, LABEL, err instanceof Error ? err.message : "fetch failed");
    }
  },
};

function usd(id: string, label: string, used: number | null, limit: number | null): UsageWindow {
  const percent = used !== null && limit !== null && limit > 0 ? (used / limit) * 100 : null;
  return { id, label, used, limit, unit: "USD", percent, resetsAt: null };
}
