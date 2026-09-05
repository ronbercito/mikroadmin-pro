import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ArrowLeft, Power, Loader2, Plus } from 'lucide-react';

const CONN = { static: 'IP Estática', dhcp: 'DHCP', pppoe: 'PPPoE' };
const ST = { active: 'Activo', suspended: 'Suspendido', cancelled: 'Cancelado', pending: 'Pendiente' };
const SS = { active: 'bg-emerald-100 text-emerald-700', suspended: 'bg-rose-100 text-rose-700', cancelled: 'bg-slate-200 text-slate-600', pending: 'bg-amber-100 text-amber-700' };

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('logs');

  const load = () => api.clients.get(id).then(setC).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  async function toggle() {
    const action = c.status === 'active' ? 'suspend' : 'activate';
    await api.clients.status(c.id, action); load();
  }
  async function addPayment() {
    const period = prompt('Periodo (YYYY-MM):');
    if (!period) return;
    const amount = prompt('Monto:');
    if (!amount) return;
    await api.billing.create({ client_id: c.id, client_name: c.full_name, period, amount: Number(amount), due_date: new Date().toISOString(), status: 'paid', paid_date: new Date().toISOString() });
    load();
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!c) return <div className="p-8 text-slate-500">Cliente no encontrado.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4"><ArrowLeft className="w-4 h-4" />Volver a clientes</Link>
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{c.full_name}</h1>
            <p className="text-sm text-slate-500">{c.phone || c.email || '—'} · {c.document_id || 'Sin documento'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full ${SS[c.status]}`}>{ST[c.status]}</span>
            <button onClick={toggle} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${c.status === 'active' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}><Power className="w-4 h-4" />{c.status === 'active' ? 'Suspender' : 'Activar'}</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <Info label="Router" value={c.router_name || '—'} />
          <Info label="Conexión" value={CONN[c.connection_type] || c.connection_type} />
          <Info label="IP / MAC" value={c.ip_address || c.mac_address || c.pppoe_user || '—'} />
          <Info label="Plan" value={c.plan_name || '—'} />
          <Info label="Monto mensual" value={c.monthly_fee ? `S/${c.monthly_fee}` : '—'} />
          <Info label="Próximo vencimiento" value={c.next_due_date?.slice(0,10) || '—'} />
          <Info label="Último pago" value={c.last_payment_date?.slice(0,10) || '—'} />
          <Info label="Corte automático" value={c.auto_cutoff ? 'Sí' : 'No'} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab('logs')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'logs' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Historial</button>
        <button onClick={() => setTab('billing')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'billing' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Facturación</button>
        {tab === 'billing' && <button onClick={addPayment} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 text-white text-sm hover:bg-sky-600"><Plus className="w-4 h-4" />Registrar pago</button>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        {tab === 'logs' ? (
          <ul className="divide-y divide-slate-100">
            {c.change_logs?.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">Sin movimientos.</p>}
            {c.change_logs?.map((l) => (
              <li key={l.id} className="px-4 py-3">
                <p className="text-sm text-slate-700">{l.description}</p>
                <p className="text-xs text-slate-400">{l.performed_by} · {l.created_at?.slice(0,16).replace('T',' ')}</p>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-slate-100">
            {c.billing_records?.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">Sin facturas.</p>}
            {c.billing_records?.map((b) => (
              <li key={b.id} className="px-4 py-3 flex items-center justify-between">
                <div><p className="text-sm text-slate-700">{b.period} · S/{b.amount}</p><p className="text-xs text-slate-400">Vence {b.due_date?.slice(0,10)} {b.paid_date ? `· Pagado ${b.paid_date.slice(0,10)}` : ''}</p></div>
                <span className={`text-xs px-2 py-1 rounded-full ${b.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="text-sm font-medium text-slate-700">{value}</p></div>;
}