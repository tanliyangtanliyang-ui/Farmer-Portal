// Farmer insights from the FarmXpress API (GET /v1/farmers/{id}/insights): the farmer's dataset history (Jan-Jun 2026)
// plus live records created in the portals. Shared by Dashboard, Freshness, Pickup, Analytics and Profile.
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, FARMER_ID } from './liveApi';

const errText = (e: unknown) => (e instanceof ApiError ? e.message : String(e));

export type ShelfLife = { days_since_harvest: number | null; days_left: number | null; pct_left: number | null; state: 'fresh' | 'use_soon' | 'urgent' | 'expired' | 'unknown'; label: string };
export type Progress = { stage: string; label: string } | null;
export type FarmerInsights = {
  farmer: { farmer_id: string; name: string; cooperative_id: string | null; cooperative_name: string | null; cooperative_state: string | null };
  farms: { farm_id: string; name: string; region: string; state: string; lat: number | null; lng: number | null }[];
  today: string;
  dataset: {
    window: { from: string | null; to: string | null };
    kpis: { batches: number; harvested_kg: number; expired_batches: number; avg_harvest_freshness: number | null; qc_inspected: number; qc_passed: number;
      qc_pass_rate_pct: number | null; qc_reject_kg: number; qc_reject_rate_pct: number | null; avg_qc_freshness: number | null; avg_hours_harvest_to_qc: number | null;
      sold_kg: number; delivered_to_buyers_kg: number; sales_value_sen: number; buyers_reached: number; buyer_orders: number; hubs_used: number };
    monthly: { month: string; batches: number; harvested_kg: number; qc_passed: number; qc_inspected: number; reject_kg: number; qc_pass_rate_pct: number | null; delivered_to_buyers_kg: number;
      avg_qc_freshness?: number | null; avg_harvest_freshness?: number | null }[];
    qc_points?: { batch_id: string; product_name: string; harvest_at: string; harvest: number; qc: number; hours: number; result: string }[];
    product_mix: { product_id: string; name: string; storage_class: string; batches: number; kg: number; share_pct: number | null }[];
    hubs: { hub_id: string; name: string; state: string; batches: number; kg: number }[];
    top_buyers: { buyer_id: string; name: string; type: string; state: string; kg: number; orders: number }[];
    recent_batches: { batch_id: string; product_name: string; hub_id: string; harvest_at: string; declared_kg: number; freshness_score_at_harvest: number | null; status: string;
      qc_result: string | null; qc_freshness: number | null; reject_kg: number | null; qc_reason: string | null; inspected_at: string | null }[];
    qc_issue_reasons: { reason: string; n: number; kg: number }[];
    qc_freshness_bands: { band: string; n: number }[];
    notes: Record<string, string>;
  };
  live: {
    totals: { produce_registered: number; registered_kg: number; requests: number; requests_open: number; received_kg: number; orders: number; sold_kg: number; sold_value_sen: number; delivered_kg: number };
    produce: { produce_id: string; product_name: string | null; storage_class: string | null; farm_name: string | null; quantity_kg: number; requested_kg: number; unrequested_kg: number;
      harvest_date: string; shelf_life_days: number | null; created_at: string; freshness: ShelfLife }[];
    requests: { request_id: string; produce_id: string; product_name: string | null; quantity_kg: number; hub_id: string; hub_name: string | null; pickup_date: string; transport: string;
      status: string; status_label: string; vehicle: { vehicle_id: string; plate: string; type: string } | null;
      driver_assignment: { shipment_id: string; status_label: string; driver_name: string | null; vehicle_id: string; planned_start_at: string; eta_at: string | null } | null;
      collection: { status: string; status_label: string; delivered_qty: number } | null; listing_id: string | null;
      onward: { sold_kg: number; orders: { order_id: string; buyer_name: string | null; kg: number; progress: Progress; delivered_at?: string | null }[] } | null;
      harvest_date: string | null; shelf_life_days: number | null; freshness: ShelfLife; created_at: string;
      events?: { from_status: string | null; to_status: string; actor_role: string; at: string }[]; decision_reason?: string | null }[];
    upcoming_pickup: FarmerInsights['live']['requests'][number] | null;
    sales: { order_id: string; buyer_name: string | null; kg: number; value_sen: number; status: string; progress: Progress; created_at: string; delivered_at?: string | null }[];
  };
  pickup_recommendations: { produce_id: string; product_name: string | null; kg: number; priority: 'high' | 'medium' | 'normal'; request_pickup_by: string;
    suggested_hub: { hub_id: string; name: string; basis: string; km?: number } | null; transport: string; reasons: string[] }[];
  freshness_basis: string;
  recommendation_basis: string;
};

