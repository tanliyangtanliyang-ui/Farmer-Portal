import { useEffect, useState, useCallback, useRef } from 'react';
import { EventProvider, useEventContext } from './lib/EventContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import NotificationCenter from './components/NotificationCenter';
import ToastContainer, { type ToastItem } from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Freshness from './pages/Freshness';
import Pickup from './pages/Pickup';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import type { FarmEvent } from './types';
import CanonicalShipment, { type SharedShipmentState } from './components/CanonicalShipment';
import RoleRecordPanel from './components/RoleRecordPanel';
import { DataDetails } from './components/DataDetails';
import { useApiStatus } from './lib/insights';

export type PageId =
  | 'dashboard'
  | 'products'
  | 'freshness'
  | 'pickup'
  | 'analytics'
  | 'profile';

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  products: 'My Products',
  freshness: 'Freshness Monitor',
  pickup: 'Pickup Schedule',
  analytics: 'Farm Analytics',
  profile: 'Profile',
};

function Portal() {
  const { events } = useEventContext();
  const connected = useApiStatus();
  const [page, setPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [shipmentState, setShipmentState] = useState<SharedShipmentState>({ loading: true });
  const seenEventIds = useRef<Set<string>>(new Set());

  // Pop a toast whenever a new event arrives
  useEffect(() => {
    for (const ev of events) {
      if (!seenEventIds.current.has(ev.event_id)) {
        seenEventIds.current.add(ev.event_id);
        const toastId = `${ev.event_id}-${Date.now()}`;
        setToasts((prev) => [...prev, { id: toastId, event: ev as FarmEvent }].slice(-4));
      }
    }
  }, [events]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = (p: PageId) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar current={page} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={PAGE_TITLES[page]} onMenu={() => setSidebarOpen(true)} connected={connected}>
          <NotificationCenter />
        </Topbar>
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <DataDetails storageKey="fx.farmer.dataDetails" className="border-slate-200 bg-white" mutedClassName="text-slate-500">
            <CanonicalShipment onScenarioChange={setShipmentState} />
            <RoleRecordPanel />
          </DataDetails>
          {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {page === 'products' && <Products shipmentState={shipmentState} />}
          {page === 'freshness' && <Freshness />}
          {page === 'pickup' && <Pickup />}
          {page === 'analytics' && <Analytics />}
          {page === 'profile' && <Profile />}
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <EventProvider>
      <Portal />
    </EventProvider>
  );
}
