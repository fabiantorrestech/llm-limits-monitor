import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Settings } from "../lib/settings";

/**
 * Auto-refresh + manual refresh in one place. `refetchInterval` drives the
 * periodic poll; the returned `refetch` powers the manual refresh button.
 */
export function useUsage(settings: Settings) {
  return useQuery({
    queryKey: ["usage", settings.workerUrl],
    queryFn: () => api.usage(settings),
    enabled: Boolean(settings.workerUrl && settings.token),
    refetchInterval: settings.refreshSeconds > 0 ? settings.refreshSeconds * 1000 : false,
  });
}

export function useHistory(settings: Settings, enabled: boolean) {
  return useQuery({
    queryKey: ["history", settings.workerUrl],
    queryFn: () => api.history(settings),
    enabled: enabled && Boolean(settings.workerUrl && settings.token),
  });
}