// One request shared by every component that asks within 3 s (page, top bar and sidebar render together).
let inflight: { at: number; p: Promise<FarmerInsights> } | null = null;
function fetchInsights() {
  if (!inflight || Date.now() - inflight.at > 3000) inflight = { at: Date.now(), p: api<FarmerInsights>(`/farmers/${FARMER_ID}/insights`) };
  return inflight.p;
}

/** Loads the farmer's insights and refreshes every 20 s (live records change as other portals act). */
export function useFarmerInsights() {
  const [data, setData] = useState<FarmerInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => fetchInsights().then((d) => { setData(d); setError(null); }).catch((e) => setError(errText(e))), []);
  useEffect(() => { load(); const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);
  return { data, error, loading: !data && !error, reload: load };
}

/** True while the FarmXpress API answers its health check (checked every 20 s). */
export function useApiStatus() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let live = true;
    const check = () => api('/health').then(() => live && setOk(true)).catch(() => live && setOk(false));
    check(); const t = setInterval(check, 20_000); return () => { live = false; clearInterval(t); };
  }, []);
  return ok;
}

export const kg = (n: number | null | undefined) => (n == null ? '-' : `${Number(n).toLocaleString('en-MY')} kg`);
export const rm = (sen: number | null | undefined) => (sen == null ? '-' : `RM ${(sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
export const pctText = (v: number | null | undefined) => (v == null ? '-' : `${v}%`);
export const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-MY', { month: 'short', year: 'numeric', timeZone: 'UTC' });
export const dateText = (iso: string | null | undefined) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }) : '-');
export const shelfTone = (s: ShelfLife['state']) => ({ fresh: 'bg-brand-100 text-brand-700', use_soon: 'bg-amber-100 text-amber-700', urgent: 'bg-orange-100 text-orange-700', expired: 'bg-red-100 text-red-700', unknown: 'bg-slate-100 text-slate-500' }[s]);
export const shelfBar = (s: ShelfLife['state']) => ({ fresh: 'bg-brand-500', use_soon: 'bg-amber-400', urgent: 'bg-orange-500', expired: 'bg-red-500', unknown: 'bg-slate-300' }[s]);

// Bell notifications from the farmer's own records: hub decisions on pickup requests, buyer orders for their produce and deliveries.
export type FarmerNote = { id: string; at: string; title: string; detail: string; tone: 'info' | 'success' | 'warning' };
const REQ_LABEL: Record<string, [string, FarmerNote['tone']]> = {
  requested: ['Pickup requested', 'info'], approved: ['Pickup approved by the hub', 'success'], rejected: ['Pickup rejected by the hub', 'warning'],
  cancelled: ['Pickup request cancelled', 'warning'], received: ['Produce received at the hub', 'success'],
};
const READ_KEY = 'fx.farmer.notifications.read';
export function useFarmerNotifications() {
  const { data } = useFarmerInsights();
  const [read, setRead] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'); } catch { return []; } });
  const notes: FarmerNote[] = [];
  for (const r of data?.live.requests ?? []) for (const e of r.events ?? []) {
    const [t, tone] = REQ_LABEL[e.to_status] ?? [e.to_status, 'info'];
    notes.push({ id: `${r.request_id}:${e.to_status}:${e.at}`, at: e.at, title: `${r.request_id}: ${t}`, detail: `${r.product_name} ${kg(r.quantity_kg)} · ${r.hub_name ?? r.hub_id}${e.to_status === 'rejected' && r.decision_reason ? ` · ${r.decision_reason}` : ''}`, tone });
  }
  for (const o of data?.live.sales ?? []) {
    notes.push({ id: `${o.order_id}:sold`, at: o.created_at, title: `${o.buyer_name ?? 'A buyer'} ordered your produce`, detail: `${o.order_id} · ${kg(o.kg)} · ${rm(o.value_sen)}`, tone: 'success' });
    if (o.delivered_at) notes.push({ id: `${o.order_id}:delivered`, at: o.delivered_at, title: `Delivered to ${o.buyer_name ?? 'the buyer'}`, detail: `${o.order_id} · ${o.progress?.label ?? 'Delivered'}`, tone: 'success' });
  }
  notes.sort((a, b) => b.at.localeCompare(a.at));
  const save = (ids: string[]) => { const v = [...new Set(ids)].slice(-500); setRead(v); try { localStorage.setItem(READ_KEY, JSON.stringify(v)); } catch { /* convenience only */ } };
  return { notes: notes.slice(0, 30), unread: notes.filter((n) => !read.includes(n.id)).length, isRead: (id: string) => read.includes(id),
    markRead: (id: string) => save([...read, id]), markAllRead: () => save([...read, ...notes.map((n) => n.id)]) };
}
