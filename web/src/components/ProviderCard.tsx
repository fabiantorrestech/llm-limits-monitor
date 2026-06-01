import type { UsageSnapshot } from "@llm-limits/shared";
import { statusFromPercent } from "@llm-limits/shared";
import { UsageBar } from "./UsageBar";

/** Card for an API-backed provider (live data from the Worker). */
export function ProviderCard({ snapshot }: { snapshot: UsageSnapshot }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">{snapshot.label}</h3>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">API</span>
      </div>

      {snapshot.error ? (
        <p className="text-sm text-amber-400">{snapshot.error}</p>
      ) : snapshot.windows.length === 0 ? (
        <p className="text-sm text-slate-500">No data.</p>
      ) : (
        <div className="space-y-3">
          {snapshot.windows.map((w) => (
            <UsageBar
              key={w.id}
              label={w.label}
              used={w.used}
              limit={w.limit}
              unit={w.unit}
              percent={w.percent}
              status={statusFromPercent(w.percent)}
              resetsAt={w.resetsAt}
            />
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-slate-600">
        Updated {new Date(snapshot.fetchedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
