/*
# FarmXpress Shared Event-Driven Schema (Farmer Portal module)

## Overview
Transforms the standalone products table into part of a multi-module event-driven
ecosystem (Farmer Portal, Buyer Portal, Hub Control Tower, Driver Portal, Government
Dashboard, AI Engine, IoT Sensors). All modules share consistent IDs and read/write
the same centralized cloud database.

## Consistent Identifiers (text, human-readable, prefixed)
- Farmer ID:   F-####   (e.g. F-1001)
- Buyer ID:    B-####    (e.g. B-2001)
- Batch ID:    BAT-####  (e.g. BAT-5001)  — replaces the old batch_number
- Order ID:    ORD-####  (e.g. ORD-9001)
- Route ID:    RTE-####  (e.g. RTE-7001)
- Vehicle ID:  V-####    (e.g. V-3001)
- Driver ID:   D-####    (e.g. D-4001)
- Hub ID:      H-####    (e.g. H-6001)
- Sensor ID:   S-####    (e.g. S-8001)

## New Tables
1. `farmers` — farm identity (this portal's owner + other farmers in ecosystem)
   - id (uuid PK), farmer_id (text unique, F-####), farm_name, location, email, phone,
     verified (bool), sustainability_grade, created_at
2. `buyers` — market/buyer identity
   - id (uuid PK), buyer_id (text unique, B-####), name, type, location, rating, active
3. `drivers` — driver identity
   - id (uuid PK), driver_id (text unique, D-####), name, phone, status, current_vehicle_id
4. `vehicles` — vehicle fleet
   - id (uuid PK), vehicle_id (text unique, V-####), plate, capacity_kg, type, status
5. `hubs` — consolidation hubs
   - id (uuid PK), hub_id (text unique, H-####), name, location, capacity_kg, status
6. `sensors` — IoT sensor devices attached to batches/vehicles/hubs
   - id (uuid PK), sensor_id (text unique, S-####), sensor_type (temperature|humidity|gps|shock),
     target_type (batch|vehicle|hub), target_id (text), status, last_reading (jsonb), last_reading_at
7. `batches` — produce batches (replaces products; links farmer + sensors + traceability)
   - id (uuid PK), batch_id (text unique, BAT-####), farmer_id (text F-####),
     product_type, product_name, quantity_kg, harvest_date, storage_requirement,
     freshness_score, status, traceability (text[]), origin_farm, created_at
8. `orders` — orders linking a buyer to one or more batches
   - id (uuid PK), order_id (text unique, ORD-####), buyer_id, farmer_id, batch_id,
     quantity_kg, price_per_kg, total_amount, status, created_at, updated_at
9. `routes` — delivery routes (hub → buyer or farm → hub)
   - id (uuid PK), route_id (text unique, RTE-####), order_id, vehicle_id, driver_id,
     hub_id, origin, destination, status, eta_minutes, started_at, completed_at, created_at
10. `events` — the central event log; every module appends here; drives real-time updates
   - id (uuid PK), event_id (text unique, EVT-####), event_type (text), source_module (text),
     severity (info|success|warning|error|critical), title, message, payload (jsonb),
     related_batch_id, related_order_id, related_route_id, related_vehicle_id,
     related_driver_id, related_hub_id, created_at
11. `notifications` — user-facing notifications derived from events
   - id (uuid PK), notification_id (text unique, NOT-####), target_module (text),
     target_farmer_id, title, message, severity, read (bool), created_at

## Modified Tables
- `products` is kept for backward compatibility but the canonical produce table is now
  `batches`. (No destructive changes to products.)

## Security
- RLS enabled on every new table.
- Single-tenant no-auth app: all policies use `TO anon, authenticated` with `USING (true)`
  / `WITH CHECK (true)` because the Farmer Portal runs with the anon key and the data is
  intentionally shared across modules for simulation.

## Real-time
- The frontend subscribes to `events`, `notifications`, `batches`, `orders`, `routes`,
  `sensors` via Supabase realtime channels to simulate cross-module live updates.
*/

-- 1. farmers
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id text UNIQUE NOT NULL,
  farm_name text NOT NULL,
  location text NOT NULL,
  email text,
  phone text,
  verified boolean NOT NULL DEFAULT true,
  sustainability_grade text NOT NULL DEFAULT 'A',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_farmers" ON farmers;
CREATE POLICY "anon_all_farmers" ON farmers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_farmers_ins" ON farmers;
CREATE POLICY "anon_all_farmers_ins" ON farmers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_farmers_upd" ON farmers;
CREATE POLICY "anon_all_farmers_upd" ON farmers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. buyers
CREATE TABLE IF NOT EXISTS buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Retail',
  location text NOT NULL,
  rating numeric NOT NULL DEFAULT 4.5,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_buyers_sel" ON buyers;
CREATE POLICY "anon_all_buyers_sel" ON buyers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_buyers_ins" ON buyers;
CREATE POLICY "anon_all_buyers_ins" ON buyers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_buyers_upd" ON buyers;
CREATE POLICY "anon_all_buyers_upd" ON buyers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. drivers
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'Available',
  current_vehicle_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_drivers_sel" ON drivers;
