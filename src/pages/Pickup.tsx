import { Lightbulb, Truck, CheckCircle2, Clock, PackageCheck, XCircle } from 'lucide-react';
import { useFarmerInsights, kg, dateText } from '../lib/insights';
import { LoadState, SourceNote, Empty } from '../components/InsightBits';

const PRIORITY = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', normal: 'bg-brand-100 text-brand-700' } as const;
const PRIORITY_LABEL = { high: 'Request today', medium: 'Request soon', normal: 'Plan ahead' } as const;

export default function Pickup() {
  const { data, error, loading } = useFarmerInsights();
  const reqs = data?.live.requests ?? [];
  const open = reqs.filter((r) => ['requested', 'approved'].includes(r.status)).sort((a, b) => a.pickup_date.localeCompare(b.pickup_date));
  const done = reqs.filter((r) => r.status === 'received');
  const closed = reqs.filter((r) => ['rejected', 'cancelled'].includes(r.status));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Smart Pickup Schedule</h2>
        <p className="text-sm text-slate-400">What to send next, and where each pickup request is now</p>
      </div>
      <LoadState loading={loading} error={error} />
      {data && (
        <>
          <div className="card p-5" data-testid="pickup-recommendation">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-amber-500" /> Pickup Recommendation</h3>
            {data.pickup_recommendations.length === 0 ? (
              <Empty>{data.live.produce.length ? 'All your registered produce already has a pickup request.' : 'No produce waiting. Register produce under My Products to get a recommendation.'}</Empty>
            ) : (
              <div className="space-y-3">
                {data.pickup_recommendations.map((r) => (
                  <div key={r.produce_id} className="rounded-xl border border-slate-100 p-4" data-testid={`rec-${r.produce_id}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800">{r.product_name} · {kg(r.kg)} <span className="font-mono text-xs text-slate-400">{r.produce_id}</span></p>
                      <span className={`chip ${PRIORITY[r.priority]}`}>{PRIORITY_LABEL[r.priority]}</span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-3 text-sm">
                      <div className="rounded-lg bg-slate-50 p-2"><p className="text-[11px] text-slate-400">Request a pickup by</p><p className="font-bold text-slate-700">{dateText(r.request_pickup_by)}</p></div>
                      <div className="rounded-lg bg-slate-50 p-2"><p className="text-[11px] text-slate-400">Suggested hub</p><p className="font-bold text-slate-700">{r.suggested_hub?.name ?? '-'}</p><p className="text-[10px] text-slate-400">{r.suggested_hub?.basis}</p></div>
                      <div className="rounded-lg bg-slate-50 p-2"><p className="text-[11px] text-slate-400">Transport</p><p className="font-bold text-slate-700">{r.transport === 'refrigerated' ? 'Refrigerated' : 'Any vehicle'}</p></div>
                    </div>
                    <ul className="mt-2 text-xs text-slate-500 list-disc pl-4 space-y-0.5">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                ))}
                <p className="text-xs text-slate-500">To book, open <span className="font-semibold">My Products</span> and choose “Request delivery to hub” on the item.</p>
              </div>
            )}
            <SourceNote>{data.recommendation_basis}</SourceNote>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4">Upcoming pickups</h3>
            {open.length === 0 ? <Empty>No pickups booked.</Empty> : (
              <ol className="relative border-l-2 border-slate-100 ml-2 space-y-5" data-testid="pickup-timeline">
                {open.map((r) => (
                  <li key={r.request_id} className="ml-5">
                    <span className={`absolute -left-[9px] w-4 h-4 rounded-full ring-4 ring-white ${r.driver_assignment ? 'bg-sky2-500' : r.status === 'approved' ? 'bg-brand-500' : 'bg-amber-400'}`} />
                    <p className="text-sm font-semibold text-slate-800">{dateText(r.pickup_date)} · {r.product_name} {kg(r.quantity_kg)} → {r.hub_name ?? r.hub_id}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.status_label}</span>
                      {r.vehicle && <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {r.vehicle.plate} ({r.vehicle.type})</span>}
                      {r.driver_assignment && <span>Driver {r.driver_assignment.driver_name ?? '-'} · {r.driver_assignment.status_label}</span>}
                      <span className="font-mono">{r.request_id}</span>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PackageCheck className="w-4 h-4 text-brand-600" /> Received at the hub</h3>
              {done.length === 0 ? <Empty>Nothing received yet.</Empty> : (
                <ul className="space-y-2">
                  {done.map((r) => (
                    <li key={r.request_id} className="rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-brand-600" /> {r.product_name} {kg(r.quantity_kg)} · {r.hub_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.collection?.status_label ?? 'Received'}{r.onward ? (r.onward.sold_kg > 0 ? ` · sold ${kg(r.onward.sold_kg)} to ${r.onward.orders.filter((o) => !['rejected', 'cancelled'].includes(o.progress?.stage ?? '')).length} buyer order(s)` : ' · listed for buyers, not sold yet') : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><XCircle className="w-4 h-4 text-slate-400" /> Rejected or cancelled</h3>
              {closed.length === 0 ? <Empty>None.</Empty> : (
                <ul className="space-y-2">{closed.map((r) => <li key={r.request_id} className="text-sm text-slate-600"><span className="font-mono text-xs">{r.request_id}</span> · {r.product_name} {kg(r.quantity_kg)} · {r.status_label}</li>)}</ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
