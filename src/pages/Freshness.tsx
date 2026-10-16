import { Sparkles, Clock, AlertTriangle, CheckCircle2, Droplets, CloudRain, Leaf, ArrowDown, Thermometer, Snowflake, Radio } from 'lucide-react';
import { useEventContext } from '../lib/EventContext';
import { freshnessColor, freshnessLabel } from '../lib/ui';

export default function Freshness() {
  const { batches, sensors } = useEventContext();

  const sorted = [...batches].sort((a, b) => a.freshness_score - b.freshness_score);
  const focus = sorted[0];
  const score = focus?.freshness_score ?? 0;
  const after24 = Math.max(0, score - 14);
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const batchSensors = (batchId: string) => sensors.filter((s) => s.target_id === batchId && s.target_type === 'batch');
  const tempSensor = (batchId: string) => batchSensors(batchId).find((s) => s.sensor_type === 'temperature');
  const humiditySensor = (batchId: string) => batchSensors(batchId).find((s) => s.sensor_type === 'humidity');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Freshness Intelligence</h2>
        <p className="text-sm text-slate-400">AI-powered freshness prediction & live IoT sensor data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Freshness circle */}
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-slate-800">Freshness Score</h3>
          </div>
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="#dcfce7" strokeWidth="14" />
              <circle
                cx="80" cy="80" r={radius} fill="none"
                stroke={score >= 85 ? '#16a34a' : score >= 70 ? '#f59e0b' : '#ef4444'}
                strokeWidth="14" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold ${freshnessColor(score)}`}>{score}%</span>
              <span className="text-sm font-semibold text-slate-500">{freshnessLabel(score)}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center max-w-xs">
            Based on {focus ? `${focus.product_name} (${focus.batch_id})` : 'your produce'} — lowest-scoring batch prioritized.
          </p>
        </div>

        {/* AI prediction */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-slate-800">AI Prediction</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-brand-50 p-4">
              <p className="text-xs text-slate-500 font-semibold">Current</p>
              <p className="text-2xl font-extrabold text-brand-700 mt-1">{score}%</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> After 24 hours
              </p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1 flex items-center gap-1">
                <ArrowDown className="w-4 h-4" /> {after24}%
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-50/80">Recommendation</p>
            <p className="text-lg font-bold mt-1">Dispatch within 6 hours</p>
            <p className="text-xs text-brand-50/80 mt-1">Freshness drops below acceptable threshold after 6 hours at current humidity.</p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Reason</p>
            <div className="space-y-2">
              {[
                { icon: Leaf, text: 'Highly perishable' },
                { icon: Droplets, text: 'High humidity sensitivity' },
                { icon: CloudRain, text: 'Weather risk — rain expected' },
              ].map((r, i) => {
                const Icon = r.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{r.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* All batches freshness + IoT */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">All Batches Freshness & IoT</h3>
          <span className="chip bg-brand-100 text-brand-700">
            <Radio className="w-3 h-3" /> {sensors.filter((s) => s.target_type === 'batch').length} sensors live
          </span>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No produce to monitor.</p>
        ) : (
          <div className="space-y-4">
            {sorted.map((p) => {
              const temp = tempSensor(p.batch_id);
              const hum = humiditySensor(p.batch_id);
              const tempVal = temp?.last_reading?.value;
              const humVal = hum?.last_reading?.value;
              const tempAlert = temp?.status === 'Alert';
              return (
                <div key={p.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-lg shrink-0">
                      {p.product_type === 'Fruit' ? '🍎' : p.product_type === 'Grain' ? '🌾' : '🥬'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm">{p.product_name} <span className="font-mono text-xs text-slate-400">{p.batch_id}</span></p>
                      <p className="text-xs text-slate-400">{p.quantity_kg} kg · {p.storage_requirement}</p>
                    </div>
                    <span className={`font-bold text-sm ${freshnessColor(p.freshness_score)}`}>{p.freshness_score}%</span>
                    {p.freshness_score < 85 && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full ${p.freshness_score >= 85 ? 'bg-brand-500' : p.freshness_score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${p.freshness_score}%`, transition: 'width 0.8s ease' }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {temp && (
                      <span className={`chip ${tempAlert ? 'bg-red-100 text-red-700' : 'bg-sky2-100 text-sky2-700'}`}>
                        <Thermometer className="w-3 h-3" /> {String(tempVal ?? '--')}°C {tempAlert && '⚠'}
                      </span>
                    )}
                    {hum && (
                      <span className="chip bg-emerald-100 text-emerald-700">
                        <Droplets className="w-3 h-3" /> {String(humVal ?? '--')}%
                      </span>
                    )}
                    {p.storage_requirement === 'Cold Chain' && (
                      <span className="chip bg-indigo-100 text-indigo-700">
                        <Snowflake className="w-3 h-3" /> Cold Chain
                      </span>
                    )}
                    {temp && (
                      <span className={`chip text-[10px] ${temp.status === 'Online' ? 'bg-brand-50 text-brand-600' : 'bg-red-50 text-red-600'}`}>
                        <Radio className={`w-3 h-3 ${temp.status === 'Online' ? 'animate-pulse' : ''}`} /> {temp.sensor_id}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