CREATE POLICY "anon_all_drivers_sel" ON drivers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_drivers_ins" ON drivers;
CREATE POLICY "anon_all_drivers_ins" ON drivers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_drivers_upd" ON drivers;
CREATE POLICY "anon_all_drivers_upd" ON drivers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text UNIQUE NOT NULL,
  plate text NOT NULL,
  capacity_kg numeric NOT NULL DEFAULT 1000,
  type text NOT NULL DEFAULT 'Refrigerated',
  status text NOT NULL DEFAULT 'Idle',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_vehicles_sel" ON vehicles;
CREATE POLICY "anon_all_vehicles_sel" ON vehicles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_vehicles_ins" ON vehicles;
CREATE POLICY "anon_all_vehicles_ins" ON vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_vehicles_upd" ON vehicles;
CREATE POLICY "anon_all_vehicles_upd" ON vehicles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. hubs
CREATE TABLE IF NOT EXISTS hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id text UNIQUE NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  capacity_kg numeric NOT NULL DEFAULT 5000,
  status text NOT NULL DEFAULT 'Operational',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_hubs_sel" ON hubs;
CREATE POLICY "anon_all_hubs_sel" ON hubs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_hubs_ins" ON hubs;
CREATE POLICY "anon_all_hubs_ins" ON hubs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_hubs_upd" ON hubs;
CREATE POLICY "anon_all_hubs_upd" ON hubs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. sensors
CREATE TABLE IF NOT EXISTS sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id text UNIQUE NOT NULL,
  sensor_type text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  status text NOT NULL DEFAULT 'Online',
  last_reading jsonb,
  last_reading_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_sensors_sel" ON sensors;
CREATE POLICY "anon_all_sensors_sel" ON sensors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_sensors_ins" ON sensors;
CREATE POLICY "anon_all_sensors_ins" ON sensors FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_sensors_upd" ON sensors;
CREATE POLICY "anon_all_sensors_upd" ON sensors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. batches
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text UNIQUE NOT NULL,
  farmer_id text NOT NULL,
  product_type text NOT NULL,
  product_name text NOT NULL,
  quantity_kg numeric NOT NULL DEFAULT 0,
  harvest_date date NOT NULL DEFAULT CURRENT_DATE,
  storage_requirement text NOT NULL DEFAULT 'Normal',
  freshness_score integer NOT NULL DEFAULT 92,
  status text NOT NULL DEFAULT 'Stored',
  traceability text[] NOT NULL DEFAULT ARRAY['Farm','Hub','Buyer'],
  origin_farm text NOT NULL DEFAULT 'ABC Farm',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_batches_sel" ON batches;
CREATE POLICY "anon_all_batches_sel" ON batches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_batches_ins" ON batches;
CREATE POLICY "anon_all_batches_ins" ON batches FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_batches_upd" ON batches;
CREATE POLICY "anon_all_batches_upd" ON batches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_batches_del" ON batches;
CREATE POLICY "anon_all_batches_del" ON batches FOR DELETE TO anon, authenticated USING (true);

-- 8. orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  buyer_id text NOT NULL,
  farmer_id text NOT NULL,
  batch_id text NOT NULL,
  quantity_kg numeric NOT NULL DEFAULT 0,
  price_per_kg numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_orders_sel" ON orders;
CREATE POLICY "anon_all_orders_sel" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_orders_ins" ON orders;
CREATE POLICY "anon_all_orders_ins" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_orders_upd" ON orders;
CREATE POLICY "anon_all_orders_upd" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. routes
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id text UNIQUE NOT NULL,
  order_id text NOT NULL,
  vehicle_id text,
  driver_id text,
  hub_id text,
  origin text NOT NULL,
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'Planned',
  eta_minutes integer NOT NULL DEFAULT 60,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_routes_sel" ON routes;
CREATE POLICY "anon_all_routes_sel" ON routes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_routes_ins" ON routes;
CREATE POLICY "anon_all_routes_ins" ON routes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_routes_upd" ON routes;
CREATE POLICY "anon_all_routes_upd" ON routes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 10. events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  source_module text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  payload jsonb,
  related_batch_id text,
  related_order_id text,
  related_route_id text,
  related_vehicle_id text,
  related_driver_id text,
  related_hub_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_events_sel" ON events;
CREATE POLICY "anon_all_events_sel" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_events_ins" ON events;
CREATE POLICY "anon_all_events_ins" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 11. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id text UNIQUE NOT NULL,
  target_module text NOT NULL DEFAULT 'Farmer Portal',
  target_farmer_id text,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_notifications_sel" ON notifications;
CREATE POLICY "anon_all_notifications_sel" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_all_notifications_ins" ON notifications;
CREATE POLICY "anon_all_notifications_ins" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_notifications_upd" ON notifications;
CREATE POLICY "anon_all_notifications_upd" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_all_notifications_del" ON notifications;
CREATE POLICY "anon_all_notifications_del" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- Indexes for realtime / frequent queries
CREATE INDEX IF NOT EXISTS idx_batches_farmer_id ON batches(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_routes_order_id ON routes(order_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_module, target_farmer_id, read);
CREATE INDEX IF NOT EXISTS idx_sensors_target ON sensors(target_type, target_id);
