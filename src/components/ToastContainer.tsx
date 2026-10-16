import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import type { FarmEvent } from '../types';
import { moduleIcon } from '../lib/ui';

export interface ToastItem {
  id: string;
  event: FarmEvent;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const iconFor = (severity: string) => {
  switch (severity) {
    case 'success': return CheckCircle2;
    case 'warning': return AlertTriangle;
    case 'error':
    case 'critical': return AlertOctagon;
    default: return Info;
  }
};

const tintFor = (severity: string) => {
  switch (severity) {
    case 'success': return 'border-l-brand-500 bg-white';
    case 'warning': return 'border-l-amber-500 bg-white';
    case 'error': return 'border-l-red-500 bg-white';
    case 'critical': return 'border-l-red-600 bg-red-50';
    default: return 'border-l-sky2-500 bg-white';
  }
};

const iconColorFor = (severity: string) => {
  switch (severity) {
    case 'success': return 'text-brand-500';
    case 'warning': return 'text-amber-500';
    case 'error': return 'text-red-500';
    case 'critical': return 'text-red-600';
    default: return 'text-sky2-500';
  }
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = iconFor(toast.event.severity);

  useEffect(() => {
    timer.current = setTimeout(() => onDismiss(toast.id), 6000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [toast.id, onDismiss]);

  return (
    <div className={`card rounded-xl border-l-4 ${tintFor(toast.event.severity)} p-3.5 shadow-soft flex items-start gap-3 w-80 animate-fade-in`}>
      <Icon className={`w-5 h-5 ${iconColorFor(toast.event.severity)} shrink-0 mt-0.5`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{moduleIcon(toast.event.source_module)}</span>
          <p className="font-bold text-slate-800 text-sm">{toast.event.title}</p>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{toast.event.message}</p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">{toast.event.source_module}</p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="p-1 rounded-lg hover:bg-slate-100 shrink-0">
        <X className="w-3.5 h-3.5 text-slate-400" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2.5">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}
