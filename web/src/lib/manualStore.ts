import type { ManualReading } from "@llm-limits/shared";

/**
 * Manual readings for consumer plans (Claude Pro/Max, ChatGPT Plus, Gemini) are
 * stored client-side — there's no API to fetch them. Keyed by `providerId:windowId`
 * so the latest reading per window wins.
 */
const KEY = "llm-limits.manualReadings";

type Store = Record<string, ManualReading>;

function readStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getReading(providerId: string, windowId: string): ManualReading | undefined {
  return readStore()[`${providerId}:${windowId}`];
}

export function getAllReadings(): ManualReading[] {
  return Object.values(readStore());
}

export function saveReading(reading: ManualReading): void {
  const store = readStore();
  store[`${reading.providerId}:${reading.windowId}`] = reading;
  writeStore(store);
}
