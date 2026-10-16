import { Sprout, MapPin, Mail, Phone, Award, Leaf, Truck, Star, CheckCircle2, Radio } from 'lucide-react';
import { useEventContext } from '../lib/EventContext';

export default function Profile() {
  const { farmer, batches, orders, events, connected } = useEventContext();

  const totalKg = batches.reduce((s, b) => s + Number(b.quantity_kg), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Profile</h2>
        <p className="text-sm text-slate-400">Your farm identity and verification status</p>
      </div>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-extrabold text-2xl shrink-0">
            AB
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-slate-800">{farmer?.farm_name ?? 'ABC Farm'}</h3>
              <span className="chip bg-brand-100 text-brand-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
              <span className={`chip ${connected ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
                <Radio className={`w-3 h-3 ${connected ? 'animate-pulse' : ''}`} /> {connected ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Certified Organic Grower · Farmer ID <span className="font-mono font-bold text-slate-500">{farmer?.farmer_id ?? 'F-1001'}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-500" /> {farmer?.location ?? 'Green Valley, Sector 14'}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-sky2-500" /> {farmer?.email ?? 'abc@farmxpress.com'}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-amber-500" /> {farmer?.phone ?? '+91 98765 43210'}</span>
            </div>
          </div>
          <button className="btn-ghost">Edit Profile</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Produce', value: `${totalKg} kg`, icon: Sprout, tint: 'from-brand-400 to-brand-600' },
          { label: 'Sustainability', value: farmer?.sustainability_grade ?? 'A+', icon: Leaf, tint: 'from-emerald-400 to-emerald-600' },
          { label: 'Total Orders', value: `${orders.length}`, icon: Truck, tint: 'from-sky2-400 to-sky2-600' },
          { label: 'Events Logged', value: `${events.length}`, icon: Radio, tint: 'from-amber-400 to-amber-500' },
        ].map((k) => {
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

      {/* Certifications */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">Certifications & Badges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: 'Organic Certified', desc: 'USDA & NPOP verified', icon: Leaf },
            { title: 'Sustainability A+', desc: 'Low waste, efficient routes', icon: Award },
            { title: 'Cold Chain Ready', desc: 'Verified storage compliance', icon: Truck },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-xl border border-slate-100 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ecosystem identity */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">Ecosystem Identity</h3>
        <p className="text-xs text-slate-400 mb-3">Your shared identifiers across the FarmXpress platform</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Farmer ID', value: farmer?.farmer_id ?? 'F-1001', tint: 'bg-brand-50 text-brand-700' },
            { label: 'Farm Name', value: farmer?.farm_name ?? 'ABC Farm', tint: 'bg-sky2-50 text-sky2-700' },
            { label: 'Location', value: farmer?.location ?? 'Green Valley, Sector 14', tint: 'bg-amber-50 text-amber-700' },
            { label: 'Sustainability Grade', value: farmer?.sustainability_grade ?? 'A+', tint: 'bg-emerald-50 text-emerald-700' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 ${item.tint}`}>
              <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{item.label}</p>
              <p className="font-bold font-mono mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
