import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { startSimulation, stopSimulation } from './simulation';
import type {
  Farmer, Buyer, Driver, Vehicle, Hub, Sensor, Batch, Order, Route, FarmEvent, Notification,
} from '../types';

const FARMER_ID = 'F-1001';

interface EventContextValue {
  farmer: Farmer | null;
  farmers: Farmer[];
  buyers: Buyer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  hubs: Hub[];
  sensors: Sensor[];
  batches: Batch[];
  orders: Order[];
  routes: Route[];
  events: FarmEvent[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  connected: boolean;
  reloadAll: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

const EventContext = createContext<EventContextValue | null>(null);

export function useEventContext(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEventContext must be used within EventProvider');
  return ctx;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const stateRef = useRef({ batches, orders, routes, vehicles, drivers });
  stateRef.current = { batches, orders, routes, vehicles, drivers };

  const reloadAll = useCallback(async () => {
    const [
      farmersRes, buyersRes, driversRes, vehiclesRes, hubsRes,
      sensorsRes, batchesRes, ordersRes, routesRes, eventsRes, notifRes,
    ] = await Promise.all([
      supabase.from('farmers').select('*').order('created_at'),
      supabase.from('buyers').select('*').order('rating', { ascending: false }),
      supabase.from('drivers').select('*').order('created_at'),
      supabase.from('vehicles').select('*').order('created_at'),
      supabase.from('hubs').select('*').order('created_at'),
      supabase.from('sensors').select('*').order('created_at'),
      supabase.from('batches').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('routes').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    setFarmers((farmersRes.data ?? []) as Farmer[]);
    setFarmer(((farmersRes.data ?? []) as Farmer[]).find((f) => f.farmer_id === FARMER_ID) ?? null);
    setBuyers((buyersRes.data ?? []) as Buyer[]);
    setDrivers((driversRes.data ?? []) as Driver[]);
    setVehicles((vehiclesRes.data ?? []) as Vehicle[]);
    setHubs((hubsRes.data ?? []) as Hub[]);
    setSensors((sensorsRes.data ?? []) as Sensor[]);
    setBatches((batchesRes.data ?? []) as Batch[]);
    setOrders((ordersRes.data ?? []) as Order[]);
    setRoutes((routesRes.data ?? []) as Route[]);
    setEvents((eventsRes.data ?? []) as FarmEvent[]);
    setNotifications((notifRes.data ?? []) as Notification[]);
    setLoading(false);
  }, []);

  // Initial load + realtime subscriptions
  useEffect(() => {
    reloadAll();

    const channel = supabase
      .channel('farmxpress-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
        setEvents((prev) => [payload.new as FarmEvent, ...prev].slice(0, 100));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 50));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => {
        supabase.from('batches').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setBatches(data as Batch[]);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setOrders(data as Order[]);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, () => {
        supabase.from('routes').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setRoutes(data as Route[]);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        supabase.from('vehicles').select('*').order('created_at').then(({ data }) => {
          if (data) setVehicles(data as Vehicle[]);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
        supabase.from('drivers').select('*').order('created_at').then(({ data }) => {
          if (data) setDrivers(data as Driver[]);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sensors' }, () => {
        supabase.from('sensors').select('*').order('created_at').then(({ data }) => {
          if (data) setSensors(data as Sensor[]);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
          if (data) setNotifications(data as Notification[]);
        });
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    // Start cross-module simulation engine
    startSimulation(() => stateRef.current);

    return () => {
      supabase.removeChannel(channel);
      stopSimulation();
    };
  }, [reloadAll]);

  const markAllRead = useCallback(async () => {
    await supabase.from('notifications').update({ read: true }).eq('target_farmer_id', FARMER_ID).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <EventContext.Provider
      value={{
        farmer, farmers, buyers, drivers, vehicles, hubs, sensors,
        batches, orders, routes, events, notifications, unreadCount,
        loading, connected, reloadAll, markAllRead, markRead,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}
