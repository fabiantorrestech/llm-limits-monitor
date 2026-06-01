import { useState } from "react";
import type { ManualProviderDef } from "@llm-limits/shared";
import { statusFromPercent } from "@llm-limits/shared";
import { getReading, saveReading } from "../lib/manualStore";
import { UsageBar } from "./UsageBar";

/**
 * Card for a consumer plan with no API. Shows the last manually-logged reading,
 * a deep-link to the real usage page, and a small form to update the reading.
 */
export function ManualCard({ def }: { def: ManualProviderDef }) {
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">{def.label}</h3>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Manual</span>
      </div>

      <div className="space-y-4">
        {def.windows.map((w) => {
          const reading = getReading(def.providerId, w.id);
          const percent =
            reading && reading.limit > 0 ? (reading.used / reading.limit) * 100 : null;
          return (
            <div key={w.id} className="space-y-2">
              <UsageBar
                label={w.label}
                used={reading?.used ?? null}
                limit={reading?.limit ?? null}
                unit={w.unit}
                percent={percent}
                status={statusFromPercent(percent)}
                resetsAt={reading?.resetsAt ?? null}
              />
              <ReadingForm
                providerId={def.providerId}
                windowId={w.id}
                onSaved={rerender}
              />
            </div>
          );
        })}
      </div>

      <a
        href={def.usageUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Open usage page ↗
      </a>
    </div>
  );
}

function ReadingForm({
  providerId,
  windowId,
  onSaved,
}: {
  providerId: string;
  windowId: string;
  onSaved: () => void;
}) {
  const existing = getReading(providerId, windowId);
  const [used, setUsed] = useState(existing?.used?.toString() ?? "");
  const [limit, setLimit] = useState(existing?.limit?.toString() ?? "");
  const [resetsAt, setResetsAt] = useState(existing?.resetsAt ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = parseFloat(used);
    const l = parseFloat(limit);
    if (Number.isNaN(u) || Number.isNaN(l)) return;
    saveReading({
      providerId,
      windowId,
      used: u,
      limit: l,
      resetsAt: resetsAt || null,
      loggedAt: new Date().toISOString(),
    });
    onSaved();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 text-sm">
      <input
        className="w-20 rounded bg-slate-800 px-2 py-1 text-slate-100"
        placeholder="used"
        inputMode="decimal"
        value={used}
        onChange={(e) => setUsed(e.target.value)}
      />
      <span className="text-slate-500">/</span>
      <input
        className="w-20 rounded bg-slate-800 px-2 py-1 text-slate-100"
        placeholder="limit"
        inputMode="decimal"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
      />
      <input
        className="rounded bg-slate-800 px-2 py-1 text-slate-100"
        type="datetime-local"
        value={resetsAt ? toLocalInput(resetsAt) : ""}
        onChange={(e) => setResetsAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
      />
      <button className="rounded bg-slate-700 px-2 py-1 text-slate-100 hover:bg-slate-600">
        Log
      </button>
    </form>
  );
}

/** Convert an ISO string to the value format a datetime-local input expects. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}
