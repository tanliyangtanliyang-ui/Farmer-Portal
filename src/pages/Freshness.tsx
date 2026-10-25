import { useMemo, useState } from 'react';
import { Leaf, Clock, AlertTriangle, Star, Thermometer, ArrowRight, Info } from 'lucide-react';
import { useFarmerInsights, kg, dateText, monthLabel, type FarmerInsights, type ShelfLife } from '../lib/insights';
import { LoadState, SourceNote, Empty } from '../components/InsightBits';
import { ShelfRing, DecayCurve, LineChart, FreshScatter, TONE_HEX, type Marker } from '../components/FreshCharts';

type Item = { id: string; name: string | null; kg: number; where: string; stage: string; harvest: string | null; shelf: number | null; f: ShelfLife;
  storage: string | null; markers: Marker[] };
const STATES: { key: 'all' | ShelfLife['state']; label: string; icon: typeof Leaf }[] = [
  { key: 'all', label: 'All', icon: Leaf }, { key: 'fresh', label: 'Fresh', icon: Leaf }, { key: 'use_soon', label: 'Use soon', icon: Clock },
  { key: 'urgent', label: 'Sell now', icon: AlertTriangle }, { key: 'expired', label: 'Past shelf life', icon: AlertTriangle },
];
const EV: Record<string, [string, string]> = { requested: ['Pickup requested', '#0ea5e9'], approved: ['Approved by hub', '#6366f1'], received: ['Received at hub', '#16a34a'], rejected: ['Rejected by hub', '#dc2626'] };

function buildItems(d: FarmerInsights): Item[] {
  const temp = (sc: string | null) => sc;
  const farm = d.live.produce.filter((p) => p.unrequested_kg > 0).map<Item>((p) => ({
    id: p.produce_id, name: p.product_name, kg: p.unrequested_kg, where: `On farm · ${p.farm_name ?? ''}`, stage: 'On farm', harvest: p.harvest_date, shelf: p.shelf_life_days,
    f: p.freshness, storage: temp(p.storage_class), markers: [{ date: p.harvest_date, label: 'Harvested', color: '#65a30d' }] }));
  const reqs = d.live.requests.filter((r) => ['requested', 'approved', 'received'].includes(r.status)).map<Item>((r) => ({
    id: r.request_id, name: r.product_name, kg: r.quantity_kg, where: `${r.status_label} · ${r.hub_name ?? r.hub_id}`, stage: r.status === 'received' ? 'At hub' : 'Pickup booked',
    harvest: r.harvest_date, shelf: r.shelf_life_days, f: r.freshness, storage: null,
    markers: [
      ...(r.harvest_date ? [{ date: r.harvest_date, label: 'Harvested', color: '#65a30d' }] : []),
      ...(r.events ?? []).filter((e) => EV[e.to_status]).map((e) => ({ date: e.at, label: EV[e.to_status][0], color: EV[e.to_status][1] })),
      ...(r.status !== 'received' && r.pickup_date ? [{ date: r.pickup_date, label: 'Planned pickup', color: '#a855f7' }] : []),
      ...(r.onward?.orders ?? []).filter((o) => o.delivered_at).map((o) => ({ date: o.delivered_at!, label: `Delivered to ${o.buyer_name ?? 'buyer'}`, color: '#0f766e' })),
    ] }));
  return [...farm, ...reqs];
}

