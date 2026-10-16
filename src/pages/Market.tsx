import { useState } from 'react';
import { Store, TrendingUp, Star, MapPin, ArrowRight, ShoppingCart, X, CheckCircle2 } from 'lucide-react';
import { useEventContext } from '../lib/EventContext';
import { emitEvent, nextOrderId, nextRouteId } from '../lib/eventBus';
import { orderStatusChip, freshnessColor } from '../lib/ui';
import { Store } from 'lucide-react';

const FARMER_ID = 'F-1001';

export default function Market() {
  const { buyers, batches, orders, vehicles, drivers, hubs, reloadAll } = useEventContext();
  const [sellModal, setSellModal] = useState<{ buyerId: string } | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [qty, setQty] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const storedBatches = batches.filter((b) => b.status === 'Stored');

  const placeOrder = async () => {
    if (!sellModal || !selectedBatch || !qty || !price) return;
    setPlacing(true);
    const batch = batches.find((b) => b.batch_id === selectedBatch);
    if (!batch) { setPlacing(false); return; }

    const orderId = await nextOrderId();
    const routeId = await nextRouteId();

    // Create order

    // Assign an available vehicle + driver
    const availVehicle = vehicles.find((v) => v.status === 'Idle');
    const availDriver = drivers.find((d) => d.status === 'Available');
    const hub = hubs[0];

    // Update vehicle + driver status
    
    // Emit events
    await emitEvent({
      event_type: 'ORDER_PLACED',
      source_module: 'Farmer Portal',
      severity: 'info',
      title: 'Order Placed',
      message: `Order ${orderId} placed for ${qty} kg ${batch.product_name} to ${sellModal.buyerId} at ₹${price}/kg.`,
      payload: { order_id: orderId, batch_id: selectedBatch, buyer_id: sellModal.buyerId },
      related_order_id: orderId,
      related_batch_id: selectedBatch,
      notify_farmer_id: FARMER_ID,
    });

    await emitEvent({
      event_type: 'ROUTE_ASSIGNED',
      source_module: 'Hub Control Tower',
      severity: 'info',
      title: 'Route Assigned',
      message: `Route ${routeId} assigned for order ${orderId}. Vehicle ${availVehicle?.vehicle_id ?? 'TBD'}, Driver ${availDriver?.driver_id ?? 'TBD'}.`,
      payload: { route_id: routeId, order_id: orderId },
      related_route_id: routeId,
      related_order_id: orderId,
      related_vehicle_id: availVehicle?.vehicle_id ?? null,
      related_driver_id: availDriver?.driver_id ?? null,
      related_hub_id: hub?.hub_id ?? null,
      notify_farmer_id: FARMER_ID,
    });

    setSuccess(orderId);
    setPlacing(false);
    setSellModal(null);
    setSelectedBatch('');
    setQty(0);
    setPrice(0);
    reloadAll();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Market Connection</h2>
        <p className="text-sm text-slate-400">Connect with buyers, place orders, and auto-assign routes</p>
      </div>

      {/* Market demand banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Buyers', value: `${buyers.filter((b) => b.active).length}`, icon: Store, tint: 'from-brand-400 to-brand-600' },
          { label: 'Avg Price Trend', value: '+8.2%', icon: TrendingUp, tint: 'from-emerald-400 to-emerald-600' },
          { label: 'Open Orders', value: `${orders.filter((o) => o.status === 'Pending' || o.status === 'Confirmed').length}`, icon: ShoppingCart, tint: 'from-amber-400 to-amber-500' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.tint} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{k.value}</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* My orders */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">My Orders</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => {
              const buyer = buyers.find((b) => b.buyer_id === o.buyer_id);
              const batch = batches.find((b) => b.batch_id === o.batch_id);
              return (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-sky2-100 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-sky2-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      <span className="font-mono">{o.order_id}</span> · {batch?.product_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      Buyer {o.buyer_id} · Batch {o.batch_id} · {o.quantity_kg} kg · ₹{o.price_per_kg}/kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-sm">₹{o.total_amount.toLocaleString()}</p>
                  </div>
                  <span className={`chip ${orderStatusChip(o.status)}`}>{o.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Market list */}
      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">Recommended Markets</h3>
        <div className="space-y-3">
          {buyers.map((m) => (
            <div key={m.buyer_id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition">
              <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-800">{m.name}</p>
                  <span className="chip bg-amber-100 text-amber-700">
                    <Star className="w-3 h-3" /> {m.rating}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{m.buyer_id}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {m.location}</span>
                  <span>Type: <span className="font-semibold text-slate-700">{m.type}</span></span>
                  <span className={m.active ? 'text-brand-600 font-semibold' : 'text-slate-400'}>
                    {m.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setSellModal({ buyerId: m.buyer_id }); setSuccess(null); }}
                disabled={storedBatches.length === 0}
                className="btn-primary px-3 py-2 text-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Sell <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        {storedBatches.length === 0 && (
          <p className="text-xs text-amber-600 mt-3 text-center">No stored batches available to sell. Register produce first.</p>
        )}
      </div>

      {/* Sell modal */}
      {sellModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSellModal(null)} />
          <div className="relative card w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Place Order</h3>
                <p className="text-xs text-slate-400 font-mono">Buyer {sellModal.buyerId}</p>
              </div>
              <button onClick={() => setSellModal(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-brand-600" />
                </div>
                <p className="font-bold text-slate-800">Order Placed Successfully</p>
                <p className="text-sm text-slate-400 mt-1">Order <span className="font-mono font-semibold">{success}</span> created. Route assigned, vehicle & driver notified.</p>
                <button onClick={() => setSuccess(null)} className="btn-primary mt-4">Done</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label">Select Batch</label>
                  <select className="input" value={selectedBatch} onChange={(e) => {
                    setSelectedBatch(e.target.value);
                    const b = batches.find((x) => x.batch_id === e.target.value);
                    if (b) { setQty(Number(b.quantity_kg)); setPrice(28 + Math.floor(Math.random() * 20)); }
                  }}>
                    <option value="">Choose a batch...</option>
                    {storedBatches.map((b) => (
                      <option key={b.batch_id} value={b.batch_id}>{b.batch_id} · {b.product_name} ({b.quantity_kg} kg)</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Quantity (kg)</label>
                    <input type="number" min={0} className="input" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="label">Price (₹/kg)</label>
                    <input type="number" min={0} className="input" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} />
                  </div>
                </div>
                {qty && price ? (
                  <div className="rounded-xl bg-brand-50 p-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-semibold">Total</span>
                    <span className="text-lg font-extrabold text-brand-700">₹{(qty * price).toLocaleString()}</span>
                  </div>
                ) : null}
                <button onClick={placeOrder} disabled={placing || !selectedBatch || !qty || !price} className="btn-primary w-full">
                  {placing ? 'Placing order...' : 'Place Order & Assign Route'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Market() {
  return <div className="space-y-6 animate-fade-in"><div><h2 className="text-xl font-bold text-slate-800">Market Connection</h2><p className="text-sm text-slate-400">Buyer and order data are not connected in this standalone portal.</p></div><div className="card p-10 text-center"><Store className="w-8 h-8 text-brand-500 mx-auto mb-3" /><p className="font-semibold text-slate-700">No market data available</p><p className="text-sm text-slate-400 mt-1">Connect your preferred backend to manage buyers, orders, and routes.</p></div></div>;
}
