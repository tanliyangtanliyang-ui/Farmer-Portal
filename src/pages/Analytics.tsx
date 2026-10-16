import { TrendingUp, Package, Truck, Leaf, BarChart3, Radio } from 'lucide-react';
import { useEventContext } from '../lib/EventContext';

export default function Analytics() {
  const { batches, orders, routes, events } = useEventContext();

  const totalKg = batches.reduce((s, p) => s + Number(p.quantity_kg), 0);
  const avgScore = batches.length ? Math.round(batches.reduce((s, p) => s + p.freshness_score, 0) / batches.length) : 0;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const revenue = orders.filter((o) => o.status === 'Delivered').reduce((s, o) => s + Number(o.total_amount), 0);

  const weekly = [
    { day: 'Mon', value: 420 },
    { day: 'Tue', value: 580 },
    { day: 'Wed', value: 350 },
    { day: 'Thu', value: 720 },
    { day: 'Fri', value: 650 },
    { day: 'Sat', value: 890 },
    { day: 'Sun', value: 540 },
  ];
  const maxWeekly = Math.max(...weekly.map((w) => w.value));

  const byType = batches.reduce<Record<string, number>>((acc, p) => {
    acc[p.product_type] = (acc[p.product_type] || 0) + Number(p.quantity_kg);
    return acc;
  }, {});
  const typeEntries = Object.entries(byType);
  const totalTypeKg = typeEntries.reduce((s, [, v]) => s + v, 0);

  // Event type distribution
  const byEventType = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {});
  const eventEntries = Object.entries(byEventType).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Farm Analytics</h2>
        <p className="text-sm text-slate-400">Performance insights across your farm operations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Produce', value: `${totalKg} kg`, icon: Package, tint: 'from-brand-400 to-brand-600' },
          { label: 'Avg Freshness', value: `${avgScore}%`, icon: Leaf, tint: 'from-amber-400 to-amber-500' },
          { label: 'Delivered Orders', value: `${deliveredOrders}`, icon: Truck, tint: 'from-sky2-400 to-sky2-600' },
          { label: 'Revenue (delivered)', value: `₹${revenue.toLocaleString()}`, icon: TrendingUp, tint: 'from-emerald-400 to-emerald-600' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.tint} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <p className="text-xl font-extrabold text-slate-800">{k.value}</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-slate-800">Weekly Harvest (kg)</h3>
          </div>
          <div className="flex items-end justify-between gap-2 h-44">
            {weekly.map((w) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-brand-400 to-brand-600 hover:from-brand-500 hover:to-brand-700 transition-all"
                    style={{ height: `${(w.value / maxWeekly) * 100}%` }}
                    title={`${w.value} kg`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-400">{w.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-4">Produce Distribution</h3>
          {typeEntries.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {typeEntries.map(([type, kg]) => {
                const pct = Math.round((kg / totalTypeKg) * 100);
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700">{type}</span>
                      <span className="text-sm text-slate-400">{kg} kg · {pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${pct}%`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6 rounded-xl bg-sky2-50 border border-sky2-100 p-3">
            <p className="text-xs font-bold text-sky2-700">Insight</p>
            <p className="text-xs text-sky2-600 mt-0.5">Vegetables dominate your output. Consider diversifying into grains for seasonal stability.</p>
          </div>
        </div>
      </div>

      {/* Event analytics */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-slate-800">Event Activity</h3>
          </div>
          <span className="text-xs text-slate-400">{events.length} total events</span>
        </div>
        {eventEntries.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No events recorded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {eventEntries.map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 w-48 truncate">{type}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky2-400 to-brand-500"
                    style={{ width: `${(count / eventEntries[0][1]) * 100}%`, transition: 'width 0.8s ease' }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
