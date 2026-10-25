import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_FARMXPRESS_API_BASE_URL ?? 'http://127.0.0.1:4000/v1';
const SHIPMENT_ID = 'SHP-000006';

export type ShipmentAllocationLine = {
  allocation_id: string;
  quantity_kg: number;
  batch_id: string;
  product_id: string;
  product_name: string;
  order_id: string;
  buyer_id: string;
  order_status: string;
};

export type ShipmentScenario = {
  shipment: { shipment_id: string; status: string; loaded_kg: number };
  lines: ShipmentAllocationLine[];
  completeness: { sensorObservationCount: number; missingSensorObservationCount: number };
};

export type SharedShipmentState = {
  loading: boolean;
  value?: ShipmentScenario;
  error?: string;
};

type CanonicalShipmentProps = {
  onScenarioChange?: (state: SharedShipmentState) => void;
};

export default function CanonicalShipment({ onScenarioChange }: CanonicalShipmentProps) {
  const [state, setState] = useState<SharedShipmentState>({ loading: true });

  useEffect(() => {
    let active = true;
    const publish = (next: SharedShipmentState) => {
      if (!active) return;
      setState(next);
      onScenarioChange?.(next);
    };

    publish({ loading: true });
    fetch(`${API}/shipments/${SHIPMENT_ID}/scenario`)
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error(`API ${response.status}`)))
      .then((value: ShipmentScenario) => publish({ loading: false, value }))
      .catch((error: Error) => publish({ loading: false, error: error.message }));

    return () => { active = false; };
  }, [onScenarioChange]);

  if (state.error) {
    return <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Shared shipment unavailable: {state.error}.</div>;
  }
  if (state.loading || !state.value) {
    return <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700">Loading shared shipment…</div>;
  }

  const { shipment, lines, completeness } = state.value;
  return (
    <section className="mb-5 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
      <b>Shared read-only shipment</b>
      <div className="mt-1 font-mono text-xs">
        {shipment.shipment_id} · {shipment.status} · {shipment.loaded_kg} kg · {lines.map((line) => `${line.order_id}/${line.batch_id}`).join(', ')}
      </div>
      <div className="mt-1 text-xs">
        {completeness.sensorObservationCount} observations; {completeness.missingSensorObservationCount} explicitly missing.
      </div>
      <div className="mt-1 text-xs text-brand-700">Reference shipment from the dataset (Jan–Jun 2026), shown for traceability.</div>
    </section>
  );
}
