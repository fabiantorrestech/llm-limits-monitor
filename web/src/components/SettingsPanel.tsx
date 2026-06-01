import { useState } from "react";
import type { Settings } from "../lib/settings";

/** Settings drawer: Worker URL, shared token, and auto-refresh interval. */
export function SettingsPanel({
  settings,
  onSave,
  onClose,
}: {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Settings>(settings);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Settings</h2>

        <label className="mb-3 block text-sm text-slate-300">
          Worker URL
          <input
            className="mt-1 w-full rounded bg-slate-800 px-3 py-2 text-slate-100"
            placeholder="https://llm-limits-monitor.you.workers.dev"
            value={draft.workerUrl}
            onChange={(e) => setDraft({ ...draft, workerUrl: e.target.value })}
          />
        </label>

        <label className="mb-3 block text-sm text-slate-300">
          Shared token
          <input
            className="mt-1 w-full rounded bg-slate-800 px-3 py-2 text-slate-100"
            type="password"
            value={draft.token}
            onChange={(e) => setDraft({ ...draft, token: e.target.value })}
          />
        </label>

        <label className="mb-6 block text-sm text-slate-300">
          Auto-refresh (seconds, 0 = off)
          <input
            className="mt-1 w-full rounded bg-slate-800 px-3 py-2 text-slate-100"
            type="number"
            min={0}
            value={draft.refreshSeconds}
            onChange={(e) => setDraft({ ...draft, refreshSeconds: Number(e.target.value) })}
          />
        </label>

        <div className="flex gap-2">
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Save
          </button>
          <button
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-600"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