export default function Freshness() {
  const { data, error, loading } = useFarmerInsights();
  const [state, setState] = useState<'all' | ShelfLife['state']>('all');
  const [product, setProduct] = useState('all');
  const [sel, setSel] = useState<string | null>(null);
  const items = useMemo(() => (data ? buildItems(data) : []), [data]);
  const products = [...new Set(items.map((i) => i.name ?? '—'))];
  const shown = items.filter((i) => (state === 'all' || i.f.state === state) && (product === 'all' || i.name === product)).sort((a, b) => (a.f.days_left ?? 99) - (b.f.days_left ?? 99));
  const current = items.find((i) => i.id === sel) ?? shown[0] ?? null;
  const count = (s: string) => items.filter((i) => s === 'all' || i.f.state === s).length;
  const ds = data?.dataset;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Freshness Monitor</h2>
        <p className="text-sm text-slate-400">Shelf life left for your produce now, and how fresh your past batches were when the hub checked them</p>
      </div>
      <LoadState loading={loading} error={error} />
      {data && ds && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" role="tablist" aria-label="Filter by freshness" data-testid="fresh-filters">
            {STATES.map((s) => {
              const Icon = s.icon; const active = state === s.key; const hex = s.key === 'all' ? '#334155' : TONE_HEX[s.key];
              return (
                <button key={s.key} role="tab" aria-selected={active} onClick={() => { setState(s.key); setSel(null); }}
                  className={`card p-4 text-left transition border-2 ${active ? 'shadow-soft' : 'border-transparent hover:shadow-soft'}`} style={{ borderColor: active ? hex : undefined }} data-testid={`fresh-filter-${s.key}`}>
                  <div className="flex items-center justify-between"><Icon className="w-4 h-4" style={{ color: hex }} /><span className="text-2xl font-extrabold text-slate-800">{count(s.key)}</span></div>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="card p-4 lg:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-800">Your produce now</h3>
                <select value={product} onChange={(e) => { setProduct(e.target.value); setSel(null); }} aria-label="Filter by product" className="rounded-lg border border-slate-200 bg-white text-slate-700 text-xs px-2 py-1">
                  <option value="all">All products</option>{products.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {shown.length === 0 ? <Empty>{items.length ? 'Nothing matches these filters.' : 'No produce on the farm or on its way to the hub. Register produce under My Products.'}</Empty> : (
                <ul className="space-y-2 max-h-[460px] overflow-y-auto pr-1" data-testid="freshness-items">
                  {shown.map((i) => (
                    <li key={i.id}>
                      <button onClick={() => setSel(i.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition ${current?.id === i.id ? 'border-brand-400 bg-brand-50' : 'border-slate-100 hover:bg-slate-50'}`} data-testid={`fresh-item-${i.id}`}>
                        <ShelfRing pct={i.f.pct_left} tone={i.f.state} size={54} label={i.f.days_left != null ? `${Math.max(0, i.f.days_left)}d` : '—'} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 text-sm">{i.name} · {kg(i.kg)}</p>
                          <p className="text-[11px] text-slate-500 truncate">{i.where}</p>
                          <p className="text-[11px] font-semibold mt-0.5" style={{ color: TONE_HEX[i.f.state] }}>{i.f.label}{i.f.pct_left != null ? ` · ${i.f.pct_left}% left` : ''}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5 lg:col-span-3" data-testid="freshness-detail">
              {!current ? <Empty>Select an item to see its shelf-life timeline.</Empty> : (
                <>
                  <div className="flex flex-wrap items-start gap-4">
                    <ShelfRing pct={current.f.pct_left} tone={current.f.state} size={92} sub={current.f.days_left != null ? `${Math.max(0, current.f.days_left)}/${current.shelf} days` : ''} />
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-extrabold text-slate-800">{current.name} · {kg(current.kg)}</p>
                      <p className="text-xs text-slate-500"><span className="font-mono">{current.id}</span> · {current.where}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                        <span className="chip bg-slate-100 text-slate-600">Harvested {dateText(current.harvest)}</span>
                        <span className="chip bg-slate-100 text-slate-600">{current.stage}</span>
                        <span className="chip" style={{ background: `${TONE_HEX[current.f.state]}22`, color: TONE_HEX[current.f.state] }}>{current.f.label}</span>
                      </div>
                    </div>
                  </div>
                  {current.harvest && current.shelf ? (
                    <div className="mt-4"><DecayCurve harvest={current.harvest} shelfDays={current.shelf} today={data.today} markers={current.markers} /></div>
                  ) : <Empty>Harvest date or shelf life not recorded.</Empty>}
                  {current.f.state === 'urgent' || current.f.state === 'use_soon' ? (
                    <p className="mt-3 text-xs rounded-lg bg-amber-50 text-amber-800 p-2.5 flex gap-2"><Thermometer className="w-4 h-4 shrink-0" />
                      {current.stage === 'On farm' ? 'Request a pickup soon (Pickup Schedule) so the hub can still sell it within shelf life.' : 'The hub can only sell it while it is within shelf life.'}</p>
                  ) : null}
                </>
              )}
              <SourceNote>{data.freshness_basis} No temperature or humidity sensors are connected on the farm.</SourceNote>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Freshness score per month (history)</h3>
              <p className="text-xs text-slate-400 mb-3">Average score out of 100, {dateText(ds.window.from)} – {dateText(ds.window.to)}</p>
              <LineChart labels={ds.monthly.map((m) => monthLabel(m.month).split(' ')[0])} min={60} max={100}
                series={[{ name: 'At harvest', color: '#65a30d', values: ds.monthly.map((m) => m.avg_harvest_freshness ?? null) },
                  { name: 'At hub QC', color: '#0ea5e9', values: ds.monthly.map((m) => m.avg_qc_freshness ?? null) }]} />
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-slate-800">Harvest vs hub check (latest {ds.qc_points?.length ?? 0} batches)</h3>
              <p className="text-xs text-slate-400 mb-2">Each dot is a batch; hover for product, date and hours to the hub</p>
              <FreshScatter points={(ds.qc_points ?? []).map((p) => ({ x: p.harvest, y: p.qc, color: p.result === 'pass' ? '#16a34a' : '#dc2626',
                label: `${p.product_name} ${p.batch_id} · ${dateText(p.harvest_at)} · ${p.harvest} → ${p.qc} after ${p.hours} h${p.result === 'pass' ? '' : ' · failed QC'}` }))} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> {ds.notes.freshness} Today is {dateText(data.today)}.</p>
        </>
      )}
    </div>
  );
}
