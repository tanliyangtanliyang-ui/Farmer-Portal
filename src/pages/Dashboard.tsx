import { Package, Star, Truck, ShoppingCart, CloudRain, MapPin, Thermometer, Leaf, AlertTriangle, ArrowRight, TrendingUp, Radio, Activity, Snowflake } from 'lucide-react';
import { useEventContext } from '../lib/EventContext';
import { batchStatusChip, freshnessColor, freshnessLabel, storageIcon, timeAgo, severityDot, moduleIcon } from '../lib/ui';
import type { PageId } from '../App';

interface DashboardProps {
  onNavigate: (page: 'products' | 'freshness' | 'pickup' | 'market' | 'events') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { farmer, batches, orders, routes, sensors, events, connected } = useEventContext();

  const totalKg = batches.reduce((s, p) => s + Number(p.quantity_kg), 0);
  const avgFreshness = batches.length
    ? Math.round(batches.reduce((s, p) => s + p.freshness_score, 0) / batches.length)
    : 0;
  const activeOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'In Transit' || o.status === 'Confirmed').length;
  const activeRoutes = routes.filter((r) => r.status === 'In Transit' || r.status === 'Delayed').length;
  const alertSensors = sensors.filter((s) => s.status === 'Alert');

  const kpis = [
    { label: 'Active Produce', value: `${totalKg} kg`, icon: Package, tint: 'from-brand-400 to-brand-600' },
    { label: 'Avg Freshness Score', value: `${avgFreshness}%`, icon: Star, tint: 'from-amber-400 to-amber-500' },
    { label: 'Upcoming Pickup', value: activeRoutes > 0 ? `${activeRoutes} active` : 'Today 3:30 PM', icon: Truck, tint: 'from-sky2-400 to-sky2-600' },
    { label: 'Active Orders', value: `${activeOrders}`, icon: ShoppingCart, tint: 'from-emerald-400 to-emerald-600' },
  ];

  const recent = [...batches].slice(0, 4);
  const recentEvents = events.slice(0, 5);
  const batchSensors = sensors.filter((s) => s.target_type === 'batch');
  const tempReading = (batchId: string) => batchSensors.find((s) => s.target_id === batchId && s.sensor_type === 'temperature');
  const humidityReading = (batchId: string) => batchSensors.find((s) => s.target_id === batchId && s.sensor_type === 'humidity');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-6 sm:p-8 text-white shadow-soft">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-16 top-10 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-brand-50/80" />
            <p className="text-brand-50/80 text-sm font-semibold">Good Morning, {farmer?.farm_name ?? 'ABC Farm'} 🌱</p>
            <span className={`chip ${connected ? 'bg-white/20 text-white' : 'bg-white/10 text-brand-50/70'}`}>
              <Radio className={`w-3 h-3 ${connected ? 'animate-pulse' : ''}`} /> {connected ? 'Live' : 'Connecting'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Your farm performance today</h2>
          <p className="text-brand-50/80 mt-2 max-w-lg text-sm">
            Farmer ID: <span className="font-mono font-bold">{farmer?.farmer_id ?? 'F-1001'}</span> · {batches.length} batches · {orders.length} orders · {activeRoutes} routes in transit
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => onNavigate('products')} className="px-4 py-2 rounded-xl bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition flex items-center gap-1.5">
              Register Produce <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigate('freshness')} className="px-4 py-2 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition backdrop-blur-sm">
              View Freshness
            </button>
            <button onClick={() => onNavigate('events')} className="px-4 py-2 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition backdrop-blur-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Event Stream
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.tint} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{k.value}</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Farm status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weather */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Weather</h3>
            <span className="chip bg-sky2-100 text-sky2-700">Live</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky2-100 flex items-center justify-center">
              <CloudRain className="w-8 h-8 text-sky2-600" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800">24°C</p>
              <p className="text-sm text-slate-500">Rain Expected</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-xl bg-slate-50 py-2">
              <p className="text-xs text-slate-400">Humidity</p>
              <p className="font-bold text-slate-700">78%</p>
            </div>
            <div className="rounded-xl bg-slate-50 py-2">
              <p className="text-xs text-slate-400">Wind</p>
              <p className="font-bold text-slate-700">12 km/h</p>
            </div>
            <div className="rounded-xl bg-slate-50 py-2">
              <p className="text-xs text-slate-400">UV</p>
              <p className="font-bold text-slate-700">Low</p>
            </div>
          </div>
        </div>

        {/* Farm map */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-3">Farm Location</h3>
          <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-br from-brand-100 to-sky2-100">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #86efac 2px, transparent 2px), radial-gradient(circle at 70% 60%, #93c5fd 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-brand-500/40 animate-pulse-ring" />
                <div className="relative w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center shadow-soft">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-lg px-2.5 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-xs font-semibold text-slate-700">{farmer?.location ?? 'Green Valley, Sector 14'}</span>
            </div>
          </div>
        </div>

        {/* Farm condition + IoT */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-3">Farm Condition & IoT</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600"><Thermometer className="w-4 h-4 text-orange-500" /> Temperature</span>
              <span className="font-bold text-slate-800">24°C</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600"><CloudRain className="w-4 h-4 text-sky2-500" /> Weather</span>
              <span className="font-bold text-slate-800">Rain Expected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600"><Leaf className="w-4 h-4 text-brand-500" /> Soil Moisture</span>
              <span className="font-bold text-brand-600">Optimal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-600"><Snowflake className="w-4 h-4 text-sky2-500" /> IoT Sensors</span>
              <span className="font-bold text-slate-800">{batchSensors.length} active {alertSensors.length > 0 && <span className="text-red-500">({alertSensors.length} alert)</span>}</span>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-700">AI Recommendation</p>
                <p className="text-xs text-amber-600 mt-0.5">Harvest leafy vegetables earlier to avoid rain damage.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent products + events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Recent Produce</h3>
            <button onClick={() => onNavigate('products')} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No produce registered yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((p) => {
                const temp = tempReading(p.batch_id);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-lg">
                      {storageIcon(p.storage_requirement)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm truncate">{p.product_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.batch_id} · {p.quantity_kg} kg</p>
                    </div>
                    {temp && (
                      <span className={`text-xs font-semibold ${temp.status === 'Alert' ? 'text-red-500' : 'text-sky2-600'}`}>
                        {String(temp.last_reading?.value ?? '--')}°C
                      </span>
                    )}
                    <span className={`chip ${batchStatusChip(p.status)} text-[10px]`}>{p.status}</span>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${freshnessColor(p.freshness_score)}`}>{p.freshness_score}%</p>
                      <p className="text-[11px] text-slate-400">{freshnessLabel(p.freshness_score)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Live Events</h3>
            <button onClick={() => onNavigate('events')} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No events yet.</p>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((ev) => (
                <div key={ev.event_id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition animate-fade-in">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${severityDot(ev.severity)}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{moduleIcon(ev.source_module)}</span>
                      <p className="font-semibold text-slate-800 text-sm truncate">{ev.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ev.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(ev.created_at)} · {ev.source_module}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Add Produce', icon: Package, page: 'products' as const },
          { label: 'Freshness AI', icon: Star, page: 'freshness' as const },
          { label: 'Schedule Pickup', icon: Truck, page: 'pickup' as const },
          { label: 'Find Market', icon: TrendingUp, page: 'market' as const },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => onNavigate(a.page)} className="card p-4 text-left hover:shadow-soft transition group">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center mb-2 group-hover:bg-brand-100 transition">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{a.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">Open <ArrowRight className="w-3 h-3" /></p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
