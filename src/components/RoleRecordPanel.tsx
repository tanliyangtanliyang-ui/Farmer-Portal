import { useEffect, useState } from 'react';
import { FARMER_ID } from '../lib/liveApi';

// Read-only farmer records from the shared FarmXpress API (GET /v1/farmers/{id}).
// Every value below is rendered from the API response; nothing is substituted on failure.
const API = import.meta.env.VITE_FARMXPRESS_API_BASE_URL ?? 'http://127.0.0.1:4000/v1';
const SHIPMENT_ID = 'SHP-000006';

type Batch = { batch_id: string; product_name: string; hub_id: string; harvest_at: string | null; declared_kg: number; freshness_score_at_harvest: number | null; status: string };
type FarmerResponse = {
  readOnly: boolean;
  farmer: { farmer_id: string; name: string; cooperative_id: string | null; cooperative_name: string | null };
  farms: { farm_id: string; name: string; region: string; state: string }[];
  totals: { batches: number; batchesByStatus: Record<string, number>; shipmentsCarryingBatches: number };
  batches: Batch[];
  provenance: { dataset_version: string; label: string } | null;
};
type Load = { loading: boolean; data?: FarmerResponse; error?: string };

const utc = (s: string | null) => (s ? `${s.replace('T', ' ').slice(0, 16)} UTC` : 'not recorded');
const counts = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none';

function useFarmer(query: string): Load {
  const [state, setState] = useState<Load>({ loading: true });
  useEffect(() => {
    let active = true;
    fetch(`${API}/farmers/${FARMER_ID}${query}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error(`API ${r.status}`))))
      .then((data: FarmerResponse) => { if (active) setState({ loading: false, data }); })
      .catch((e: Error) => { if (active) setState({ loading: false, error: e.message }); });
    return () => { active = false; };
  }, [query]);
  return state;
}

export default function RoleRecordPanel() {
  const all = useFarmer('?limit=5');
  const inShipment = useFarmer(`?shipment=${SHIPMENT_ID}&limit=50`);

  if (all.error) return <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Farmer records unavailable from the shared API ({all.error}). No farmer data is shown in place of the API.</div>;
  if (all.loading || !all.data) return <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700">Loading farmer {FARMER_ID} from the shared API…</div>;

  const { farmer, farms, totals, batches, provenance } = all.data;
  return (
    <section className="mb-5 rounded-xl border border-brand-200 bg-white p-4 text-sm text-gray-800" data-source="farmxpress-api">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <b>{farmer.name} <span className="font-mono text-xs">({farmer.farmer_id})</span></b>
        <span className="text-xs text-brand-700">Shared API · read-only · {provenance?.label ?? 'provenance not returned'} v{provenance?.dataset_version ?? '?'}</span>
      </div>
      <div className="mt-1 text-xs">Cooperative: {farmer.cooperative_name ?? 'not recorded'} ({farmer.cooperative_id ?? '—'}) · Farms: {farms.length ? farms.map((f) => `${f.name} (${f.farm_id}, ${f.state})`).join(', ') : 'none returned'}</div>
      <div className="mt-1 text-xs">Batches: {totals.batches} ({counts(totals.batchesByStatus)}) · Shipments carrying these batches: {totals.shipmentsCarryingBatches}</div>
      <div className="mt-3 text-xs font-semibold">Batches in demo shipment {SHIPMENT_ID}</div>
      {inShipment.error ? <div className="mt-1 text-xs text-red-700">Unavailable: {inShipment.error}</div>
        : inShipment.loading || !inShipment.data ? <div className="mt-1 text-xs">Loading…</div>
        : inShipment.data.batches.length === 0 ? <div className="mt-1 text-xs">The API returned no batches from {FARMER_ID} in {SHIPMENT_ID}.</div>
        : inShipment.data.batches.map((b) => <div key={b.batch_id} className="mt-1 font-mono text-xs">{b.batch_id} · {b.product_name} · {b.declared_kg} kg · hub {b.hub_id} · {b.status}</div>)}
      <div className="mt-3 text-xs font-semibold">Most recent batches</div>
      {batches.length === 0 ? <div className="mt-1 text-xs">No batches returned.</div>
        : batches.map((b) => <div key={b.batch_id} className="mt-1 font-mono text-xs">{b.batch_id} · {b.product_name} · {b.declared_kg} kg · harvested {utc(b.harvest_at)} · freshness at harvest {b.freshness_score_at_harvest ?? 'not recorded'} · {b.status}</div>)}
      <div className="mt-2 text-xs text-gray-500">Other dashboard cards below still use the portal's local demo data.</div>
    </section>
  );
}
