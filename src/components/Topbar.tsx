import { Search, Menu, Sprout, Radio } from 'lucide-react';
import type { ReactNode } from 'react';

interface TopbarProps {
  title: string;
  onMenu: () => void;
  connected: boolean;
  children?: ReactNode;
}

export default function Topbar({ title, onMenu, connected, children }: TopbarProps) {
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
          <div className="hidden sm:flex items-center relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              placeholder="Search batches, orders..."
              className="pl-9 pr-3 py-2 w-48 lg:w-64 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white transition"
            />
          </div>
          <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
            connected ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${connected ? 'animate-pulse' : ''}`} />
            {connected ? 'Live' : 'Offline'}
          </span>
          {children}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l sm:border-slate-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
              AB
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-slate-800">ABC Farm</p>
              <p className="text-[11px] text-slate-400 font-mono">F-1001</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
