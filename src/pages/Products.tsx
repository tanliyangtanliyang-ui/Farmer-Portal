import { useState } from 'react';
import { Plus, QrCode, MapPin, Calendar, Route, Snowflake, Droplets, Wheat, Trash2, X, Radio } from 'lucide-react';
import { useEventContext } from '../lib/EventContext';
import { supabase } from '../lib/supabase';
import { emitEvent, nextBatchId } from '../lib/eventBus';
import { batchStatusChip, freshnessColor, freshnessLabel, storageIcon } from '../lib/ui';
import type { Batch, StorageRequirement, NewBatch } from '../types';

const FARMER_ID = 'F-1001';
const PRODUCT_TYPES = ['Vegetable', 'Fruit', 'Grain', 'Dairy', 'Herb'];
const STORAGE_OPTIONS: StorageRequirement[] = ['Normal', 'Cold Chain', 'Humidity Control'];

export default function Products() {
  const { batches, loading, reloadAll } = useEventContext();
  const [showForm, setShowForm] = useState(false);
  const [identity, setIdentity] = useState<Batch | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<NewBatch>({
    farmer_id: FARMER_ID,
    product_type: 'Vegetable',
    product_name: '',
    quantity_kg: 0,
    harvest_date: new Date().toISOString().slice(0, 10),
    storage_requirement: 'Normal',
  });

  const update = <K extends keyof NewBatch>(key: K, value: NewBatch[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError(null);
    if (!form.product_name.trim() || !form.quantity_kg) {
      setError('Please fill in product name and quantity.');
      return;
    }
    setSaving(true);
    const batchId = await nextBatchId();
    const score = Math.floor(82 + Math.random() * 16);

    const { data, error: insErr } = await supabase.from('batches').insert({
      batch_id: batchId,
      farmer_id: FARMER_ID,
      product_type: form.product_type,
      product_name: form.product_name,
      quantity_kg: form.quantity_kg,
      harvest_date: form.harvest_date,
      storage_requirement: form.storage_requirement,
      freshness_score: score,
      status: 'Stored',
      traceability: ['Farm', 'Hub', 'Buyer'],
      origin_farm: 'ABC Farm',
    }).select().single();

    if (insErr || !data) {
      setSaving(false);
      setError(insErr?.message || 'Failed to register produce.');
      return;
    }

    // Create IoT sensors for the batch
    const baseTemp = form.storage_requirement === 'Cold Chain' ? 4 : form.storage_requirement === 'Humidity Control' ? 12 : 22;
    const sensorCount = await supabase.from('sensors').select('*', { count: 'exact', head: true });
    const sStart = (sensorCount.count ?? 0) + 1;
    await supabase.from('sensors').insert([
      {
        sensor_id: `S-${String(sStart).padStart(4, '0')}`,
        sensor_type: 'temperature',
        target_type: 'batch',
        target_id: batchId,
        status: 'Online',
        last_reading: { value: baseTemp, unit: 'C' },
        last_reading_at: new Date().toISOString(),
      },
      {
        sensor_id: `S-${String(sStart + 1).padStart(4, '0')}`,
        sensor_type: 'humidity',
        target_type: 'batch',
        target_id: batchId,
        status: 'Online',
        last_reading: { value: 70 + Math.floor(Math.random() * 15), unit: '%' },
        last_reading_at: new Date().toISOString(),
      },
    ]);

    // Emit cross-module event
    await emitEvent({
      event_type: 'BATCH_REGISTERED',
      source_module: 'Farmer Portal',
      severity: 'success',
      title: 'Batch Registered',
      message: `Batch ${batchId} (${form.product_name}, ${form.quantity_kg} kg) registered by ${FARMER_ID}.`,
      payload: { batch_id: batchId, product_name: form.product_name, quantity_kg: form.quantity_kg },
      related_batch_id: batchId,
      notify_farmer_id: FARMER_ID,
    });

    setIdentity(data as Batch);
    setShowForm(false);
    setForm({ farmer_id: FARMER_ID, product_type: 'Vegetable', product_name: '', quantity_kg: 0, harvest_date: new Date().toISOString().slice(0, 10), storage_requirement: 'Normal' });
    setSaving(false);
    reloadAll();
  };

  const remove = async (id: string, batchId: string) => {
    await supabase.from('sensors').delete().eq('target_id', batchId);
    await supabase.from('batches').delete().eq('id', id);
    await emitEvent({
      event_type: 'BATCH_REMOVED',
      source_module: 'Farmer Portal',
      severity: 'warning',
      title: 'Batch Removed',
      message: `Batch ${batchId} removed from the system.`,
      related_batch_id: batchId,
      notify_farmer_id: FARMER_ID,
    });
    reloadAll();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Products</h2>
          <p className="text-sm text-slate-400">{batches.length} registered batches · Farmer ID <span className="font-mono font-semibold text-slate-500">{FARMER_ID}</span></p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add New Produce
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-slate-400 text-sm">Loading products...</div>
      ) : batches.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <Wheat className="w-7 h-7 text-brand-500" />
          </div>
          <p className="font-semibold text-slate-700">No produce yet</p>
          <p className="text-sm text-slate-400 mt-1">Register your first batch to get started.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Add Produce
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((p) => (
            <div key={p.id} className="card p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-xl">
                    {storageIcon(p.storage_requirement)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{p.product_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.batch_id}</p>
                  </div>
                </div>
                <span className={`chip ${batchStatusChip(p.status)}`}>{p.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[11px] text-slate-400">Quantity</p>
                  <p className="font-semibold text-slate-700">{p.quantity_kg} kg</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[11px] text-slate-400">Freshness</p>
                  <p className={`font-semibold ${freshnessColor(p.freshness_score)}`}>{p.freshness_score}% · {freshnessLabel(p.freshness_score)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[11px] text-slate-400">Harvest</p>
                  <p className="font-semibold text-slate-700">{p.harvest_date}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[11px] text-slate-400">Storage</p>
                  <p className="font-semibold text-slate-700">{p.storage_requirement}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                <Route className="w-3.5 h-3.5" />
                {p.traceability.join(' → ')}
              </div>

              <button
                onClick={() => remove(p.id, p.batch_id)}
                className="mt-3 w-full text-xs font-semibold text-slate-400 hover:text-red-500 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Registration form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative card w-full sm:max-w-lg p-6 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Add New Produce</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Product Type</label>
                  <select className="input" value={form.product_type} onChange={(e) => update('product_type', e.target.value)}>
                    {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Product Name</label>
                  <input className="input" placeholder="e.g. Tomato" value={form.product_name} onChange={(e) => update('product_name', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantity (kg)</label>
                  <input type="number" min={0} className="input" placeholder="500" value={form.quantity_kg || ''} onChange={(e) => update('quantity_kg', Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Harvest Date</label>
                  <input type="date" className="input" value={form.harvest_date} onChange={(e) => update('harvest_date', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Storage Requirement</label>
                <div className="grid grid-cols-3 gap-2">
                  {STORAGE_OPTIONS.map((opt) => {
                    const active = form.storage_requirement === opt;
                    const Icon = opt === 'Cold Chain' ? Snowflake : opt === 'Humidity Control' ? Droplets : Wheat;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update('storage_requirement', opt)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition ${
                          active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-sky2-50 border border-sky2-100 p-3">
                <QrCode className="w-5 h-5 text-sky2-600 shrink-0" />
                <p className="text-xs text-sky2-700 font-semibold">A Batch ID, QR identity card, and IoT sensors will be generated automatically. An event will notify all modules.</p>
              </div>

              {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

              <button onClick={submit} disabled={saving} className="btn-primary w-full">
                {saving ? 'Registering...' : 'Generate QR / RFID & Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital identity card */}
      {identity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIdentity(null)} />
          <div className="relative card w-full max-w-sm p-6 rounded-3xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Digital Product Identity</p>
                <h3 className="text-lg font-bold text-slate-800">{identity.product_name} {identity.batch_id}</h3>
              </div>
              <button onClick={() => setIdentity(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex flex-col items-center my-4">
              <div className="w-36 h-36 rounded-2xl bg-white border-2 border-slate-200 p-3 flex items-center justify-center">
                <QrPattern />
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Radio className="w-3 h-3" /> IoT sensors attached</p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span className="text-slate-400">Origin:</span>
                <span className="font-semibold text-slate-700">{identity.origin_farm}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-sky2-500" />
                <span className="text-slate-400">Harvest:</span>
                <span className="font-semibold text-slate-700">{identity.harvest_date}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Route className="w-4 h-4 text-amber-500" />
                <span className="text-slate-400">Traceability:</span>
                <span className="font-semibold text-slate-700">{identity.traceability.join(' → ')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <span className="text-slate-400 font-mono text-xs">Farmer ID:</span>
                <span className="font-semibold text-slate-700 font-mono">{identity.farmer_id}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                <p className="text-[11px] text-slate-400">Qty</p>
                <p className="font-bold text-slate-700 text-sm">{identity.quantity_kg}kg</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                <p className="text-[11px] text-slate-400">Storage</p>
                <p className="font-bold text-slate-700 text-sm">{storageIcon(identity.storage_requirement)} {identity.storage_requirement.split(' ')[0]}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                <p className="text-[11px] text-slate-400">Score</p>
                <p className={`font-bold text-sm ${freshnessColor(identity.freshness_score)}`}>{identity.freshness_score}%</p>
              </div>
            </div>

            <button onClick={() => setIdentity(null)} className="btn-primary w-full mt-5">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QrPattern() {
  const cells = Array.from({ length: 49 }, (_, i) => {
    const row = Math.floor(i / 7);
    const col = i % 7;
    const corner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
    const dot = corner || ((row + col) % 2 === 0 && Math.random() > 0.3);
    return dot;
  });
  return (
    <div className="grid grid-cols-7 gap-0.5 w-full h-full">
      {cells.map((on, i) => (
        <div key={i} className={on ? 'bg-slate-800 rounded-sm' : 'bg-transparent'} />
      ))}
    </div>
  );
}
