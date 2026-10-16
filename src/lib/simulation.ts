import { supabase } from './supabase';
import { emitEvent } from './eventBus';
import type { Batch, Order, Route, Vehicle, Driver } from '../types';

const FARMER_ID = 'F-1001';

interface SimContext {
  batches: Batch[];
  orders: Order[];
  routes: Route[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

let simRunning = false;
let simTimer: ReturnType<typeof setInterval> | null = null;

const SCENARIOS: ((ctx: SimContext) => Promise<void>)[] = [
  // Weather alert
  async () => {
    await emitEvent({
      event_type: 'WEATHER_ALERT',
      source_module: 'AI Engine',
      severity: 'warning',
      title: 'Weather Alert',
      message: 'Heavy rain expected in Green Valley within 2 hours. Harvest leafy vegetables early.',
      payload: { condition: 'rain', eta_hours: 2 },
      notify_farmer_id: FARMER_ID,
    });
  },

  // Temperature abnormality on a batch
  async (ctx) => {
    const coldBatches = ctx.batches.filter((b) => b.storage_requirement === 'Cold Chain' && b.status !== 'Delivered');
    if (coldBatches.length === 0) return;
    const batch = coldBatches[Math.floor(Math.random() * coldBatches.length)];
    const temp = 8 + Math.floor(Math.random() * 6);
    await supabase.from('sensors').update({
      last_reading: { value: temp, unit: 'C' },
      last_reading_at: new Date().toISOString(),
      status: 'Alert',
    }).eq('target_id', batch.batch_id).eq('sensor_type', 'temperature');

    await emitEvent({
      event_type: 'TEMPERATURE_ABNORMALITY',
      source_module: 'IoT Sensor Platform',
      severity: 'error',
      title: 'Temperature Abnormality',
      message: `Sensor on ${batch.batch_id} (${batch.product_name}) reports ${temp}°C — cold chain breach!`,
      payload: { batch_id: batch.batch_id, temperature_c: temp, threshold: 6 },
      related_batch_id: batch.batch_id,
      notify_farmer_id: FARMER_ID,
    });
  },

  // Traffic congestion on an active route
  async (ctx) => {
    const active = ctx.routes.filter((r) => r.status === 'In Transit');
    if (active.length === 0) return;
    const route = active[Math.floor(Math.random() * active.length)];
    const delay = 15 + Math.floor(Math.random() * 30);
    await supabase.from('routes').update({ eta_minutes: (route.eta_minutes + delay), status: 'Delayed' }).eq('route_id', route.route_id);

    await emitEvent({
      event_type: 'TRAFFIC_CONGESTION',
      source_module: 'AI Engine',
      severity: 'warning',
      title: 'Traffic Congestion',
      message: `Route ${route.route_id} delayed by ${delay} min due to traffic on ${route.origin} → ${route.destination}.`,
      payload: { route_id: route.route_id, delay_minutes: delay },
      related_route_id: route.route_id,
      related_vehicle_id: route.vehicle_id,
      related_driver_id: route.driver_id,
      notify_farmer_id: FARMER_ID,
    });
  },

  // Successful delivery
  async (ctx) => {
    const inTransit = ctx.orders.filter((o) => o.status === 'In Transit');
    if (inTransit.length === 0) return;
    const order = inTransit[Math.floor(Math.random() * inTransit.length)];
    await supabase.from('orders').update({ status: 'Delivered', updated_at: new Date().toISOString() }).eq('order_id', order.order_id);
    await supabase.from('batches').update({ status: 'Delivered' }).eq('batch_id', order.batch_id);
    const route = ctx.routes.find((r) => r.order_id === order.order_id);
    if (route) {
      await supabase.from('routes').update({ status: 'Completed', completed_at: new Date().toISOString(), eta_minutes: 0 }).eq('route_id', route.route_id);
    }
    if (route?.vehicle_id) {
      await supabase.from('vehicles').update({ status: 'Idle' }).eq('vehicle_id', route.vehicle_id);
    }
    if (route?.driver_id) {
      await supabase.from('drivers').update({ status: 'Available', current_vehicle_id: null }).eq('driver_id', route.driver_id);
    }

    await emitEvent({
      event_type: 'DELIVERY_COMPLETED',
      source_module: 'Driver Portal',
      severity: 'success',
      title: 'Delivery Completed',
      message: `Order ${order.order_id} delivered to buyer. Batch ${order.batch_id} marked delivered.`,
      payload: { order_id: order.order_id, batch_id: order.batch_id },
      related_order_id: order.order_id,
      related_batch_id: order.batch_id,
      related_route_id: route?.route_id ?? null,
      related_vehicle_id: route?.vehicle_id ?? null,
      related_driver_id: route?.driver_id ?? null,
      notify_farmer_id: FARMER_ID,
    });
  },

  // Quality inspection failure
  async (ctx) => {
    const candidates = ctx.batches.filter((b) => b.status === 'Pending Pickup' || b.status === 'Stored');
    if (candidates.length === 0) return;
    const batch = candidates[Math.floor(Math.random() * candidates.length)];
    const newScore = Math.max(40, batch.freshness_score - 15);
    await supabase.from('batches').update({ freshness_score: newScore, status: 'Rejected' }).eq('batch_id', batch.batch_id);

    await emitEvent({
      event_type: 'QUALITY_INSPECTION_FAILED',
      source_module: 'Hub Control Tower',
      severity: 'critical',
      title: 'Quality Inspection Failed',
      message: `Batch ${batch.batch_id} (${batch.product_name}) failed inspection at hub. Freshness dropped to ${newScore}%.`,
      payload: { batch_id: batch.batch_id, old_score: batch.freshness_score, new_score: newScore },
      related_batch_id: batch.batch_id,
      notify_farmer_id: FARMER_ID,
    });
  },

  // AI freshness recommendation
  async (ctx) => {
    const candidates = ctx.batches.filter((b) => b.status === 'Stored' || b.status === 'Pending Pickup');
    if (candidates.length === 0) return;
    const batch = candidates[Math.floor(Math.random() * candidates.length)];
    await emitEvent({
      event_type: 'AI_FRESHNESS_RECOMMENDATION',
      source_module: 'AI Engine',
      severity: 'info',
      title: 'AI Recommendation',
      message: `Dispatch ${batch.batch_id} (${batch.product_name}) within 6 hours — freshness declining.`,
      payload: { batch_id: batch.batch_id, current_score: batch.freshness_score, predicted_after_24h: batch.freshness_score - 14 },
      related_batch_id: batch.batch_id,
      notify_farmer_id: FARMER_ID,
    });
  },

  // Emergency situation
  async (ctx) => {
    const active = ctx.routes.filter((r) => r.status === 'In Transit' || r.status === 'Delayed');
    if (active.length === 0) return;
    const route = active[Math.floor(Math.random() * active.length)];
    await emitEvent({
      event_type: 'EMERGENCY_ALERT',
      source_module: 'Driver Portal',
      severity: 'critical',
      title: 'Emergency Alert',
      message: `Vehicle ${route.vehicle_id} reports emergency on route ${route.route_id}. Authorities notified.`,
      payload: { route_id: route.route_id, vehicle_id: route.vehicle_id },
      related_route_id: route.route_id,
      related_vehicle_id: route.vehicle_id,
      related_driver_id: route.driver_id,
      notify_farmer_id: FARMER_ID,
    });
  },

  // New buyer order
  async (ctx) => {
    const stored = ctx.batches.filter((b) => b.status === 'Stored');
    if (stored.length === 0) return;
    const batch = stored[Math.floor(Math.random() * stored.length)];
    const buyers = ['B-2001', 'B-2002', 'B-2003', 'B-2004'];
    const buyer = buyers[Math.floor(Math.random() * buyers.length)];
    const qty = Math.min(batch.quantity_kg, 50 + Math.floor(Math.random() * 200));
    const price = 25 + Math.floor(Math.random() * 25);

    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const orderId = `ORD-${((count ?? 0) + 1).toString().padStart(4, '0')}`;

    await supabase.from('orders').insert({
      order_id: orderId,
      buyer_id: buyer,
      farmer_id: FARMER_ID,
      batch_id: batch.batch_id,
      quantity_kg: qty,
      price_per_kg: price,
      total_amount: qty * price,
      status: 'Pending',
    });

    await emitEvent({
      event_type: 'ORDER_PLACED',
      source_module: 'Buyer Portal',
      severity: 'info',
      title: 'New Order Received',
      message: `${buyer} placed order ${orderId} for ${qty} kg ${batch.product_name} at ₹${price}/kg.`,
      payload: { order_id: orderId, buyer_id: buyer, batch_id: batch.batch_id },
      related_order_id: orderId,
      related_batch_id: batch.batch_id,
      notify_farmer_id: FARMER_ID,
    });
  },

  // IoT sensor heartbeat (normal reading)
  async (ctx) => {
    const batch = ctx.batches[Math.floor(Math.random() * ctx.batches.length)];
    if (!batch) return;
    const temp = 3 + Math.floor(Math.random() * 3);
    await supabase.from('sensors').update({
      last_reading: { value: temp, unit: 'C' },
      last_reading_at: new Date().toISOString(),
      status: 'Online',
    }).eq('target_id', batch.batch_id).eq('sensor_type', 'temperature');
  },
];

export function startSimulation(ctxRef: () => SimContext): void {
  if (simRunning) return;
  simRunning = true;
  simTimer = setInterval(async () => {
    const ctx = ctxRef();
    if (ctx.batches.length === 0) return;
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    try {
      await scenario(ctx);
    } catch (e) {
      console.error('simulation error', e);
    }
  }, 12000);
}

export function stopSimulation(): void {
  simRunning = false;
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
  }
}

export function isSimulationRunning(): boolean {
  return simRunning;
}
