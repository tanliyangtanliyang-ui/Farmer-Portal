import { PackagePlus } from 'lucide-react';

export default function Products() {
  return <div className="space-y-6 animate-fade-in"><div><h2 className="text-xl font-bold text-slate-800">My Products</h2><p className="text-sm text-slate-400">Local product management is ready for a new data source.</p></div><div className="card p-10 text-center"><PackagePlus className="w-8 h-8 text-brand-500 mx-auto mb-3" /><p className="font-semibold text-slate-700">No local products yet</p><p className="text-sm text-slate-400 mt-1">Connect your preferred backend to manage product records.</p></div></div>;
}
