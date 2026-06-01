import type { UsageSnapshot } from "@llm-limits/shared";
import type { ProviderKeys } from "../keys";
import { errorSnapshot, type ProviderAdapter } from "./types";

const ID = "google-api";
const LABEL = "Google AI API";

/**
 * Google does not expose a simple per-key usage/spend endpoint comparable to the
 * others (usage lives in Cloud Billing / quotas, which need a service account and
 * project setup). For v1 we surface a clear "not available" state when a key is
 * present rather than pretend. This adapter is the seam to flesh out later if you
 * wire up the Cloud Billing / Monitoring APIs.
 */
export const google: ProviderAdapter = {
  id: ID,
  label: LABEL,
  isConfigured: (keys) => Boolean(keys.google),

  async fetchUsage(_keys: ProviderKeys): Promise<UsageSnapshot> {
    return errorSnapshot(
      ID,
      LABEL,
      "Google has no simple usage API — track Gemini in the console, or wire up Cloud Billing later.",
    );
  },
};
