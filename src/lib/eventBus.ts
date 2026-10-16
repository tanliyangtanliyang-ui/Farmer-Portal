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
  if (error) console.error('emitEvent error', error);



/** Generate the next sequential order ID. */

