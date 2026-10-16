
import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { startSimulation, stopSimulation } from './simulation';
import type {
  Farmer, Buyer, Driver, Vehicle, Hub, Sensor, Batch, Order, Route, FarmEvent, Notification,
} from '../types';

const FARMER_ID = 'F-1001';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Farmer, Buyer, Driver, Vehicle, Hub, Sensor, Batch, Order, Route, FarmEvent, Notification } from '../types';
652181a (Remove all remaining Supabase references and clean up build)

interface EventContextValue {
  farmer: Farmer | null; farmers: Farmer[]; buyers: Buyer[]; drivers: Driver[]; vehicles: Vehicle[]; hubs: Hub[];
  sensors: Sensor[]; batches: Batch[]; orders: Order[]; routes: Route[]; events: FarmEvent[]; notifications: Notification[];
  unreadCount: number; loading: boolean; connected: boolean; reloadAll: () => Promise<void>; markAllRead: () => Promise<void>; markRead: (id: string) => Promise<void>;
}
const EventContext = createContext<EventContextValue | null>(null);
export function useEventContext(): EventContextValue { const value = useContext(EventContext); if (!value) throw new Error('useEventContext must be used within EventProvider'); return value; }
export function EventProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  const reloadAll = useCallback(async () => {}, []);
  const markAllRead = useCallback(async () => setNotifications((items) => items.map((item) => ({ ...item, read: true }))), []);
  const markRead = useCallback(async (id: string) => setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item)), []);
  const value: EventContextValue = { farmer: null, farmers: [], buyers: [], drivers: [], vehicles: [], hubs: [], sensors: [], batches: [], orders: [], routes: [], events: [], notifications, unreadCount: notifications.filter((item) => !item.read).length, loading, connected: false, reloadAll, markAllRead, markRead };
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
