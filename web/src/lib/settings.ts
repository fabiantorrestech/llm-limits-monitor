/** App settings persisted in localStorage (single device, single user). */
export interface Settings {
  /** Base URL of the Cloudflare Worker proxy, e.g. https://llm-limits-monitor.you.workers.dev */
  workerUrl: string;
  /** Shared bearer token the proxy requires. */
  token: string;
  /** Auto-refresh interval in seconds (0 disables auto-refresh). */
  refreshSeconds: number;
}

const KEY = "llm-limits.settings";

export const DEFAULT_SETTINGS: Settings = {
  workerUrl: "",
  token: "",
  refreshSeconds: 300,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
