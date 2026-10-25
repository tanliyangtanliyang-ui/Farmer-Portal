import { Store, Sprout, Truck, Warehouse, ShoppingCart } from 'lucide-react';

// Market Connection. The earlier simulated "sell to buyer" flow (placeholder buyers, random prices, invented route
// assignment) was removed: it called functions that no longer exist and bypassed the real workflow. Selling now goes
// through the shared FarmXpress API, as described below, so every step is saved and visible to the hub and buyers.
const STEPS = [
  { icon: Sprout, title: 'Register produce', text: 'Products page: record the produce, quantity and harvest date.' },
  { icon: Truck, title: 'Request delivery to a hub', text: 'Products page: choose the consolidation hub, pickup date and transport.' },
  { icon: Warehouse, title: 'Hub review and receipt', text: 'The hub approves the request, assigns a vehicle and confirms receipt.' },
  { icon: ShoppingCart, title: 'Listed for buyers', text: 'Received produce is listed in the Buyer marketplace at the dataset reference price. Buyer orders are reviewed by the hub.' },
];

export default function Market() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Market Connection</h2>
        <p className="text-sm text-slate-400">How your produce reaches buyers</p>
      </div>
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2"><Store className="h-5 w-5 text-brand-500" /><h3 className="font-bold text-slate-800">Selling through FarmXpress</h3></div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="rounded-xl border border-slate-100 p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100"><Icon className="h-5 w-5 text-brand-600" /></div>
                <p className="text-sm font-bold text-slate-800">{i + 1}. {s.title}</p>
                <p className="mt-1 text-xs text-slate-500">{s.text}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-xs text-slate-400">Your delivery requests, hub decisions and collection records are shown on the Products page. Buyer orders for your listed produce are reviewed and fulfilled by the hub. Direct farmer-to-buyer ordering is not available in this prototype.</p>
      </div>
    </div>
  );
}
