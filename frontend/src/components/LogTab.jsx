import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { RefreshCw, Loader2, ScrollText } from 'lucide-react';

const CHANGE_TYPE_LABELS = {
  create: 'Creación',
  update: 'Actualización',
  suspend: 'Suspensión',
  reactivate: 'Reactivación',
  payment: 'Pago',
  sync: 'Sincronización',
  plan_change: 'Cambio de plan',
  ip_change: 'Cambio de IP',
  delete: 'Eliminación',
};

const CHANGE_TYPE_COLORS = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-sky-100 text-sky-700',
  suspend: 'bg-rose-100 text-rose-700',
  reactivate: 'bg-amber-100 text-amber-700',
  payment: 'bg-violet-100 text-violet-700',
  sync: 'bg-slate-100 text-slate-700',
  plan_change: 'bg-indigo-100 text-indigo-700',
  ip_change: 'bg-cyan-100 text-cyan-700',
  delete: 'bg-rose-100 text-rose-700',
};

export default function LogTab({ routerId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.routers.logs(routerId);
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setRefreshing(false);
  }, [routerId]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-sky-500" /> Registro de actividad del router
        </h3>
        <button onClick={loadLogs} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay registros de actividad para este router.</p>
          <p className="text-xs text-slate-400 mt-1">Las sincronizaciones, suspensiones y reactivaciones aparecerán aquí.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Realizado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString('es-PE') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${CHANGE_TYPE_COLORS[log.change_type] || 'bg-slate-100 text-slate-600'}`}>
                      {CHANGE_TYPE_LABELS[log.change_type] || log.change_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.client_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{log.description || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{log.performed_by || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}