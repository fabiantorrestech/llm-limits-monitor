import { lazy, Suspense, useState } from "react";
import { loadSettings, saveSettings, type Settings } from "./lib/settings";
import { useUsage, useHistory } from "./hooks/useUsage";
import { MANUAL_PROVIDERS } from "./data/manualProviders";
import { ProviderCard } from "./components/ProviderCard";
import { ManualCard } from "./components/ManualCard";
import { SettingsPanel } from "./components/SettingsPanel";

// Recharts is heavy and the history chart is behind a toggle — load it on demand.
const HistoryChart = lazy(() =>
  import("./components/HistoryChart").then((m) => ({ default: m.HistoryChart })),
);

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const usage = useUsage(settings);
  const history = useHistory(settings, showHistory);

  const configured = Boolean(settings.workerUrl && settings.token);

  function persist(s: Settings) {
    saveSettings(s);
    setSettings(s);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">LLM Limits Monitor</h1>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700 disabled:opacity-50"
              onClick={() => usage.refetch()}
              disabled={!configured || usage.isFetching}
            >
              {usage.isFetching ? "Refreshing…" : "↻ Refresh"}
            </button>
            <button
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
              onClick={() => setShowSettings(true)}
            >
              ⚙ Settings
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {!configured && (
          <div className="mb-6 rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm text-amber-200">
            Set your Worker URL and token in <strong>Settings</strong> to start polling
            API-backed providers. Manual cards below work without any setup.
          </div>
        )}

        {usage.isError && (
          <div className="mb-6 rounded-xl border border-rose-700/50 bg-rose-950/30 p-4 text-sm text-rose-200">
            {(usage.error as Error).message}
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            API-backed
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usage.data?.snapshots.map((s) => <ProviderCard key={s.providerId} snapshot={s} />)}
            {configured && usage.data?.snapshots.length === 0 && (
              <p className="text-sm text-slate-500">
                No API providers configured on the Worker yet.
              </p>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Consumer plans (manual)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MANUAL_PROVIDERS.map((def) => (
              <ManualCard key={def.providerId} def={def} />
            ))}
          </div>
        </section>

        <section>
          <button
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
            onClick={() => setShowHistory((v) => !v)}
          >
            History {showHistory ? "▾" : "▸"}
          </button>
          {showHistory && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              {history.isLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : (
                <Suspense fallback={<p className="text-sm text-slate-500">Loading chart…</p>}>
                  <HistoryChart points={history.data?.points ?? []} />
                </Suspense>
              )}
            </div>
          )}
        </section>
      </main>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={persist}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
