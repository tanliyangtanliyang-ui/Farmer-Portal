// Shared FarmXpress data model — consistent IDs across all modules
// Farmer ID: F-#### | Buyer ID: B-#### | Batch ID: BAT-####
// Order ID: ORD-#### | Route ID: RTE-#### | Vehicle ID: V-####
// Driver ID: D-#### | Hub ID: H-#### | Sensor ID: S-####

export type StorageRequirement = 'Normal' | 'Cold Chain' | 'Humidity Control';
export type BatchStatus = 'Stored' | 'Pending Pickup' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Rejected';
export type OrderStatus = 'Pending' | 'Confirmed' | 'In Transit' | 'Delivered' | 'Cancelled';
export type RouteStatus = 'Planned' | 'Assigned' | 'In Transit' | 'Delayed' | 'Completed' | 'Cancelled';
export type VehicleStatus = 'Idle' | 'Loading' | 'In Transit' | 'Maintenance' | 'Offline';
export type DriverStatus = 'Available' | 'On Duty' | 'Offline';
export type SensorType = 'temperature' | 'humidity' | 'gps' | 'shock';
export type SensorStatus = 'Online' | 'Offline' | 'Alert';
export type Severity = 'info' | 'success' | 'warning' | 'error' | 'critical';
export type ModuleName =
  | 'Farmer Portal'
  | 'Buyer Portal'
  | 'Hub Control Tower'
  | 'Driver Portal'
  | 'Government Dashboard'
  | 'AI Engine'
  | 'IoT Sensor Platform';

export interface Farmer {
  id: string;
  farmer_id: string;
  farm_name: string;
  location: string;
  email: string | null;
  phone: string | null;
  verified: boolean;
  sustainability_grade: string;
  created_at: string;
}

export interface Buyer {
  id: string;
  buyer_id: string;
  name: string;
  type: string;
  location: string;
  rating: number;
  active: boolean;
  created_at: string;
}

export interface Driver {
  id: string;
  driver_id: string;
  name: string;
  phone: string | null;
  status: DriverStatus;
  current_vehicle_id: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_id: string;
  plate: string;
  capacity_kg: number;
  type: string;
  status: VehicleStatus;
  created_at: string;
}

export interface Hub {
  id: string;
  hub_id: string;
  name: string;
  location: string;
  capacity_kg: number;
  status: string;
  created_at: string;
}

export interface Sensor {
  id: string;
  sensor_id: string;
  sensor_type: SensorType;
  target_type: 'batch' | 'vehicle' | 'hub';
  target_id: string;
  status: SensorStatus;
  last_reading: Record<string, number | string> | null;
  last_reading_at: string | null;
  created_at: string;
}

export interface Batch {
  id: string;
  batch_id: string;
  farmer_id: string;
  product_type: string;
  product_name: string;
  quantity_kg: number;
  harvest_date: string;
  storage_requirement: StorageRequirement;
  freshness_score: number;
  status: BatchStatus;
  traceability: string[];
  origin_farm: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_id: string;
  buyer_id: string;
  farmer_id: string;
  batch_id: string;
  quantity_kg: number;
  price_per_kg: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  route_id: string;
  order_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  hub_id: string | null;
  origin: string;
  destination: string;
  status: RouteStatus;
  eta_minutes: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface FarmEvent {
  id: string;
  event_id: string;
  event_type: string;
  source_module: ModuleName;
  severity: Severity;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  related_batch_id: string | null;
  related_order_id: string | null;
  related_route_id: string | null;
  related_vehicle_id: string | null;
  related_driver_id: string | null;
  related_hub_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  notification_id: string;
  target_module: string;
  target_farmer_id: string | null;
  title: string;
  message: string;
  severity: Severity;
  read: boolean;
  created_at: string;
}

export interface NewBatch {
  farmer_id: string;
  product_type: string;
  product_name: string;
  quantity_kg: number;
  harvest_date: string;
  storage_requirement: StorageRequirement;
}
