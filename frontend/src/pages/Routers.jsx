import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Plus, RefreshCw, Router as RouterIcon, Trash2, Pencil, CheckCircle2, XCircle, Loader2, X } from 'lucide-react';

const empty = { name: '', router_type: 'MikroTik', host: '', api_port: 8728, use_tls: false, username: '', password: '', location: '' };

export default function Routers() {
  const navigate = useNavigate();
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(empty);
  const [syncing, setSyncing] = useState(null);

  const load = () => api.routers.list().then(setRouters).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api.routers.create(form);
    setShow(false); setForm(empty); load();
  }

  function handleTlsChange(e) {
    const isTls = e.target.value === 'true';
    setForm({
      ...form,
      use_tls: isTls,
      api_port: isTls ? 8729 : 8728
    });
  }

  async function sync(r) {
    setSyncing(r.id);
    try { 
      await api.routers.sync(r.id); 
    } catch (e) { 
      alert('Error al sincronizar: ' + e.message); 
    }
    load(); 
    setSyncing(null);
  }

  async function remove(r) {
    if (!confirm(`¿Eliminar router ${r.name}?`)) return;
    await api.routers.delete(r.id); 
    load();
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Routers</h1>
          <p className="text-sm text-slate-500">Equipos MikroTik registrados</p>
        </div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600">
          <Plus className="w-4 h-4" />Agregar router
        </button>
      </div>

      {routers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RouterIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No hay routers registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routers.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                    <RouterIcon className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.host}:{r.api_port}</p>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-xs text-slate-500 space-y-1 mb-4">
                <p>Tipo: {r.router_type}</p>
                <p>Usuario: {r.username}</p>
                {r.last_sync && <p>Últ. sync: {r.last_sync.slice(0,16).replace('T',' ')}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/routers/${r.id}/edit`)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">
                  <Pencil className="w-3.5 h-3.5" />Modificar
                </button>
                <button onClick={() => sync(r)} disabled={syncing === r.id} className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60">
                  {syncing === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(r)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <Modal title="Nuevo router" onClose={() => setShow(false)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Nombre"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="form-input" /></Field>
            <Field label="IP / Host"><input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required className="form-input" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Puerto"><input type="number" value={form.api_port} onChange={(e) => setForm({ ...form, api_port: Number(e.target.value) })} className="form-input" /></Field>
              <Field label="TLS">
                <select value={String(form.use_tls)} onChange={handleTlsChange} className="form-input">
                  <option value="false">No (API - 8728)</option>
                  <option value="true">Sí (API-SSL - 8729)</option>
                </select>
              </Field>
            </div>
            <Field label="Usuario API"><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="form-input" /></Field>
            <Field label="Contraseña API"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="form-input" /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShow(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { online: 'bg-emerald-100 text-emerald-700', offline: 'bg-rose-100 text-rose-700', unknown: 'bg-slate-100 text-slate-500' };
  const Icon = status === 'online' ? CheckCircle2 : status === 'offline' ? XCircle : RouterIcon;
  return <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${map[status]}`}><Icon className="w-3 h-3" />{status || 'unknown'}</span>;
}

function Field({ label, children }) {
  return <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>{children}</div>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
