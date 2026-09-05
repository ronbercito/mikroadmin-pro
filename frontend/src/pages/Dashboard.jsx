import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Users, Router as RouterIcon, AlertTriangle, Scissors, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([api.clients.list(), api.routers.list()])
      .then(([c, r]) => { setClients(c); setRouters(r); })
      .finally(() => setLoading(false));
  }, []);

  const overdue = clients.filter((c) => c.status === 'active' && c.next_due_date && new Date(c.next_due_date) < new Date());
  const active = clients.filter((c) => c.status === 'active');
  const suspended = clients.filter((c) => c.status === 'suspended');

  async function runCutoff() {
    setRunning(true); setResult(null);
    try { setResult(await api.cutoff.run()); } catch (e) { setResult({ error: e.message }); }
    finally { setRunning(false); }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">Panel</h1>
      <p className="text-sm text-slate-500 mb-6">Resumen general del sistema</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={Users} label="Clientes activos" value={active.length} color="emerald" />
        <Stat icon={AlertTriangle} label="Por vencer" value={overdue.length} color="amber" />
        <Stat icon={Scissors} label="Suspendidos" value={suspended.length} color="rose" />
        <Stat icon={RouterIcon} label="Routers" value={routers.length} color="sky" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-800">Corte automático por impago</h2>
          <button onClick={runCutoff} disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-60">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            {running ? 'Ejecutando...' : 'Ejecutar ahora'}
          </button>
        </div>
        {result && (
          <p className="text-sm text-slate-600">
            {result.error ? `Error: ${result.error}` : `Revisados: ${result.checked} · Elegibles: ${result.eligible} · Suspendidos: ${result.suspended.length}`}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-medium text-slate-800 mb-4">Clientes con pago vencido</h2>
        {overdue.length === 0 ? <p className="text-sm text-slate-400">No hay clientes vencidos.</p> : (
          <ul className="divide-y divide-slate-100">
            {overdue.map((c) => (
              <li key={c.id} className="py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-slate-700">{c.full_name}</p><p className="text-xs text-slate-400">{c.router_name || 'Sin router'} · vence {c.next_due_date?.slice(0,10)}</p></div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">Vencido</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  const map = { emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600', sky: 'bg-sky-50 text-sky-600' };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${map[color]}`}><Icon className="w-5 h-5" /></div>
      <p className="text-2xl font-semibold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
