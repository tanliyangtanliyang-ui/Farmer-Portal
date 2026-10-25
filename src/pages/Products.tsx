import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PackagePlus, Truck, Warehouse, RefreshCw, CheckCircle2, AlertTriangle, Snowflake, XCircle, Loader2 } from 'lucide-react';
import type { SharedShipmentState } from '../components/CanonicalShipment';
import { api, ApiError, FARMER_ID, localDate, newKey, type DeliveryRequest, type Farm, type Hub, type Produce, type Product } from '../lib/liveApi';

type ProductsProps = { shipmentState: SharedShipmentState };
type Notice = { tone: 'success' | 'error'; text: string } | null;
const errText = (e: unknown) => (e instanceof ApiError ? `${e.message} (${e.code})` : String(e));
const STATUS: Record<DeliveryRequest['status'], { label: string; cls: string }> = {
  requested: { label: 'Submitted · awaiting hub review', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved · vehicle assigned', cls: 'bg-sky-100 text-sky-700' },
  rejected: { label: 'Rejected by hub', cls: 'bg-red-100 text-red-700' },
  received: { label: 'Received at hub · listed for buyers', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' },
};

function NoticeBox({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const ok = notice.tone === 'success';
  return (
    <div role={ok ? 'status' : 'alert'} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}<span>{notice.text}</span>
    </div>
  );
}

function RegisterForm({ farms, products, onSaved }: { farms: Farm[]; products: Product[]; onSaved: (p: Produce) => void }) {
  const [form, setForm] = useState({ farm_id: '', product_id: '', quantity: '', harvest_date: localDate(), notes: '' });
  const [key, setKey] = useState(newKey);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  useEffect(() => { if (!form.farm_id && farms[0]) setForm((f) => ({ ...f, farm_id: farms[0].farm_id })); }, [farms, form.farm_id]);
  const product = products.find((p) => p.product_id === form.product_id);
  const qty = Number(form.quantity);
  const minHarvest = product ? localDate(new Date(), -(product.shelf_life_days - 1)) : undefined;
  const problems = [
    !form.farm_id && 'Choose a farm',
    !product && 'Choose a produce type',
    !(Number.isInteger(qty) && qty >= 1 && qty <= 20000) && 'Quantity must be a whole number of kg (1-20,000)',
    !form.harvest_date && 'Enter the harvest date',
    form.harvest_date > localDate() && 'Harvest date cannot be in the future',
    product && minHarvest && form.harvest_date < minHarvest && `${product.name} keeps ${product.shelf_life_days} days; harvest must be on or after ${minHarvest}`,
    form.notes.length > 200 && 'Notes must be 200 characters or fewer',
  ].filter(Boolean) as string[];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || problems.length) return;
    setBusy(true); setNotice(null);
    try {
      const out = await api<{ produce: Produce }>('/live/produce', { farmer_id: FARMER_ID, farm_id: form.farm_id, product_id: form.product_id, quantity_kg: qty, harvest_date: form.harvest_date, notes: form.notes.trim() || null, idempotency_key: key });
      setNotice({ tone: 'success', text: `Registered ${out.produce.produce_id}: ${out.produce.quantity_kg} kg ${out.produce.product_name}. You can now request delivery to a hub below.` });
      setForm((f) => ({ ...f, product_id: '', quantity: '', notes: '' })); setKey(newKey()); onSaved(out.produce);
    } catch (err) {
      setNotice({ tone: 'error', text: `Not saved: ${errText(err)}` });
    } finally { setBusy(false); }
  };

  return (
    <section className="card p-5" aria-labelledby="register-title">
      <div className="mb-4 flex items-center gap-2"><PackagePlus className="h-5 w-5 text-brand-500" /><h3 id="register-title" className="font-semibold text-slate-800">Register Produce</h3></div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" noValidate>
        <div><label className="label" htmlFor="rf-farm">Farm</label>
          <select id="rf-farm" className="input" value={form.farm_id} onChange={(e) => setForm({ ...form, farm_id: e.target.value })}>
            {farms.length === 0 && <option value="">Loading farms…</option>}
            {farms.map((f) => <option key={f.farm_id} value={f.farm_id}>{f.name} ({f.farm_id}, {f.state})</option>)}
          </select></div>
        <div><label className="label" htmlFor="rf-product">Produce</label>
          <select id="rf-product" className="input" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
            <option value="">Choose produce…</option>
            {products.map((p) => <option key={p.product_id} value={p.product_id}>{p.name} · {p.storage_class}</option>)}
          </select></div>
        <div><label className="label" htmlFor="rf-qty">Quantity (kg)</label>
          <input id="rf-qty" className="input" type="number" inputMode="numeric" min={1} max={20000} step={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 120" /></div>
        <div><label className="label" htmlFor="rf-date">Harvest date</label>
          <input id="rf-date" className="input" type="date" max={localDate()} min={minHarvest} value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} /></div>
        <div className="sm:col-span-2 lg:col-span-3"><label className="label" htmlFor="rf-notes">Notes (optional)</label>
          <input id="rf-notes" className="input" maxLength={200} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Grade, packing, handling notes" /></div>
        <div className="flex items-end"><button type="submit" className="btn-primary w-full" disabled={busy || problems.length > 0}>{busy ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Register produce'}</button></div>
      </form>
      {product && <p className="mt-3 text-xs text-slate-500">{product.name}: {product.storage_class} storage, {product.temp_min_c}–{product.temp_max_c} °C, shelf life {product.shelf_life_days} days (dataset product table).</p>}
      {problems.length > 0 && (form.quantity || form.product_id) && <ul className="mt-2 text-xs text-amber-700 list-disc pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      <div className="mt-3"><NoticeBox notice={notice} /></div>
    </section>
  );
}

function RequestForm({ produce, hubs, onDone, onCancel }: { produce: Produce; hubs: Hub[]; onDone: (r: DeliveryRequest) => void; onCancel: () => void }) {
  const chilled = produce.storage_class === 'chilled';
  const lastPickup = (() => {
    const byShelf = produce.shelf_life_days === null ? null : (() => { const d = new Date(`${produce.harvest_date}T00:00:00`); d.setDate(d.getDate() + produce.shelf_life_days - 1); return localDate(d); })();
    const by14 = localDate(new Date(), 14);
    return byShelf && byShelf < by14 ? byShelf : by14;
  })();
  const [form, setForm] = useState({ hub_id: hubs[0]?.hub_id ?? '', quantity: String(produce.available_kg), pickup_date: localDate(), transport: chilled ? 'refrigerated' : 'standard' });
  const [key] = useState(newKey);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const qty = Number(form.quantity);
  const problems = [
    !form.hub_id && 'Choose a hub',
    !(Number.isInteger(qty) && qty >= 1) && 'Quantity must be a whole number of kg',
    qty > produce.available_kg && `Only ${produce.available_kg} kg is available to send`,
    (form.pickup_date < localDate() || form.pickup_date > lastPickup) && `Pickup date must be between ${localDate()} and ${lastPickup}`,
    chilled && form.transport !== 'refrigerated' && 'Chilled produce needs refrigerated transport',
  ].filter(Boolean) as string[];
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || problems.length) return;
    setBusy(true); setNotice(null);
    try {
      const out = await api<{ request: DeliveryRequest }>('/live/delivery-requests', { farmer_id: FARMER_ID, produce_id: produce.produce_id, hub_id: form.hub_id, quantity_kg: qty, pickup_date: form.pickup_date, transport: form.transport, idempotency_key: key });
      onDone(out.request);
    } catch (err) { setNotice({ tone: 'error', text: `Request not created: ${errText(err)}` }); setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" noValidate>
      <div className="lg:col-span-2"><label className="label" htmlFor={`hub-${produce.produce_id}`}>Destination hub</label>
        <select id={`hub-${produce.produce_id}`} className="input" value={form.hub_id} onChange={(e) => setForm({ ...form, hub_id: e.target.value })}>
          {hubs.map((h) => <option key={h.hub_id} value={h.hub_id}>{h.name} ({h.hub_id}, {h.state})</option>)}
        </select></div>
      <div><label className="label" htmlFor={`q-${produce.produce_id}`}>Quantity (kg)</label>
        <input id={`q-${produce.produce_id}`} className="input" type="number" min={1} max={produce.available_kg} step={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
      <div><label className="label" htmlFor={`d-${produce.produce_id}`}>Pickup date</label>
        <input id={`d-${produce.produce_id}`} className="input" type="date" min={localDate()} max={lastPickup} value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} /></div>
      <div><label className="label" htmlFor={`t-${produce.produce_id}`}>Transport</label>
        <select id={`t-${produce.produce_id}`} className="input" value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })}>
          <option value="refrigerated">Refrigerated</option>
          <option value="standard" disabled={chilled}>{chilled ? 'Standard (not allowed: chilled)' : 'No refrigeration requested (standard truck if within 60 km)'}</option>
        </select></div>
      <p className="sm:col-span-2 lg:col-span-5 text-[11px] text-slate-500">Standard truck: FarmXpress prototype simulation rule. Cool produce may go on a standard truck when the estimated road distance to the hub is at most 60 km; otherwise the hub assigns a refrigerated truck. Not an official transport regulation or a temperature-safety guarantee.</p>
      {problems.length > 0 && <ul className="sm:col-span-2 lg:col-span-5 text-xs text-amber-700 list-disc pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap gap-2 justify-end">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>Close</button>
        <button type="submit" className="btn-primary" disabled={busy || problems.length > 0}>{busy ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <><Truck className="w-4 h-4" />Send delivery request</>}</button>
      </div>
      <div className="sm:col-span-2 lg:col-span-5"><NoticeBox notice={notice} /></div>
    </form>
  );
}

