import { useEffect, useState, useRef } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useFarmerNotifications } from '../lib/insights';
import { timeAgo } from '../lib/ui';

export default function NotificationCenter() {
  const { notes: notifications, unread: unreadCount, markAllRead, markRead, isRead } = useFarmerNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-fade-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] card rounded-2xl flex flex-col z-50 animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">Notifications</h3>
              <span className="chip bg-slate-100 text-slate-500">your records</span>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Mark all read">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10 px-4">No updates yet. Hub decisions on your pickups and buyer orders for your produce appear here.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left flex gap-3 p-3.5 border-b border-slate-50 hover:bg-slate-50 transition ${!isRead(n.id) ? 'bg-brand-50/30' : ''}`} data-testid="farmer-note"
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.tone === 'warning' ? 'bg-amber-500' : n.tone === 'success' ? 'bg-brand-500' : 'bg-sky2-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm truncate">{n.title}</p>
                      {!isRead(n.id) && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.detail}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
