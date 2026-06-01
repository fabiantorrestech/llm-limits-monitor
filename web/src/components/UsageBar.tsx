import type { UsageStatus } from "@llm-limits/shared";

const COLORS: Record<UsageStatus, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  critical: "bg-rose-500",
  unknown: "bg-slate-600",
};

/** A labeled progress bar for one usage window. */
export function UsageBar({
  label,
  used,
  limit,
  unit,
  percent,
  status,
  resetsAt,
}: {
  label: string;
  used: number | null;
  limit: number | null;
  unit: string;
  percent: number | null;
  status: UsageStatus;
  resetsAt: string | null;
}) {
  const pct = percent ?? 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums">
          {fmt(used, unit)}
          {limit !== null ? ` / ${fmt(limit, unit)}` : ""}
          {percent !== null ? ` (${percent.toFixed(0)}%)` : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full ${COLORS[status]} transition-all`}
          style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
        />
      </div>
      {resetsAt && (
        <div className="text-xs text-slate-500">Resets {new Date(resetsAt).toLocaleString()}</div>
      )}
    </div>
  );
}

function fmt(n: number | null, unit: string): string {
  if (n === null) return "—";
  if (unit === "USD") return `$${n.toFixed(2)}`;
  if (unit === "%") return `${n}%`;
  return `${n} ${unit}`;
}
