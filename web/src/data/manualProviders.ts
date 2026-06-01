import type { ManualProviderDef } from "@llm-limits/shared";

/**
 * Consumer subscription plans with NO usage API. The dashboard renders these as
 * manual-entry cards with a one-tap deep-link to the real usage page (where you're
 * already logged in) so you can read the number and log it. Add more here freely.
 */
export const MANUAL_PROVIDERS: ManualProviderDef[] = [
  {
    providerId: "claude-pro",
    label: "Claude (Pro / Max)",
    usageUrl: "https://claude.ai/settings/usage",
    windows: [
      { id: "5h", label: "5-hour session", unit: "%" },
      { id: "weekly", label: "Weekly", unit: "%" },
    ],
  },
  {
    providerId: "chatgpt-plus",
    label: "ChatGPT (Plus)",
    usageUrl: "https://chatgpt.com/",
    windows: [{ id: "window", label: "Message window", unit: "messages" }],
  },
  {
    providerId: "gemini-advanced",
    label: "Gemini (Advanced)",
    usageUrl: "https://gemini.google.com/",
    windows: [{ id: "daily", label: "Daily", unit: "%" }],
  },
];
