import { Leaf, Sparkles, Truck, Warehouse, MapPin, Clock, CheckCircle2, Circle, Radio, Navigation, AlertTriangle } from 'lucide-react';
import { useEventContext } from '../lib/EventContext';
import { routeStatusChip, vehicleStatusChip, timeAgo } from '../lib/ui';

export default function Pickup() {
  const { batches, orders, routes, vehicles, drivers, sensors } = useEventContext();

  const pending = batches.filter((p) => p.status === 'Pending Pickup' || p.status === 'Stored');
  const dispatched = batches.filter((p) => p.status === 'Dispatched' || p.status === 'In Transit');
  const delivered = batches.filter((p) => p.status === 'Delivered');

  const activeRoutes = routes.filter((r) => r.status === 'In Transit' || r.status === 'Delayed' || r.status === 'Assigned');
  const completedRoutes = routes.filter((r) => r.status === 'Completed');

  const stages = [
    { title: 'Harvest Ready', subtitle: 'Produce inspected & packed', icon: Leaf, done: true },
    { title: 'AI Pickup Recommendation', subtitle: 'Today 3:30 PM · optimal window', icon: Sparkles, done: true },
    { title: 'Driver Assigned', subtitle: activeRoutes[0] ? `${activeRoutes[0].vehicle_id ?? '—'} / ${activeRoutes[0].driver_id ?? '—'}` : 'Truck #102 · Raj K.', icon: Truck, done: activeRoutes.length > 0 },
    { title: 'Delivered to Hub', subtitle: 'Green Valley Distribution Hub', icon: Warehouse, done: completedRoutes.length > 0 },
  ];

  const vehicleFor = (vid: string | null) => vehicles.find((v) => v.vehicle_id === vid);
  const driverFor = (did: string | null) => drivers.find((d) => d.driver_id === did);
  const orderFor = (oid: string) => orders.find((o) => o.order_id === oid);
  const batchFor = (bid: string) => batches.find((b) => b.batch_id === bid);
  const gpsSensor = (vid: string | null) => vid ? sensors.find((s) => s.target_id === vid && s.sensor_type === 'gps') : undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Smart Pickup Schedule</h2>
        <p className="text-sm text-slate-400">AI-optimized pickup timeline with live vehicle & driver tracking</p>
      </div>

      {/* Timeline */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-800 mb-6">Pickup Timeline</h3>
        <div className="relative">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            const last = i === stages.length - 1;
            return (
              <div key={stage.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition ${
                    stage.done ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {stage.done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  {!last && <div className={`w-0.5 flex-1 min-h-[2.5rem] my-1 ${stage.done ? 'bg-brand-200' : 'bg-slate-100'}`} />}
                </div>
                <div className={`pb-6 ${last ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-2">
                    {stage.done ? <CheckCircle2 className="w-4 h-4 text-brand-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
                    <p className={`font-bold ${stage.done ? 'text-slate-800' : 'text-slate-500'}`}>{stage.title}</p>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {stage.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Pending</p>
              <p className="text-xl font-extrabold text-slate-800">{pending.length}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {pending.slice(0, 3).map((p) => (
              <p key={p.id} className="text-xs text-slate-500 truncate">{p.product_name} · <span className="font-mono">{p.batch_id}</span></p>
            ))}
            {pending.length === 0 && <p className="text-xs text-slate-400">None pending</p>}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-sky2-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-sky2-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">In Transit</p>
              <p className="text-xl font-extrabold text-slate-800">{dispatched.length}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {dispatched.slice(0, 3).map((p) => (
              <p key={p.id} className="text-xs text-slate-500 truncate">{p.product_name} · <span className="font-mono">{p.batch_id}</span></p>
            ))}
            {dispatched.length === 0 && <p className="text-xs text-slate-400">None in transit</p>}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Delivered</p>
              <p className="text-xl font-extrabold text-slate-800">{delivered.length}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {delivered.slice(0, 3).map((p) => (
              <p key={p.id} className="text-xs text-slate-500 truncate">{p.product_name} · <span className="font-mono">{p.batch_id}</span></p>
            ))}
            {delivered.length === 0 && <p className="text-xs text-slate-400">None delivered</p>}
          </div>
        </div>
      </div>

      {/* Active routes with live tracking */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Active Routes</h3>
          <span className="chip bg-brand-100 text-brand-700">
            <Radio className="w-3 h-3 animate-pulse" /> Live tracking
          </span>
        </div>
        {activeRoutes.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No active routes right now.</p>
        ) : (
          <div className="space-y-3">
            {activeRoutes.map((r) => {
              const veh = vehicleFor(r.vehicle_id);
              const drv = driverFor(r.driver_id);
              const ord = orderFor(r.order_id);
              const bat = ord ? batchFor(ord.batch_id) : undefined;
              const gps = gpsSensor(r.vehicle_id);
              const isDelayed = r.status === 'Delayed';
              return (
                <div key={r.route_id} className={`rounded-xl border p-4 ${isDelayed ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky2-100 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-sky2-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{r.route_id}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          {r.vehicle_id ?? '—'} · {r.driver_id ?? '—'} · Order {r.order_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDelayed && (
                        <span className="chip bg-amber-100 text-amber-700">
                          <AlertTriangle className="w-3 h-3" /> Delayed
                        </span>
                      )}
                      <span className={`chip ${routeStatusChip(r.status)}`}>{r.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    <span className="font-semibold text-slate-700">{r.origin}</span>
                    <Navigation className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{r.destination}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[10px] text-slate-400">ETA</p>
                      <p className={`font-bold text-sm ${isDelayed ? 'text-amber-600' : 'text-slate-700'}`}>{r.eta_minutes} min</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[10px] text-slate-400">Driver</p>
                      <p className="font-bold text-sm text-slate-700">{drv?.name ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[10px] text-slate-400">Vehicle</p>
                      <p className="font-bold text-sm text-slate-700">{veh?.plate ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[10px] text-slate-400">Batch</p>
                      <p className="font-bold text-sm text-slate-700 font-mono">{bat?.batch_id ?? '—'}</p>
                    </div>
                  </div>

                  {gps && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-mono">
                      <Radio className="w-3 h-3 animate-pulse text-brand-500" />
                      GPS: {String(gps.last_reading?.lat ?? '--')}, {String(gps.last_reading?.lng ?? '--')} · {String(gps.last_reading?.speed_kmh ?? '--')} km/h
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fleet status */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">Fleet Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {vehicles.map((v) => (
            <div key={v.vehicle_id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{v.vehicle_id}</p>
                    <p className="text-xs text-slate-400">{v.plate} · {v.type}</p>
                  </div>
                </div>
                <span className={`chip ${vehicleStatusChip(v.status)}`}>{v.status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Capacity: {v.capacity_kg} kg</p>
            </div>
          ))}
        </div>
      </div>

      {/* Completed routes */}
      {completedRoutes.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-4">Completed Deliveries</h3>
          <div className="space-y-2">
            {completedRoutes.map((r) => (
              <div key={r.route_id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50">
                <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{r.route_id} · {r.origin} → {r.destination}</p>
                  <p className="text-xs text-slate-400 font-mono">{r.vehicle_id} · {r.driver_id} · Order {r.order_id}</p>
                </div>
                <span className="text-xs text-slate-400">{r.completed_at ? timeAgo(r.completed_at) : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
