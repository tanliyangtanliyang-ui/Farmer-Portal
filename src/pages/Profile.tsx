import { Sprout, MapPin, Truck, Users, Radio, Building2, ShieldCheck } from 'lucide-react';
import { useFarmerInsights, useApiStatus, kg, pctText, dateText } from '../lib/insights';
import { Kpi, LoadState, SourceNote } from '../components/InsightBits';

export default function Profile() {
  const { data, error, loading } = useFarmerInsights();
  const connected = useApiStatus();
  const f = data?.farmer; const farm = data?.farms[0]; const k = data?.dataset.kpis; const live = data?.live.totals;
  const initials = (f?.name ?? '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Profile</h2>
        <p className="text-sm text-slate-400">Your farm identity in FarmXpress</p>
      </div>
      <LoadState loading={loading} error={error} />
      {data && f && k && live && (
        <>
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-extrabold text-2xl shrink-0">{initials}</div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-slate-800" data-testid="profile-name">{f.name}</h3>
                  <span className={`chip ${connected ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'}`}><Radio className="w-3 h-3" /> {connected ? 'API connected' : 'API not reachable'}</span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">Farmer ID <span className="font-mono font-bold text-slate-500">{f.farmer_id}</span>{f.cooperative_name && <> · {f.cooperative_name}</>}</p>
                {farm && <p className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 text-sm text-slate-500"><MapPin className="w-4 h-4 text-brand-500" /> {farm.name}, {farm.region}, {farm.state}</p>}
              </div>
              <span className="text-xs text-slate-400 max-w-[220px]">Profile details come from the FarmXpress dataset and cannot be edited in this prototype.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="profile-stats">
            <Kpi icon={Sprout} tint="from-brand-400 to-brand-600" label="Produce sent to hubs" value={kg(k.harvested_kg + live.registered_kg)} hint={`${kg(k.harvested_kg)} history + ${kg(live.registered_kg)} registered in the portal`} />
            <Kpi icon={ShieldCheck} tint="from-emerald-400 to-emerald-600" label="QC pass rate" value={pctText(k.qc_pass_rate_pct)} hint={`${k.qc_inspected} hub inspections`} />
            <Kpi icon={Truck} tint="from-sky2-400 to-sky2-600" label="Buyer orders" value={k.buyer_orders + live.orders} hint={`${k.buyer_orders} history + ${live.orders} in the portal`} />
            <Kpi icon={Users} tint="from-amber-400 to-amber-500" label="Buyers reached" value={k.buyers_reached} hint="in the dataset" />
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4">Ecosystem identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Farmer ID', value: f.farmer_id, tint: 'bg-brand-50 text-brand-700' },
                { label: 'Farm', value: farm ? `${farm.name} (${farm.farm_id})` : '-', tint: 'bg-sky2-50 text-sky2-700' },
                { label: 'Cooperative', value: f.cooperative_name ? `${f.cooperative_name} (${f.cooperative_id})` : 'Not a cooperative member', tint: 'bg-amber-50 text-amber-700' },
                { label: 'Usual hub', value: data.dataset.hubs[0] ? `${data.dataset.hubs[0].name} (${data.dataset.hubs[0].hub_id})` : '-', tint: 'bg-emerald-50 text-emerald-700' },
                { label: 'Products grown', value: data.dataset.product_mix.map((p) => p.name).join(', ') || '-', tint: 'bg-slate-50 text-slate-700' },
                { label: 'Active since', value: dateText(data.dataset.window.from), tint: 'bg-slate-50 text-slate-700' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-3 ${item.tint}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{item.label}</p>
                  <p className="font-bold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <SourceNote><Building2 className="w-3 h-3 inline" /> Certifications, email and sustainability grades are not recorded in the FarmXpress dataset, so none are shown.</SourceNote>
          </div>
        </>
      )}
    </div>
  );
}
