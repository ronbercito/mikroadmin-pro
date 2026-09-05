import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Plus, Search, Loader2, Trash2, Pencil, Power } from 'lucide-react';
import Modal from '../components/Modal';

const empty = {
  full_name: '', document_id: '', phone: '', email: '', address: '',
  router_id: '', connection_type: 'dhcp', ip_address: '', mac_address: '',
  pppoe_user: '', pppoe_password: '', plan_name: '', plan_speed_down: '', plan_speed_up: '',
  monthly_fee: '', currency: 'PEN', billing_day: 1, due_day: 10, status: 'active', auto_cutoff: true,
};

const CONN = { static: 'IP Estática', dhcp: 'DHCP', pppoe: 'PPPoE' };
const ST = { active: 'Activo', suspended: 'Suspendido', cancelled: 'Cancelado', pending: 'Pendiente' };
const SS = { active: 'bg-emerald-100 text-emerald-700', suspended: 'bg-rose-100 text-rose-700', cancelled: 'bg-slate-200 text-slate-600', pending: 'bg-amber-100 text-amber-700' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    Promise.all([api.clients.list(), api.routers.list()])
      .then(([c, r]) => { setClients(c); setRouters(r); }).finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    const matchQ = !q || c.full_name?.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q);
    const matchF = filter === 'all' || c.status === filter;
    return matchQ && matchF;
  });

  async function save(e) {
    e.preventDefault();
    const data = { ...form, router_id: form.router_id ? Number(form.router_id) : null, monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : null };
    await api.clients.create(data);
    setShow(false); setForm(empty);
    setClients(await api.clients.list());
  }
  async function toggleStatus(c) {
    const action = c.status === 'active' ? 'suspend' : 'activate';
    if (!confirm(`${action === 'suspend' ? 'Suspender' : 'Activar'} a ${c.full_name}?`)) return;
    try { await api.clients.status(c.id, action); setClients(await api.clients.list()); }
    catch (e) { alert('Error: ' + e.message); }
  }
  async function remove(c) {
    if (!confirm(`¿Eliminar a ${c.full_name}?`)) return;
    await api.clients.delete(c.id); setClients(await api.clients.list());
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-semibold text-slate-800">Clientes</h1><p className="text-sm text-slate-500">{clients.length} registrados</p></div>
        <button onClick={() => setShow(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600"><Plus className="w-4 h-4" />Nuevo cliente</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o teléfono..." className="form-input pl-10" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input sm:w-48">
          <option value="all">Todos</option><option value="active">Activos</option><option value="suspended">Suspendidos</option><option value="pending">Pendientes</option><option value="cancelled">Cancelados</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr><th className="text-left px-4 py-3">Cliente</th><th className="text-left px-4 py-3">Router</th><th className="text-left px-4 py-3">Conexión</th><th className="text-left px-4 py-3">Plan</th><th className="text-left px-4 py-3">Estado</th><th className="text-right px-4 py-3">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><Link to={`/clients/${c.id}`} className="font-medium text-slate-800 hover:text-sky-600">{c.full_name}</Link><p className="text-xs text-slate-400">{c.phone || c.email || '—'}</p></td>
                <td className="px-4 py-3 text-slate-600">{c.router_name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{CONN[c.connection_type] || c.connection_type}</td>
                <td className="px-4 py-3 text-slate-600">{c.plan_name || '—'}{c.monthly_fee ? ` · S/${c.monthly_fee}` : ''}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${SS[c.status]}`}>{ST[c.status]}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => toggleStatus(c)} title={c.status === 'active' ? 'Suspender' : 'Activar'} className={`p-2 rounded-lg ${c.status === 'active' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}><Power className="w-4 h-4" /></button>
                    <Link to={`/clients/${c.id}`} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"><Pencil className="w-4 h-4" /></Link>
                    <button onClick={() => remove(c)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">Sin resultados.</p>}
      </div>

      {show && (
        <Modal title="Nuevo cliente" onClose={() => setShow(false)}>
          <form onSubmit={save} className="space-y-3 max-h-[70vh] overflow-y-auto">
            <F label="Nombre / Razón social"><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="form-input" /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Teléfono"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" /></F>
              <F label="Correo"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" /></F>
            </div>
            <F label="Router asignado"><select value={form.router_id} onChange={(e) => setForm({ ...form, router_id: e.target.value })} className="form-input"><option value="">— Ninguno —</option>{routers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Tipo de conexión"><select value={form.connection_type} onChange={(e) => setForm({ ...form, connection_type: e.target.value })} className="form-input"><option value="static">IP Estática</option><option value="dhcp">DHCP</option><option value="pppoe">PPPoE</option></select></F>
              <F label="Plan"><input value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} placeholder="Ej: 50Mbps" className="form-input" /></F>
            </div>
            {form.connection_type === 'static' && <F label="IP"><input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} className="form-input" /></F>}
            {form.connection_type === 'dhcp' && <F label="MAC"><input value={form.mac_address} onChange={(e) => setForm({ ...form, mac_address: e.target.value })} className="form-input" /></F>}
            {form.connection_type === 'pppoe' && <div className="grid grid-cols-2 gap-3"><F label="Usuario PPPoE"><input value={form.pppoe_user} onChange={(e) => setForm({ ...form, pppoe_user: e.target.value })} className="form-input" /></F><F label="Clave PPPoE"><input value={form.pppoe_password} onChange={(e) => setForm({ ...form, pppoe_password: e.target.value })} className="form-input" /></F></div>}
            <div className="grid grid-cols-3 gap-3">
              <F label="Monto"><input type="number" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} className="form-input" /></F>
              <F label="Día fact."><input type="number" min="1" max="28" value={form.billing_day} onChange={(e) => setForm({ ...form, billing_day: Number(e.target.value) })} className="form-input" /></F>
              <F label="Día corte"><input type="number" min="1" max="28" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: Number(e.target.value) })} className="form-input" /></F>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.auto_cutoff} onChange={(e) => setForm({ ...form, auto_cutoff: e.target.checked })} />Corte automático por impago</label>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShow(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm">Cancelar</button><button type="submit" className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600">Guardar</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function F({ label, children }) {
  return <div><label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>{children}</div>;
}