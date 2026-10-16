import type { BatchStatus, OrderStatus, RouteStatus, VehicleStatus, Severity } from '../types';

export function batchStatusChip(status: BatchStatus): string {
  switch (status) {
    case 'Stored': return 'bg-sky2-100 text-sky2-700';
    case 'Pending Pickup': return 'bg-amber-100 text-amber-700';
    case 'Dispatched': return 'bg-indigo-100 text-indigo-700';
    case 'In Transit': return 'bg-brand-100 text-brand-700';
    case 'Delivered': return 'bg-emerald-100 text-emerald-700';
    case 'Rejected': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function orderStatusChip(status: OrderStatus): string {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-700';
    case 'Confirmed': return 'bg-sky2-100 text-sky2-700';
    case 'In Transit': return 'bg-brand-100 text-brand-700';
    case 'Delivered': return 'bg-emerald-100 text-emerald-700';
    case 'Cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function routeStatusChip(status: RouteStatus): string {
  switch (status) {
    case 'Planned': return 'bg-slate-100 text-slate-600';
    case 'Assigned': return 'bg-sky2-100 text-sky2-700';
    case 'In Transit': return 'bg-brand-100 text-brand-700';
    case 'Delayed': return 'bg-amber-100 text-amber-700';
    case 'Completed': return 'bg-emerald-100 text-emerald-700';
    case 'Cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function vehicleStatusChip(status: VehicleStatus): string {
  switch (status) {
    case 'Idle': return 'bg-slate-100 text-slate-600';
    case 'Loading': return 'bg-amber-100 text-amber-700';
    case 'In Transit': return 'bg-brand-100 text-brand-700';
    case 'Maintenance': return 'bg-orange-100 text-orange-700';
    case 'Offline': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function severityChip(sev: Severity): string {
  switch (sev) {
    case 'info': return 'bg-sky2-100 text-sky2-700';
    case 'success': return 'bg-brand-100 text-brand-700';
    case 'warning': return 'bg-amber-100 text-amber-700';
    case 'error': return 'bg-red-100 text-red-700';
    case 'critical': return 'bg-red-600 text-white';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function severityDot(sev: Severity): string {
  switch (sev) {
    case 'info': return 'bg-sky2-500';
    case 'success': return 'bg-brand-500';
    case 'warning': return 'bg-amber-500';
    case 'error': return 'bg-red-500';
    case 'critical': return 'bg-red-600';
    default: return 'bg-slate-400';
  }
}

export function freshnessColor(score: number): string {
  if (score >= 85) return 'text-brand-600';
  if (score >= 70) return 'text-amber-500';
  return 'text-red-500';
}

export function freshnessBg(score: number): string {
  if (score >= 85) return 'bg-brand-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

export function freshnessLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Critical';
}

export function storageIcon(req: string): string {
  switch (req) {
    case 'Cold Chain': return '🧊';
    case 'Humidity Control': return '💧';
    default: return '🌾';
  }
}

export function moduleIcon(module: string): string {
  switch (module) {
    case 'Farmer Portal': return '🌱';
    case 'Buyer Portal': return '🛒';
    case 'Hub Control Tower': return '🏢';
    case 'Driver Portal': return '🚚';
    case 'Government Dashboard': return '🏛️';
    case 'AI Engine': return '🤖';
    case 'IoT Sensor Platform': return '📡';
    default: return '📍';
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
