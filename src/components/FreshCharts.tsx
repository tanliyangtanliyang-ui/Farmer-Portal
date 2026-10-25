// Small SVG charts for freshness (no chart library). Shared copy in the Farmer and Buyer portals.
// All values passed in come from FarmXpress records; the shelf-life curve is the documented calculation
// (shelf life left = shelf life − days since harvest), drawn as a straight line from harvest to the end of shelf life.
import { useState } from 'react';

export type Tone = 'fresh' | 'use_soon' | 'urgent' | 'expired' | 'unknown';
export const TONE_HEX: Record<Tone, string> = { fresh: '#16a34a', use_soon: '#f59e0b', urgent: '#f97316', expired: '#dc2626', unknown: '#94a3b8' };
const DAY = 86_400_000;
const dnum = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`);
const short = (d: string) => new Date(dnum(d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Ring showing the share of shelf life left. */
export function ShelfRing({ pct, tone, size = 64, label, sub }: { pct: number | null; tone: Tone; size?: number; label?: string; sub?: string }) {
  const r = size / 2 - 6; const c = 2 * Math.PI * r; const v = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${v}% of shelf life left`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONE_HEX[tone]} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${(v / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray .6s ease' }} />
      <text x="50%" y={sub ? '46%' : '52%'} textAnchor="middle" dominantBaseline="middle" fontSize={size / 4.6} fontWeight="700" fill="#1e293b">{label ?? `${v}%`}</text>
      {sub && <text x="50%" y="68%" textAnchor="middle" fontSize={size / 11} fill="#64748b">{sub}</text>}
    </svg>
  );
}

export type Marker = { date: string; label: string; color?: string };
/** Shelf-life line from harvest (100%) to the last shelf-life day (0%), with today and event markers. Hover a marker for details. */
export function DecayCurve({ harvest, shelfDays, today, markers = [], height = 190 }: { harvest: string; shelfDays: number; today: string; markers?: Marker[]; height?: number }) {
  const [hover, setHover] = useState<Marker | null>(null);
  const W = 560; const H = height; const L = 34; const R = 12; const T = 12; const B = 28;
  const start = dnum(harvest); const end = start + shelfDays * DAY;
  const all = [today, ...markers.map((m) => m.date)].map(dnum);
  const xmax = Math.max(end, ...all) + DAY * 0.5;
  const x = (t: number) => L + ((t - start) / (xmax - start)) * (W - L - R);
  const pctAt = (t: number) => Math.max(0, Math.min(100, 100 - ((t - start) / DAY / shelfDays) * 100));
  const y = (p: number) => T + (1 - p / 100) * (H - T - B);
  const tNow = dnum(today);
  const zones = [{ from: 100, to: 50, c: '#dcfce7' }, { from: 50, to: 25, c: '#fef3c7' }, { from: 25, to: 0, c: '#ffedd5' }];
  const step = Math.max(1, Math.ceil(shelfDays / 7));
  const ticks = Array.from({ length: Math.floor(shelfDays / step) + 1 }, (_, i) => start + i * step * DAY);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Shelf-life line from harvest to end of shelf life">
        {zones.map((z) => <rect key={z.from} x={L} y={y(z.from)} width={W - L - R} height={y(z.to) - y(z.from)} fill={z.c} opacity="0.7" />)}
        {[100, 50, 25, 0].map((p) => <g key={p}><line x1={L} x2={W - R} y1={y(p)} y2={y(p)} stroke="#e2e8f0" /><text x={L - 4} y={y(p) + 3} fontSize="9" textAnchor="end" fill="#64748b">{p}%</text></g>)}
        {ticks.map((t) => <text key={t} x={x(t)} y={H - 10} fontSize="9" textAnchor="middle" fill="#64748b">{short(new Date(t).toISOString())}</text>)}
        <line x1={x(start)} y1={y(100)} x2={x(end)} y2={y(0)} stroke="#334155" strokeWidth="2" />
        {xmax > end && <line x1={x(end)} y1={y(0)} x2={W - R} y2={y(0)} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />}
        <line x1={x(tNow)} x2={x(tNow)} y1={T} y2={H - B} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x={x(tNow) + 6} y={Math.min(H - B - 4, y(pctAt(tNow)) + 20)} fontSize="9" fill="#0369a1" fontWeight="700">Today</text>
        <circle cx={x(tNow)} cy={y(pctAt(tNow))} r="5" fill="#0ea5e9" stroke="white" strokeWidth="1.5"><title>{`Today: ${Math.round(pctAt(tNow))}% of shelf life left`}</title></circle>
        {markers.map((m, i) => { const t = dnum(m.date); return (
          <g key={i} onMouseEnter={() => setHover(m)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
            <circle cx={x(t)} cy={y(pctAt(t))} r="6" fill={m.color ?? '#16a34a'} stroke="white" strokeWidth="1.5" />
            <circle cx={x(t)} cy={y(pctAt(t))} r="11" fill="transparent"><title>{`${m.label} · ${short(m.date)} · ${Math.round(pctAt(t))}% left`}</title></circle>
          </g>); })}
        <text x={x(end) - 6} y={y(0) - 16} fontSize="9" textAnchor="end" fill="#b91c1c">End of shelf life {short(new Date(end).toISOString())}</text>
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
        {markers.map((m, i) => <span key={i} className={`flex items-center gap-1 ${hover === m ? 'font-semibold text-slate-800' : ''}`}><span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color ?? '#16a34a' }} />{m.label} {short(m.date)}</span>)}
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" />Today</span>
      </div>
    </div>
  );
}

