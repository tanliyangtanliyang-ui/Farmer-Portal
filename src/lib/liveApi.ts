// Client for the FarmXpress API: canonical reference data (read-only) and the transactional
// /v1/live endpoints that persist new produce registrations and delivery requests.
export const API = import.meta.env.VITE_FARMXPRESS_API_BASE_URL ?? 'http://127.0.0.1:4000/v1';
// The farmer this portal acts for (same identity as the shared farmer panel). Default FRM-002 Lim Wei Chen.
// Exhibition-only demo selector: the presenter can act as another dataset farmer in this browser tab (sessionStorage,
// cleared when the tab closes). This is not a login and grants nothing extra; records stay with the farmer who created them.
export const DEFAULT_FARMER_ID = 'FRM-002';
export const DEMO_FARMERS = [
  { id: 'FRM-002', label: 'Lim Wei Chen · Tapah, Perak (default)' },
  { id: 'FRM-001', label: 'Ahmad Ismail · Cameron Highlands, Pahang' },
  { id: 'FRM-005', label: 'Tan Mei Ling · Raub, Pahang' },
  { id: 'FRM-008', label: 'Siti Zulaikha · Kuala Selangor, Selangor' },
  { id: 'FRM-009', label: 'Wong Kah Hou · Sepang, Selangor' },
] as const;
const DEMO_KEY = 'fx-demo-farmer';
function readDemoFarmer(): string {
  try { const v = sessionStorage.getItem(DEMO_KEY); if (v && DEMO_FARMERS.some((f) => f.id === v)) return v; } catch { /* storage unavailable */ }
  return DEFAULT_FARMER_ID;
}
export const FARMER_ID = readDemoFarmer();
export function setDemoFarmer(id: string) {
  try { if (id === DEFAULT_FARMER_ID) sessionStorage.removeItem(DEMO_KEY); else sessionStorage.setItem(DEMO_KEY, id); } catch { /* storage unavailable */ }
  window.location.reload();
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'API_UNREACHABLE', `Cannot reach the FarmXpress API at ${API}. Is it running?`);
  }
  let json: unknown = null;
  try { json = await res.json(); } catch { /* handled below */ }
  if (!res.ok) {
    const e = (json as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, e?.code ?? `HTTP_${res.status}`, e?.message ?? `Request failed (${res.status})`);
  }
  if (json === null) throw new ApiError(res.status, 'BAD_RESPONSE', 'Unreadable API response');
  return json as T;
}

export const newKey = () => (crypto?.randomUUID ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`);
// Local calendar date (YYYY-MM-DD) for date inputs.
export const localDate = (d = new Date(), addDays = 0) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + addDays);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export type Product = { product_id: string; name: string; storage_class: 'chilled' | 'cool' | 'ambient'; temp_min_c: number; temp_max_c: number; shelf_life_days: number; reference_price_sen_per_kg: number };
export type Hub = { hub_id: string; name: string; state: string; capacity_kg: number };
export type Farm = { farm_id: string; name: string; region: string; state: string };
export type Produce = {
  produce_id: string; farmer_id: string; farm_id: string; farm_name: string | null; farm_state: string | null; product_id: string; product_name: string | null;
  storage_class: Product['storage_class'] | null; shelf_life_days: number | null; quantity_kg: number; available_kg: number; requested_kg: number;
  harvest_date: string; days_since_harvest: number; days_of_shelf_life_left: number | null; notes: string | null; created_at: string;
};
export type DeliveryRequest = {
  request_id: string; produce_id: string; farmer_id: string; product_id: string; product_name: string | null; storage_class: string | null;
  hub_id: string; hub_name: string | null; hub_state: string | null; quantity_kg: number; pickup_date: string; transport: 'standard' | 'refrigerated';
  transport_rule?: { refrigerated_required: boolean; standard_truck_possible: boolean; estimated_road_km: number | null; max_road_km: number | null; rule: string | null; reason: string | null } | null;
  status: 'requested' | 'approved' | 'rejected' | 'cancelled' | 'received'; status_label?: string; decision_reason?: string | null; decided_at?: string | null;
  vehicle?: { vehicle_id: string; plate: string; type: string; capacity_kg: number } | null; listing_id: string | null;
  // After the hub lists the produce: buyer orders for it and where each one is now (scenario finding 5).
  onward?: { listed_kg: number | null; available_kg: number | null; sold_kg: number; orders: { order_id: string; buyer_name: string | null; kg: number; status: string; progress: { stage: string; label: string } | null; delivered_at: string | null }[] } | null;
  collection?: { status_label: string; delivered_qty: number; outstanding_qty: number; pods: { pod_id: string; outcome: string; delivered_qty: number; reason_label: string | null; produce_condition: string; recipient_name: string | null; delivered_at: string; decision: { status: string; resolution: string | null; note: string | null } | null }[] } | null;
  driver_assignment?: { shipment_id: string; status: string; status_label: string; driver_id: string; driver_name: string | null; vehicle_id: string; planned_start_at: string; eta_at: string | null } | null; created_at: string; updated_at: string;
  events: { from_status: string | null; to_status: string; actor_role: string; actor_id: string; at: string }[];
};
