import type { UsageSnapshot } from "@llm-limits/shared";
import type { ProviderKeys } from "../keys";
import type { ProviderAdapter } from "./types";
import { openrouter } from "./openrouter";
import { anthropic } from "./anthropic";
import { openai } from "./openai";
import { google } from "./google";

/** All API-backed provider adapters. Add new providers here. */
export const adapters: ProviderAdapter[] = [openrouter, anthropic, openai, google];

/** Run every configured adapter in parallel; unconfigured ones are skipped. */
export async function fetchAllUsage(keys: ProviderKeys): Promise<UsageSnapshot[]> {
  const active = adapters.filter((a) => a.isConfigured(keys));
  return Promise.all(active.map((a) => a.fetchUsage(keys)));
}

/** Run a single adapter by id, or null if unknown. */
export async function fetchOneUsage(
  id: string,
  keys: ProviderKeys,
): Promise<UsageSnapshot | null> {
  const adapter = adapters.find((a) => a.id === id);
  if (!adapter) return null;
  return adapter.fetchUsage(keys);
}
