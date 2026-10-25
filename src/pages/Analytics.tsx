import { Package, ShieldCheck, TrendingDown, Users, ShoppingCart, Wallet } from 'lucide-react';
import { useFarmerInsights, kg, rm, pctText, monthLabel, dateText } from '../lib/insights';
import { Kpi, LoadState, SourceNote, Empty, Bars, Meter } from '../components/InsightBits';

export default function Analytics() {
  const { data, error, loading } = useFarmerInsights();
  const ds = data?.dataset; const k = ds?.kpis; const live = data?.live.totals;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Farm Analytics</h2>
        <p className="text-sm text-slate-400">{ds ? `Your FarmXpress history, ${dateText(ds.window.from)} – ${dateText(ds.window.to)}, plus records created in the portals` : 'Your FarmXpress history'}</p>
      </div>
      <LoadState loading={loading} error={error} />
      {data && ds && k && live && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" data-testid="analytics-kpis">
            <Kpi icon={Package} tint="from-brand-400 to-brand-600" label="Harvested" value={kg(k.harvested_kg)} hint={`${k.batches} batches`} />
            <Kpi icon={ShieldCheck} tint="from-emerald-400 to-emerald-600" label="QC pass rate" value={pctText(k.qc_pass_rate_pct)} hint={`${k.qc_passed} of ${k.qc_inspected}`} />
            <Kpi icon={TrendingDown} tint="from-orange-400 to-red-500" label="Rejected at QC" value={kg(k.qc_reject_kg)} hint={`${pctText(k.qc_reject_rate_pct)} of harvest · ${k.expired_batches} batches expired`} />
            <Kpi icon={ShoppingCart} tint="from-sky2-400 to-sky2-600" label="Delivered to buyers" value={kg(k.delivered_to_buyers_kg)} hint={`${k.buyer_orders} orders`} />
            <Kpi icon={Users} tint="from-violet-400 to-violet-600" label="Buyers reached" value={k.buyers_reached} hint={`through ${k.hubs_used} hub(s)`} />
            <Kpi icon={Wallet} tint="from-amber-400 to-amber-500" label="Sales value" value={rm(k.sales_value_sen)} hint="allocated kg × order price" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <h3 className="font-bold text-slate-800 mb-4">Monthly: harvested vs delivered to buyers (kg)</h3>
              {ds.monthly.length === 0 ? <Empty>No history.</Empty> : (
                <Bars rows={ds.monthly.map((m) => ({ label: monthLabel(m.month), values: [m.harvested_kg, m.delivered_to_buyers_kg] }))}
                  series={[{ name: 'Harvested (sent to hub)', className: 'bg-brand-500' }, { name: 'Delivered to buyers', className: 'bg-sky2-500' }]} />
              )}
              <SourceNote>Months by harvest date (Malaysia time). Delivered = dataset allocations of your batches with status delivered.</SourceNote>
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4">Produce mix</h3>
              <div className="space-y-2.5">
                {ds.product_mix.map((p) => (
                  <div key={p.product_id}>
                    <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-700">{p.name}</span><span className="text-slate-500">{kg(p.kg)} · {pctText(p.share_pct)}</span></div>
                    <Meter value={p.share_pct ?? 0} className="bg-brand-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5 overflow-x-auto">
              <h3 className="font-bold text-slate-800 mb-3">Top buyers of your produce</h3>
              {ds.top_buyers.length === 0 ? <Empty>No buyer allocations recorded.</Empty> : (
                <table className="w-full text-sm"><tbody>
                  {ds.top_buyers.map((b) => <tr key={b.buyer_id} className="border-t border-slate-100 first:border-0"><td className="py-1.5"><p className="font-semibold text-slate-700">{b.name}</p><p className="text-[11px] text-slate-400">{b.type} · {b.state}</p></td><td className="text-right text-xs">{kg(b.kg)}<br /><span className="text-slate-400">{b.orders} orders</span></td></tr>)}
                </tbody></table>
              )}
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-3">Monthly QC pass rate</h3>
              <div className="space-y-2">
                {ds.monthly.map((m) => (
                  <div key={m.month} className="flex items-center gap-3 text-xs">
                    <span className="w-16 text-slate-500">{monthLabel(m.month)}</span>
                    <div className="flex-1"><Meter value={m.qc_pass_rate_pct ?? 0} className="bg-emerald-500" /></div>
                    <span className="w-24 text-right text-slate-600">{pctText(m.qc_pass_rate_pct)} · {m.reject_kg} kg rej.</span>
                  </div>
                ))}
              </div>
              {ds.qc_issue_reasons.length > 0 && <p className="text-xs text-slate-500 mt-3">Rejection reasons: {ds.qc_issue_reasons.map((r) => `${r.reason.replace(/_/g, ' ')} (${r.n}×, ${r.kg} kg)`).join(', ')}</p>}
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-3">In the portals so far</h3>
              <dl className="text-sm space-y-2" data-testid="analytics-live">
                {[['Produce registered', `${kg(live.registered_kg)} (${live.produce_registered})`], ['Pickup requests', `${live.requests} (${live.requests_open} open)`],
                  ['Received at hub', kg(live.received_kg)], ['Sold to buyers', `${kg(live.sold_kg)} · ${rm(live.sold_value_sen)}`], ['Delivered (proof of delivery)', kg(live.delivered_kg)]]
                  .map(([a, b]) => <div key={a} className="flex justify-between gap-2"><dt className="text-slate-500">{a}</dt><dd className="font-semibold text-slate-800 text-right">{b}</dd></div>)}
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
