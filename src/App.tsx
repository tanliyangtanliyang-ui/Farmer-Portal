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
import Market from './pages/Market';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import EventStream from './pages/EventStream';
import type { FarmEvent } from './types';

export type PageId =
  | 'dashboard'
  | 'products'
  | 'freshness'
  | 'pickup'
  | 'market'
  | 'analytics'
  | 'profile'
  | 'events';

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  products: 'My Products',
  freshness: 'Freshness Monitor',
  pickup: 'Pickup Schedule',
  market: 'Market Connection',
  analytics: 'Farm Analytics',
  profile: 'Profile',
  events: 'Event Stream',
};

function Portal() {
  const { events, connected } = useEventContext();
  const [page, setPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
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
          {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {page === 'products' && <Products />}
          {page === 'freshness' && <Freshness />}
          {page === 'pickup' && <Pickup />}
          {page === 'market' && <Market />}
          {page === 'analytics' && <Analytics />}
          {page === 'profile' && <Profile />}
          {page === 'events' && <EventStream />}
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
