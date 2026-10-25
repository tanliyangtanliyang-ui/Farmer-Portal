import {
  LayoutDashboard,
  Package,
  Sparkles,
  Truck,
  BarChart3,
  UserCircle2,
  Sprout,
  Radio,
} from 'lucide-react';
import type { PageId } from '../App';
import { useApiStatus, useFarmerInsights } from '../lib/insights';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'My Products', icon: Package },
  { id: 'freshness', label: 'Freshness Monitor', icon: Sparkles },
  { id: 'pickup', label: 'Pickup Schedule', icon: Truck },
  { id: 'analytics', label: 'Farm Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: UserCircle2 },
];

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ current, onNavigate, open, onClose }: SidebarProps) {
  const connected = useApiStatus();
  const insights = useFarmerInsights();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft">
            <Sprout className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-slate-800 text-base">FarmXpress</p>
            <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">Smart Farm Portal</p>
          </div>
        </div>

        <div className="px-5 py-2 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-brand-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3" /> {connected ? 'FarmXpress API connected' : 'API not reachable'}
          </span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition ${active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  strokeWidth={2.2}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
            <p className="text-xs font-bold mb-1">Hub QC pass rate</p>
            <p className="text-2xl font-extrabold" data-testid="sidebar-qc">{insights.data?.dataset.kpis.qc_pass_rate_pct != null ? `${insights.data.dataset.kpis.qc_pass_rate_pct}%` : '-'}</p>
            <p className="text-[11px] text-brand-50/90 mt-1">{insights.data ? `${insights.data.dataset.kpis.qc_inspected} inspections of your batches (dataset)` : 'Loading…'}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
