import { supabase } from './supabase';
import type { ModuleName, Severity } from '../types';

let eventCounter = 10000;
let notCounter = 10000;

function pad(n: number): string {
  return n.toString().padStart(4, '0');
}

interface CreateEventInput {
  event_type: string;
  source_module: ModuleName;
  severity: Severity;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  related_batch_id?: string | null;
  related_order_id?: string | null;
  related_route_id?: string | null;
  related_vehicle_id?: string | null;
  related_driver_id?: string | null;
  related_hub_id?: string | null;
  notify_farmer_id?: string | null;
}

/**
 * Central event bus. Inserts an event into the `events` table and, if
 * notify_farmer_id is set, creates a matching notification. Real-time
 * subscriptions on `events` and `notifications` propagate the update to
 * every connected module instantly.
 */
export async function emitEvent(input: CreateEventInput): Promise<void> {
  eventCounter += 1;
  const event_id = `EVT-${pad(eventCounter)}`;

  const { error } = await supabase.from('events').insert({
    event_id,
    event_type: input.event_type,
    source_module: input.source_module,
    severity: input.severity,
    title: input.title,
    message: input.message,
    payload: input.payload ?? null,
    related_batch_id: input.related_batch_id ?? null,
    related_order_id: input.related_order_id ?? null,
    related_route_id: input.related_route_id ?? null,
    related_vehicle_id: input.related_vehicle_id ?? null,
    related_driver_id: input.related_driver_id ?? null,
    related_hub_id: input.related_hub_id ?? null,
  });
  if (error) console.error('emitEvent error', error);

  if (input.notify_farmer_id) {
    notCounter += 1;
    const notification_id = `NOT-${pad(notCounter)}`;
    const { error: nErr } = await supabase.from('notifications').insert({
      notification_id,
      target_module: 'Farmer Portal',
      target_farmer_id: input.notify_farmer_id,
      title: input.title,
      message: input.message,
      severity: input.severity,
      read: false,
    });
    if (nErr) console.error('notification insert error', nErr);
  }
}

/** Generate the next sequential batch ID. */
export async function nextBatchId(): Promise<string> {
  const { count } = await supabase.from('batches').select('*', { count: 'exact', head: true });
  const n = (count ?? 0) + 1;
  return `BAT-${pad(n)}`;
}

/** Generate the next sequential order ID. */
export async function nextOrderId(): Promise<string> {
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const n = (count ?? 0) + 1;
  return `ORD-${pad(n)}`;
}

/** Generate the next sequential route ID. */
export async function nextRouteId(): Promise<string> {
  const { count } = await supabase.from('routes').select('*', { count: 'exact', head: true });
  const n = (count ?? 0) + 1;
  return `RTE-${pad(n)}`;
}
