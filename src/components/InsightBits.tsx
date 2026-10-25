// Small shared pieces for the insight-driven Farmer pages.
import type { ReactNode } from 'react';
import { Loader2, Info } from 'lucide-react';

export function Kpi({ label, value, hint, icon: Icon, tint, testId }: { label: string; value: ReactNode; hint?: ReactNode; icon: typeof Info; tint: string; testId?: string }) {
  return (
    <div className="card p-5" data-testid={testId}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tint} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
      </div>
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function LoadState({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <div className="card p-8 flex items-center justify-center gap-2 text-slate-400 text-sm"><Loader2 className="w-5 h-5 animate-spin" /> Loading your records…</div>;
  if (error) return <div className="card p-5 border-red-200 bg-red-50 text-sm text-red-700" role="alert">Could not load your records: {error}</div>;
  return null;
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="text-[11px] text-slate-400 flex items-start gap-1.5 mt-3"><Info className="w-3.5 h-3.5 shrink-0 mt-px" /> <span>{children}</span></p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400 py-6 text-center">{children}</p>;
}

/** Simple paired bar chart (one or two series per category) with values on hover and a legend. */
export function Bars({ rows, series, height = 160 }: { rows: { label: string; values: number[] }[]; series: { name: string; className: string }[]; height?: number }) {
  const max = Math.max(1, ...rows.flatMap((r) => r.values));
  return (
    <div>
      <div className="flex items-end gap-3" style={{ height }}>
        {rows.map((r) => (
          <div key={r.label} className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end">
            <div className="flex items-end gap-1 w-full justify-center h-full">
              {r.values.map((v, i) => (
                <div key={i} title={`${series[i]?.name}: ${v.toLocaleString('en-MY')}`} className={`w-full max-w-[22px] rounded-t-md ${series[i]?.className}`} style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }} />
              ))}
            </div>
            <span className="text-[10px] text-slate-500 truncate w-full text-center">{r.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {series.map((s) => <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className={`w-2.5 h-2.5 rounded-sm ${s.className}`} />{s.name}</span>)}
      </div>
    </div>
  );
}

export function Meter({ value, className }: { value: number; className: string }) {
  return <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
