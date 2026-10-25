import { Menu, Sprout } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFarmerInsights } from '../lib/insights';
import { DEFAULT_FARMER_ID, DEMO_FARMERS, FARMER_ID, setDemoFarmer } from '../lib/liveApi';

interface TopbarProps {
  title: string;
  onMenu: () => void;
  connected?: boolean; // kept for compatibility; API status is shown in "Dataset & API details"
  children?: ReactNode;
}

export default function Topbar({ title, onMenu, children }: TopbarProps) {
  const { data } = useFarmerInsights();
  const name = data?.farmer.name ?? '…';
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <button onClick={onMenu} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100" aria-label="Open menu">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>

        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-slate-800">FarmXpress</span>
        </div>

        <h1 className="hidden lg:block text-lg font-bold text-slate-800">{title}</h1>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {children}
          <label className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500" title="Exhibition demo only: choose which dataset farmer this portal acts for in this browser tab. Not a login.">
            <span className={FARMER_ID === DEFAULT_FARMER_ID ? '' : 'font-semibold text-amber-700'}>Demo farmer</span>
            <select value={FARMER_ID} onChange={(e) => setDemoFarmer(e.target.value)} data-testid="demo-farmer"
              className={`rounded-lg border bg-white text-slate-700 text-[11px] px-1.5 py-1 max-w-[190px] ${FARMER_ID === DEFAULT_FARMER_ID ? 'border-slate-200' : 'border-amber-400'}`}>
              {DEMO_FARMERS.map((f) => <option key={f.id} value={f.id}>{f.id} · {f.label}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l sm:border-slate-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
              {name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-slate-800" data-testid="topbar-farmer">{name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{data ? `${data.farmer.farmer_id} · ${data.farms[0]?.name ?? ''}` : ''}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
