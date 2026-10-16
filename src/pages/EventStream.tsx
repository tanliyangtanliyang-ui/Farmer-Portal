import { useState } from 'react';
import { Activity, Filter, Radio, ArrowRight } from 'lucide-react';
import { useEventContext } from '../lib/EventContext';
import { severityDot, severityChip, moduleIcon, timeAgo } from '../lib/ui';
import type { ModuleName, Severity } from '../types';

const MODULES: (ModuleName | 'All')[] = [
  'All', 'Farmer Portal', 'Buyer Portal', 'Hub Control Tower', 'Driver Portal',
  'Government Dashboard', 'AI Engine', 'IoT Sensor Platform',
];

export default function EventStream() {
  const { events, connected } = useEventContext();
  const [filter, setFilter] = useState<ModuleName | 'All'>('All');

  const filtered = filter === 'All' ? events : events.filter((e) => e.source_module === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Event Stream</h2>
          <p className="text-sm text-slate-400">Live cross-module event log from the FarmXpress cloud</p>
        </div>
        <span className={`chip ${connected ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
          <Radio className={`w-3.5 h-3.5 ${connected ? 'animate-pulse' : ''}`} /> {connected ? 'Streaming live' : 'Connecting'}
        </span>
      </div>

      {/* Module filter */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter by source module</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODULES.map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === m ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {m !== 'All' && <span className="mr-1">{moduleIcon(m)}</span>}
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Event timeline */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-slate-800">Event Timeline</h3>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} events</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center">No events match this filter.</p>
        ) : (
          <div className="space-y-1">
            {filtered.map((ev, i) => (
              <div key={ev.event_id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition animate-fade-in">
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${severityDot(ev.severity as Severity)} shrink-0`} />
                  {i < filtered.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                </div>
                <div className="min-w-0 flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">{moduleIcon(ev.source_module)}</span>
                    <p className="font-semibold text-slate-800 text-sm">{ev.title}</p>
                    <span className={`chip ${severityChip(ev.severity as Severity)} text-[10px]`}>{ev.severity}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{ev.message}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-mono">{ev.event_id}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400">{ev.source_module}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400">{timeAgo(ev.created_at)}</span>
                    {ev.related_batch_id && (
                      <span className="text-[10px] text-brand-600 font-mono flex items-center gap-0.5">
                        <ArrowRight className="w-2.5 h-2.5" /> {ev.related_batch_id}
                      </span>
                    )}
                    {ev.related_order_id && (
                      <span className="text-[10px] text-sky2-600 font-mono flex items-center gap-0.5">
                        <ArrowRight className="w-2.5 h-2.5" /> {ev.related_order_id}
                      </span>
                    )}
                    {ev.related_route_id && (
                      <span className="text-[10px] text-amber-600 font-mono flex items-center gap-0.5">
                        <ArrowRight className="w-2.5 h-2.5" /> {ev.related_route_id}
                      </span>
                    )}
                    {ev.related_vehicle_id && (
                      <span className="text-[10px] text-indigo-600 font-mono">{ev.related_vehicle_id}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
