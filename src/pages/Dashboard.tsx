import { Package, Truck, ShoppingCart, MapPin, Leaf, ArrowRight, TrendingUp, Star, BarChart3, Lightbulb, History } from 'lucide-react';
import { useFarmerInsights, kg, rm, dateText, shelfTone } from '../lib/insights';
import { Kpi, LoadState, SourceNote, Empty } from '../components/InsightBits';

interface DashboardProps {
  onNavigate: (page: 'products' | 'freshness' | 'pickup' | 'analytics') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { data, error, loading } = useFarmerInsights();
  const hour = Number(new Date().toLocaleString('en-MY', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kuala_Lumpur' }));
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const farm = data?.farms[0];
  const live = data?.live.totals; const ds = data?.dataset.kpis; const up = data?.live.upcoming_pickup;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-6 sm:p-8 text-white shadow-soft">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-brand-50/80" />
            <p className="text-brand-50/80 text-sm font-semibold" data-testid="farmer-greeting">{greeting}, {data?.farmer.name ?? 'farmer'}</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">{farm?.name ?? 'Your farm'}</h2>
          <p className="text-brand-50/80 mt-2 max-w-xl text-sm">
            Farmer ID <span className="font-mono font-bold">{data?.farmer.farmer_id ?? '…'}</span>
            {farm && <> · {farm.region}, {farm.state}</>}
            {data?.farmer.cooperative_name && <> · {data.farmer.cooperative_name}</>}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => onNavigate('products')} className="px-4 py-2 rounded-xl bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition flex items-center gap-1.5">
              Register produce <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('pickup')} className="px-4 py-2 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition">Pickup schedule</button>
            <button onClick={() => onNavigate('freshness')} className="px-4 py-2 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition">Freshness</button>
          </div>
        </div>
      </div>

      <LoadState loading={loading} error={error} />

      {data && live && ds && (
        <>
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Now (records created in the portals)</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="farmer-live-kpis">
              <Kpi icon={Package} tint="from-brand-400 to-brand-600" label="Produce registered" value={kg(live.registered_kg)} hint={`${live.produce_registered} registrations`} />
              <Kpi icon={Truck} tint="from-sky2-400 to-sky2-600" label="Next pickup" value={up ? dateText(up.pickup_date) : 'None booked'} hint={up ? `${up.product_name} ${kg(up.quantity_kg)} · ${up.status_label}` : `${live.requests} requests so far`} />
              <Kpi icon={ShoppingCart} tint="from-emerald-400 to-emerald-600" label="Sold through the hub" value={kg(live.sold_kg)} hint={`${live.orders} buyer orders · ${rm(live.sold_value_sen)}`} />
              <Kpi icon={TrendingUp} tint="from-amber-400 to-amber-500" label="Delivered to buyers" value={kg(live.delivered_kg)} hint="confirmed by proof of delivery" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Your history ({dateText(data.dataset.window.from)} – {dateText(data.dataset.window.to)}, FarmXpress dataset)</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="farmer-history-kpis">
              <Kpi icon={Package} tint="from-brand-400 to-brand-600" label="Harvested and sent to hub" value={kg(ds.harvested_kg)} hint={`${ds.batches} batches`} />
              <Kpi icon={Star} tint="from-amber-400 to-amber-500" label="Average freshness at hub QC" value={ds.avg_qc_freshness ?? '-'} hint={`score out of 100 · ${ds.qc_inspected} inspections`} />
              <Kpi icon={ShoppingCart} tint="from-emerald-400 to-emerald-600" label="Delivered to buyers" value={kg(ds.delivered_to_buyers_kg)} hint={`${ds.buyers_reached} buyers · ${ds.buyer_orders} orders`} />
              <Kpi icon={History} tint="from-sky2-400 to-sky2-600" label="Sales value" value={rm(ds.sales_value_sen)} hint="allocated kg × order price" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-3">Farm location</h3>
              {farm ? (
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-slate-700"><MapPin className="w-4 h-4 text-brand-600" /> <span className="font-semibold">{farm.name}</span></p>
                  <p className="text-slate-500">{farm.region}, {farm.state}</p>
                  {farm.lat != null && <p className="text-xs text-slate-400 font-mono">{farm.lat.toFixed(4)}, {farm.lng?.toFixed(4)}</p>}
                  {data.dataset.hubs[0] && <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">Usual hub: <span className="font-semibold">{data.dataset.hubs[0].name}</span> ({data.dataset.hubs[0].batches} batches)</p>}
                </div>
              ) : <Empty>No farm recorded.</Empty>}
              <SourceNote>Weather and farm sensors are not connected to FarmXpress, so none are shown.</SourceNote>
            </div>

            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> Next steps</h3>
                <button onClick={() => onNavigate('pickup')} className="text-sm font-semibold text-brand-600 flex items-center gap-1">Pickup schedule <ArrowRight className="w-4 h-4" /></button>
              </div>
              {data.pickup_recommendations.length === 0 ? (
                <Empty>{data.live.produce.length ? 'All your registered produce already has a pickup request.' : 'Register produce to get a pickup recommendation.'}</Empty>
              ) : (
                <ul className="space-y-2" data-testid="dashboard-recommendations">
                  {data.pickup_recommendations.slice(0, 3).map((r) => (
                    <li key={r.produce_id} className="rounded-xl border border-slate-100 p-3 text-sm">
                      <p className="font-semibold text-slate-800">Request pickup for {r.product_name} ({kg(r.kg)}) by {dateText(r.request_pickup_by)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.reasons[0]}{r.transport === 'refrigerated' ? ' · refrigerated transport' : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Recent produce</h3>
                <button onClick={() => onNavigate('products')} className="text-sm font-semibold text-brand-600 flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></button>
              </div>
              {data.live.produce.length === 0 ? <Empty>No produce registered yet.</Empty> : (
                <div className="space-y-2">
                  {data.live.produce.slice(0, 4).map((p) => (
                    <div key={p.produce_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-sm truncate">{p.product_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{p.produce_id} · {kg(p.quantity_kg)} · harvested {dateText(p.harvest_date)}</p>
                      </div>
                      <span className={`chip ${shelfTone(p.freshness.state)} text-[10px]`}>{p.freshness.days_left != null ? `${Math.max(0, p.freshness.days_left)} d left` : '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Recent sales</h3>
                <button onClick={() => onNavigate('analytics')} className="text-sm font-semibold text-brand-600 flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Analytics</button>
              </div>
              {data.live.sales.length === 0 ? <Empty>No buyer orders for your produce yet.</Empty> : (
                <div className="space-y-2">
                  {data.live.sales.slice(0, 4).map((o) => (
                    <div key={o.order_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-sm truncate">{o.buyer_name ?? 'Buyer'}</p>
                        <p className="text-xs text-slate-400 font-mono">{o.order_id} · {kg(o.kg)} · {rm(o.value_sen)}</p>
                      </div>
                      <span className="chip bg-sky2-100 text-sky2-700 text-[10px]">{o.progress?.label ?? o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
