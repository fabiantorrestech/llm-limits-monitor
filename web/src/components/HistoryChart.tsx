import { useMemo } from "react";
import type { HistoryPoint } from "@llm-limits/shared";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const SERIES_COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#c084fc"];

/** Plots percent-used over time for each provider/window series with data. */
export function HistoryChart({ points }: { points: HistoryPoint[] }) {
  const { rows, series } = useMemo(() => pivot(points), [points]);

  if (series.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No history yet — snapshots accumulate as the Worker's cron trigger runs.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="t" tickFormatter={(t) => new Date(t).toLocaleDateString()} stroke="#64748b" />
        <YAxis domain={[0, 100]} unit="%" stroke="#64748b" />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }}
          labelFormatter={(t) => new Date(t as string).toLocaleString()}
        />
        <Legend />
        {series.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

type Row = { t: string; [series: string]: number | string | null };

/** Pivot flat points into one row per timestamp, one column per provider:window. */
function pivot(points: HistoryPoint[]): { rows: Row[]; series: string[] } {
  const seriesSet = new Set<string>();
  const byTime = new Map<string, Row>();
  for (const p of points) {
    if (p.percent === null) continue;
    const key = `${p.providerId}:${p.windowId}`;
    seriesSet.add(key);
    const row = byTime.get(p.t) ?? { t: p.t };
    row[key] = p.percent;
    byTime.set(p.t, row);
  }
  const rows = [...byTime.values()].sort((a, b) => a.t.localeCompare(b.t));
  return { rows, series: [...seriesSet] };
}