/** Small multi-series line chart (e.g. monthly freshness scores). */
export function LineChart({ labels, series, min = 0, max = 100, height = 150, unit = '' }: { labels: string[]; series: { name: string; color: string; values: (number | null)[] }[]; min?: number; max?: number; height?: number; unit?: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const W = 520; const H = height; const L = 30; const R = 10; const T = 10; const B = 22;
  const x = (i: number) => L + (labels.length < 2 ? 0.5 : i / (labels.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[720px]" onMouseLeave={() => setHi(null)}>
        {[min, (min + max) / 2, max].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e2e8f0" /><text x={L - 4} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#64748b">{Math.round(v)}</text></g>)}
        {labels.map((l, i) => <g key={l}>
          <text x={x(i)} y={H - 6} fontSize="9" textAnchor="middle" fill={hi === i ? '#0f172a' : '#64748b'}>{l}</text>
          <rect x={x(i) - 14} y={T} width="28" height={H - T - B} fill="transparent" onMouseEnter={() => setHi(i)} />
        </g>)}
        {hi !== null && <line x1={x(hi)} x2={x(hi)} y1={T} y2={H - B} stroke="#cbd5e1" />}
        {series.map((s) => {
          const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)] as const)).filter(Boolean) as (readonly [number, number])[];
          return <g key={s.name}>
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth="2" />
            {s.values.map((v, i) => v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={hi === i ? 4.5 : 3} fill={s.color} />)}
          </g>;
        })}
      </svg>
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 mt-1">
        {series.map((s) => <span key={s.name} className="flex items-center gap-1"><span className="w-3 h-0.5" style={{ background: s.color }} />{s.name}{hi !== null && s.values[hi] != null ? `: ${s.values[hi]}${unit}` : ''}</span>)}
        {hi !== null && <span className="text-slate-700 font-semibold">{labels[hi]}</span>}
      </div>
    </div>
  );
}

/** Scatter of freshness at harvest (x) vs at hub QC (y); points below the diagonal lost freshness on the way. */
export function FreshScatter({ points, height = 220 }: { points: { x: number; y: number; label: string; color?: string }[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const lo = Math.min(60, ...points.flatMap((p) => [p.x, p.y])) - 2; const hiV = 100;
  const W = 520; const H = height; const L = 34; const R = 10; const T = 10; const B = 28;
  const sx = (v: number) => L + ((v - lo) / (hiV - lo)) * (W - L - R); const sy = (v: number) => T + (1 - (v - lo) / (hiV - lo)) * (H - T - B);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={sx(lo)} y1={sy(lo)} x2={sx(hiV)} y2={sy(hiV)} stroke="#cbd5e1" strokeDasharray="4 3" />
        {[lo, 80, 90, 100].map((v) => <g key={v}><text x={L - 4} y={sy(v) + 3} fontSize="9" textAnchor="end" fill="#64748b">{Math.round(v)}</text><text x={sx(v)} y={H - 12} fontSize="9" textAnchor="middle" fill="#64748b">{Math.round(v)}</text></g>)}
        <text x={(W + L) / 2} y={H - 1} fontSize="9" textAnchor="middle" fill="#475569">Score at harvest</text>
        <text x="9" y={(H - B) / 2} fontSize="9" textAnchor="middle" fill="#475569" transform={`rotate(-90 9 ${(H - B) / 2})`}>Score at hub QC</text>
        {points.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={hover === i ? 6 : 4} fill={p.color ?? '#16a34a'} opacity={hover === null || hover === i ? 0.85 : 0.35}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-pointer"><title>{p.label}</title></circle>)}
      </svg>
      <p className="text-[11px] text-slate-500 h-4">{hover !== null ? points[hover].label : 'Hover a dot. Dots below the dashed line lost freshness between harvest and the hub check.'}</p>
    </div>
  );
}