export default function Products({ shipmentState }: ProductsProps) {
  const lines = shipmentState.value?.lines ?? [];
  const [farms, setFarms] = useState<Farm[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [refError, setRefError] = useState<string | null>(null);
  const [produce, setProduce] = useState<Produce[] | null>(null);
  const [requests, setRequests] = useState<DeliveryRequest[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<Notice>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadRefs = useCallback(() => {
    setRefError(null);
    Promise.all([
      api<{ farms: Farm[] }>(`/farmers/${FARMER_ID}?limit=1`), api<{ products: Product[] }>('/products'), api<{ hubs: Hub[] }>('/hubs'),
    ]).then(([f, p, h]) => { setFarms(f.farms); setProducts(p.products); setHubs(h.hubs); }).catch((e) => setRefError(errText(e)));
  }, []);
  const loadLists = useCallback(() => {
    setListError(null);
    Promise.all([api<{ produce: Produce[] }>(`/live/produce?farmer=${FARMER_ID}`), api<{ requests: DeliveryRequest[] }>(`/live/delivery-requests?farmer=${FARMER_ID}`)])
      .then(([p, r]) => { setProduce(p.produce); setRequests(r.requests); }).catch((e) => setListError(errText(e)));
  }, []);
  useEffect(() => { loadRefs(); loadLists(); }, [loadRefs, loadLists]);
  // Pick up hub decisions (approve / reject / receipt) without a manual reload.
  useEffect(() => {
    const t = setInterval(() => {
      Promise.all([api<{ produce: Produce[] }>(`/live/produce?farmer=${FARMER_ID}`), api<{ requests: DeliveryRequest[] }>(`/live/delivery-requests?farmer=${FARMER_ID}`)])
        .then(([p, r]) => { setProduce(p.produce); setRequests(r.requests); }).catch(() => { /* keep the last loaded list; the next poll retries */ });
    }, 20_000);
    return () => clearInterval(t);
  }, []);

  const cancel = async (r: DeliveryRequest) => {
    setCancelling(r.request_id); setPageNotice(null);
    try { await api(`/live/delivery-requests/${r.request_id}/cancel`, { farmer_id: FARMER_ID }); setPageNotice({ tone: 'success', text: `${r.request_id} cancelled; ${r.quantity_kg} kg returned to ${r.produce_id}.` }); }
    catch (e) { setPageNotice({ tone: 'error', text: `Could not cancel ${r.request_id}: ${errText(e)}` }); }
    finally { setCancelling(null); loadLists(); }
  };

  return <div className="space-y-6 animate-fade-in">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-xl font-bold text-slate-800">My Products</h2>
        <p className="text-sm text-slate-400">Register harvested produce and send it to a consolidation hub. Saved records persist in the FarmXpress API (farmer <span className="font-mono">{FARMER_ID}</span>).</p>
      </div>
      <button type="button" className="btn-ghost" onClick={() => { loadRefs(); loadLists(); }}><RefreshCw className="w-4 h-4" />Refresh</button>
    </div>

    {refError && <NoticeBox notice={{ tone: 'error', text: `Farms, produce types or hubs unavailable: ${refError}. Registration is disabled until the API responds.` }} />}
    {!refError && <RegisterForm farms={farms} products={products} onSaved={() => loadLists()} />}
    <NoticeBox notice={pageNotice} />

    <section className="card p-5" aria-labelledby="produce-title">
      <div className="mb-4 flex items-center gap-2"><Warehouse className="h-5 w-5 text-brand-500" /><h3 id="produce-title" className="font-semibold text-slate-800">Registered produce</h3></div>
      {listError && <NoticeBox notice={{ tone: 'error', text: `Could not load your produce: ${listError}` }} />}
      {!listError && produce === null && <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>}
      {produce !== null && produce.length === 0 && <p className="text-sm text-slate-500">No produce registered yet. Use the form above.</p>}
      <div className="space-y-3">
        {(produce ?? []).map((p) => (
          <article key={p.produce_id} className="rounded-xl border border-slate-100 bg-white p-4" data-produce-id={p.produce_id}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-800">{p.product_name}</p>
              <span className="chip bg-slate-100 text-slate-600 font-mono">{p.produce_id}</span>
              {p.storage_class === 'chilled' && <span className="chip bg-sky2-100 text-sky2-700"><Snowflake className="w-3 h-3" />Chilled</span>}
              {p.days_of_shelf_life_left !== null && p.days_of_shelf_life_left <= 2 && <span className="chip bg-amber-100 text-amber-700">{p.days_of_shelf_life_left} day(s) of shelf life left</span>}
            </div>
            <p className="mt-1 text-sm text-slate-600">{p.quantity_kg} kg registered · <b>{p.available_kg} kg</b> not yet sent · {p.requested_kg} kg in delivery requests</p>
            <p className="mt-0.5 text-xs text-slate-500">{p.farm_name} ({p.farm_id}) · harvested {p.harvest_date} · {p.days_since_harvest} day(s) ago{p.notes ? ` · ${p.notes}` : ''}</p>
            {openFor === p.produce_id
              ? <RequestForm produce={p} hubs={hubs} onCancel={() => setOpenFor(null)} onDone={(r) => { setOpenFor(null); setPageNotice({ tone: 'success', text: `Delivery request ${r.request_id} sent: ${r.quantity_kg} kg ${r.product_name} to ${r.hub_name}, pickup ${r.pickup_date} (${r.transport}).` }); loadLists(); }} />
              : <button type="button" className="btn-ghost mt-3" disabled={p.available_kg === 0 || hubs.length === 0} onClick={() => setOpenFor(p.produce_id)}><Truck className="w-4 h-4" />{p.available_kg === 0 ? 'All quantity requested' : 'Request delivery to hub'}</button>}
          </article>
        ))}
      </div>
    </section>

    <section className="card p-5" aria-labelledby="req-title">
      <div className="mb-4 flex items-center gap-2"><Truck className="h-5 w-5 text-brand-500" /><h3 id="req-title" className="font-semibold text-slate-800">Delivery requests to hubs</h3></div>
      {requests !== null && requests.length === 0 && <p className="text-sm text-slate-500">No delivery requests yet.</p>}
      <div className="space-y-3">
        {(requests ?? []).map((r) => (
          <article key={r.request_id} className="rounded-xl border border-slate-100 p-4 flex flex-wrap items-start gap-3" data-request-id={r.request_id}>
            <div className="flex-1 min-w-[220px]">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono font-semibold text-slate-800">{r.request_id}</span><span className={`chip ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span></div>
              <p className="mt-1 text-sm text-slate-600">{r.quantity_kg} kg {r.product_name} → {r.hub_name} ({r.hub_id})</p>
              <p className="text-xs text-slate-500">From {r.produce_id} · pickup {r.pickup_date} · {r.transport} transport{r.transport_rule?.estimated_road_km != null ? ` · ${r.transport_rule.estimated_road_km} km est. · ${r.transport_rule.refrigerated_required ? 'refrigerated truck needed' : 'standard truck possible'}` : ''} · created {r.created_at.replace('T', ' ').slice(0, 16)} UTC{r.listing_id ? ` · marketplace listing ${r.listing_id}` : ''}</p>
              {r.vehicle && <p className="mt-1 text-xs text-sky-700">Hub assigned vehicle {r.vehicle.vehicle_id} ({r.vehicle.plate}, {r.vehicle.type}, {r.vehicle.capacity_kg} kg) for collection on {r.pickup_date}. {r.driver_assignment ? '' : 'Driver is confirmed at dispatch.'}</p>}
              {r.driver_assignment && <p className="mt-1 text-xs text-sky-700">Collection dispatched on {r.driver_assignment.shipment_id} ({r.driver_assignment.status_label}): driver {r.driver_assignment.driver_name ?? r.driver_assignment.driver_id}, vehicle {r.driver_assignment.vehicle_id}, trip starts {new Date(r.driver_assignment.planned_start_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })} (planned estimate).</p>}
              {r.collection && <p className={`mt-1 text-xs ${r.collection.outstanding_qty ? 'text-red-700' : 'text-emerald-700'}`} data-testid={`farmer-collection-${r.request_id}`}>Collection record: {r.collection.status_label} ({r.collection.delivered_qty} of {r.collection.delivered_qty + r.collection.outstanding_qty} kg){r.collection.pods.map((p) => ` · ${p.pod_id} ${p.outcome}${p.reason_label ? ` (${p.reason_label})` : ''}, condition ${p.produce_condition.replace(/_/g, ' ')}`).join('')}</p>}
              {r.onward && (
                <div className="mt-1 text-xs" data-testid={`farmer-onward-${r.request_id}`}>
                  {r.onward.orders.length === 0
                    ? <p className="text-slate-500">Listed for buyers: {r.onward.available_kg ?? 0} of {r.onward.listed_kg ?? r.quantity_kg} kg still available, no buyer orders yet.</p>
                    : <>
                      <p className="font-semibold text-emerald-700">Sold {r.onward.sold_kg} of {r.onward.listed_kg ?? r.quantity_kg} kg to buyers{r.onward.available_kg ? ` · ${r.onward.available_kg} kg still listed` : ''}</p>
                      {r.onward.orders.map((o) => (
                        <p key={o.order_id} className={o.progress?.stage === 'delivered' ? 'text-emerald-700' : ['rejected', 'cancelled'].includes(o.status) ? 'text-slate-400' : 'text-slate-600'}>
                          {o.order_id} · {o.kg} kg to {o.buyer_name ?? 'buyer'} · {o.progress?.label ?? o.status}{o.delivered_at ? ` · ${new Date(o.delivered_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}` : ''}
                        </p>
                      ))}
                    </>}
                </div>
              )}
              {r.status === 'rejected' && <p className="mt-1 text-xs text-red-700">Hub reason: {r.decision_reason ?? 'not given'}. The {r.quantity_kg} kg is available to request again.</p>}
            </div>
            {r.status === 'requested' && <button type="button" className="btn-ghost text-red-600" disabled={cancelling === r.request_id} onClick={() => cancel(r)}><XCircle className="w-4 h-4" />{cancelling === r.request_id ? 'Cancelling…' : 'Cancel request'}</button>}
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">The destination hub reviews each request in the Consolidation Hub portal: it approves and assigns a vehicle, or rejects with a reason. When the hub confirms receipt, the produce is listed for buyers at that hub. This list refreshes every 20 seconds.</p>
    </section>

    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <PackagePlus className="h-5 w-5 text-brand-500" />
        <h3 className="font-semibold text-slate-800">Shipment batch traceability</h3>
      </div>
      {shipmentState.loading && <p className="text-sm text-slate-500">Loading shared allocation lines…</p>}
      {shipmentState.error && <p className="text-sm text-red-600">Shared shipment unavailable: {shipmentState.error}.</p>}
      {!shipmentState.loading && !shipmentState.error && lines.length === 0 && (
        <p className="text-sm text-slate-500">No allocation lines were returned for this shipment.</p>
      )}
      {!shipmentState.loading && !shipmentState.error && lines.length > 0 && (
        <div className="space-y-3">
          {lines.map((line) => (
            <article key={line.allocation_id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-800">{line.product_name}</p>
              <p className="mt-1 text-slate-600">{line.quantity_kg} kg · Order {line.order_id} · {line.order_status}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">Batch {line.batch_id}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  </div>;
}
