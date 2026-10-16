/*
# Create products table for FarmXpress Smart Farm Portal

1. New Tables
- `products`
  - `id` (uuid, primary key)
  - `product_type` (text, e.g. Vegetable, Fruit, Grain, Dairy)
  - `product_name` (text, e.g. Tomato)
  - `quantity_kg` (numeric, quantity in kilograms)
  - `harvest_date` (date, when the produce was harvested)
  - `storage_requirement` (text, one of: Normal, Cold Chain, Humidity Control)
  - `batch_number` (text, generated batch identifier e.g. A102)
  - `freshness_score` (integer, 0-100, AI freshness score)
  - `status` (text, one of: Stored, Dispatched, Delivered, Pending Pickup)
  - `traceability` (text[], ordered list of nodes e.g. {Farm, Hub, Buyer})
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on `products`.
- Single-tenant no-auth app: allow anon + authenticated full CRUD since data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL,
  product_name text NOT NULL,
  quantity_kg numeric NOT NULL DEFAULT 0,
  harvest_date date NOT NULL DEFAULT CURRENT_DATE,
  storage_requirement text NOT NULL DEFAULT 'Normal',
  batch_number text NOT NULL,
  freshness_score integer NOT NULL DEFAULT 92,
  status text NOT NULL DEFAULT 'Stored',
  traceability text[] NOT NULL DEFAULT ARRAY['Farm', 'Hub', 'Buyer'],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);
