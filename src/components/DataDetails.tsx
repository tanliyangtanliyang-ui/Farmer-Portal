import { useEffect, useState, type ReactNode } from 'react';

// "Dataset & API details": a compact, collapsed-by-default row holding the technical dataset/API panels.
// The panels stay mounted while collapsed (their data still feeds the page). API availability is checked here and
// shown in the summary line, so a connection problem is never hidden inside the collapsed section.
const API = import.meta.env.VITE_FARMXPRESS_API_BASE_URL ?? 'http://127.0.0.1:4000/v1';

type Health = { state: 'checking' } | { state: 'ok'; schema: string } | { state: 'down'; message: string };

export function DataDetails({ children, storageKey, className = '', summaryClassName = '', mutedClassName = 'opacity-70' }: {
  children: ReactNode; storageKey: string; className?: string; summaryClassName?: string; mutedClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState<Health>({ state: 'checking' });
  useEffect(() => { try { setOpen(localStorage.getItem(storageKey) === '1'); } catch { /* per-viewer convenience only */ } }, [storageKey]);
  useEffect(() => {
    let alive = true;
    const check = () => fetch(`${API}/health`)
      .then(async (r) => { const b = await r.json().catch(() => null); if (!r.ok || b?.status !== 'ok') throw new Error(b?.error?.message ?? `API ${r.status}`); return b; })
      .then((b) => { if (alive) setHealth({ state: 'ok', schema: b.schema_version ?? 'snapshot' }); })
      .catch((e: Error) => { if (alive) setHealth({ state: 'down', message: e.message === 'Failed to fetch' ? `Cannot reach the FarmXpress API at ${API}` : e.message }); });
    check();
    const t = setInterval(check, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  const toggle = (next: boolean) => { setOpen(next); try { localStorage.setItem(storageKey, next ? '1' : '0'); } catch { /* ignore */ } };
  return (
    <details className={`mb-4 rounded-xl border text-sm ${className}`} open={open} onToggle={(e) => toggle((e.currentTarget as HTMLDetailsElement).open)} data-testid="data-details">
      <summary className={`flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 select-none ${summaryClassName}`} aria-label={`${open ? 'Hide' : 'Show'} dataset and API details`}>
        <span aria-hidden className="inline-block w-3 transition-transform" style={{ transform: open ? 'rotate(90deg)' : undefined }}>▸</span>
        <span className="font-semibold">Dataset &amp; API details</span>
        {health.state === 'checking' && <span className={mutedClassName}>Checking API…</span>}
        {health.state === 'ok' && <span className={mutedClassName}>API connected · historical dataset (read-only, Jan–Jun 2026) · live records stored separately</span>}
        {health.state === 'down' && <span role="alert" className="font-semibold text-red-500">API unavailable: {health.message}. Live data on this page may be missing.</span>}
        <span className={`ml-auto text-xs ${mutedClassName}`}>{open ? 'Hide' : 'Show'} IDs, sources and record details</span>
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  );
}
