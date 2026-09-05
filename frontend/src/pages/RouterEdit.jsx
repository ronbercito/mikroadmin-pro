import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  Settings, Router as RouterIcon, ScrollText,
  Maximize2, X, Save, Eye, EyeOff, MapPin, ChevronRight, Loader2,
} from 'lucide-react';
import MikrotikTab from '../components/MikrotikTab';
import LogTab from '../components/LogTab';

const cn = (...a) => a.filter(Boolean).join(' ');

const TABS = [
  { id: 'datos', label: 'Datos & Configuración', icon: Settings },
  { id: 'mikrotik', label: 'Mikrotik', icon: RouterIcon },
  { id: 'log', label: 'Log', icon: ScrollText },
];

export default function RouterEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('datos');
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    api.routers.get(id).then((r) => setForm({
      name: r.name || '', router_type: r.router_type || 'MikroTik', host: r.host || '',
      api_port: r.api_port || 8728, use_tls: r.use_tls === true, username: r.username || '',
      password: r.password || '', location: r.location || '',
      security: r.security || 'none_accounting_api', security_alt: r.security_alt || 'none',
      radius_secret: r.radius_secret || '', radius_nas_ip: r.radius_nas_ip || '',
      traffic_logging: r.traffic_logging || 'traffic_flow',
      traffic_flow_target: r.traffic_flow_target || '', traffic_flow_interface: r.traffic_flow_interface || 'all',
      speed_control: r.speed_control || 'simple_queues', save_visited_ips: r.save_visited_ips !== false,
      notes: r.notes || '',
    })).finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      await api.routers.update(id, form);
      if (form.security_alt && form.security_alt !== 'none' && form.security !== 'ppp_accounting_api') {
        try { await api.routers.applySecurityAlt(id); } catch (e) { console.error('Error aplicando seguridad alterna:', e); }
      }
      try { await api.routers.applyTrafficFlow(id); } catch (e) { console.error('Error aplicando traffic flow:', e); }
      navigate('/routers');
    } catch (err) { alert('Error al guardar: ' + err.message); }
    setSaving(false);
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!form) return <div className="p-8 text-slate-500">Router no encontrado.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ background: '#dce0e6', minHeight: '100%' }}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 justify-end">
        <Link to="/" className="hover:text-slate-800">Inicio</Link><ChevronRight className="w-3 h-3" />
        <Link to="/routers" className="hover:text-slate-800">Lista Routers</Link><ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 font-medium">Editar router</span>
      </div>
      <div className="rounded-t-xl overflow-hidden" style={{ background: '#212121' }}>
        <div className="flex items-center justify-between px-2">
          <div className="flex">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2', tab === t.id ? 'text-white border-sky-500 bg-white/5' : 'text-white/60 border-transparent hover:text-white/90 hover:bg-white/5')}>
                  <Icon className="w-4 h-4" />{t.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 pr-2">
            <button className="p-1.5 text-white/50 hover:text-white rounded"><Maximize2 className="w-4 h-4" /></button>
            <button onClick={() => navigate('/routers')} className="p-1.5 text-white/50 hover:text-white rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-b-xl border border-slate-200 shadow-sm">
        {tab === 'datos' && (
          <form onSubmit={save}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 p-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Datos & Configuración</h3>
                <div className="space-y-4">
                  <FF label="Nombre Router"><input value={form.name} onChange={(e) => set('name', e.target.value)} required className="form-input" /></FF>
                  <FF label="Tipo Router"><select value={form.router_type} onChange={(e) => set('router_type', e.target.value)} className="form-input"><option>MikroTik</option><option>Ubiquiti</option><option>Cisco</option><option>Otro</option></select></FF>
                  <FF label="Ubicación"><div className="relative"><input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="lat,long" className="form-input pr-9" /><MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /></div></FF>
                  <FF label="IP / Host"><input value={form.host} onChange={(e) => set('host', e.target.value)} required className="form-input" /></FF>
                  <FF label="Seguridad"><select value={form.security} onChange={(e) => set('security', e.target.value)} className="form-input"><option value="none_accounting_api">Ninguno / Accounting API</option><option value="ppp_accounting_api">PPP / Accounting API</option></select></FF>
                  <FF label="Seguridad alterna">
                    <select
                      value={form.security === 'ppp_accounting_api' ? 'none' : form.security_alt}
                      onChange={(e) => set('security_alt', e.target.value)}
                      disabled={form.security === 'ppp_accounting_api'}
                      className="form-input disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="none">Ninguno</option>
                      <option value="ip_mac_binding">Amarre de IP y Mac</option>
                      <option value="dhcp_leases">DHCP Leases</option>
                      <option value="ip_binding">IP Binding</option>
                      <option value="ip_mac_dhcp">Amarre de IP y Mac + DHCP Leases</option>
                    </select>
                    {form.security === 'ppp_accounting_api' && <p className="text-xs text-slate-400 mt-1">Se desactiva con PPP (clientes PPPoE usan la seguridad principal).</p>}
                  </FF>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">MIKROTIK</h3>
                <div className="space-y-4">
                  <FF label="Usuario (API)"><input value={form.username} onChange={(e) => set('username', e.target.value)} required className="form-input" /></FF>
                  <FF label="Contraseña (API)"><div className="relative"><input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} required className="form-input pr-9" /><button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></FF>
                  <FF label="Registro de tráfico"><select value={form.traffic_logging} onChange={(e) => set('traffic_logging', e.target.value)} className="form-input"><option value="none">Ninguno</option><option value="traffic_flow">Traffic Flow (RouterOS V6x, V7.x)</option></select></FF>
                  {form.traffic_logging === 'traffic_flow' && (
                    <>
                      <FF label="IP:Puerto del colector"><input value={form.traffic_flow_target || ''} onChange={(e) => set('traffic_flow_target', e.target.value)} placeholder="ej: 192.168.1.100:2055" className="form-input" /></FF>
                      <FF label="Interfaz a monitorear"><input value={form.traffic_flow_interface || ''} onChange={(e) => set('traffic_flow_interface', e.target.value)} placeholder="all" className="form-input" /></FF>
                    </>
                  )}
                  <FF label="Control Velocidad"><select value={form.speed_control} onChange={(e) => set('speed_control', e.target.value)} className="form-input"><option value="simple_queues">Colas Simples (Estáticas)</option><option value="pcq_addresslist">PCQ + Addresslist</option><option value="simple_queues_dynamic">Colas simples (Dinámicas)</option><option value="dhcp_lease_dynamic">DHCP Lease (Colas simples Dinámicas)</option><option value="none">Ninguno</option></select></FF>
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className={cn('text-sm font-medium', form.speed_control === 'none' ? 'text-slate-400' : 'text-slate-700')}>Guardar IP Visitadas</span>
                      {form.speed_control === 'none' && <p className="text-xs text-slate-400 mt-0.5">Se desactiva con Ninguno.</p>}
                    </div>
                    <button type="button" disabled={form.speed_control === 'none'} onClick={() => set('save_visited_ips', !form.save_visited_ips)} className={cn('relative w-11 h-6 rounded-full transition-colors disabled:cursor-not-allowed', form.speed_control === 'none' ? 'bg-slate-200' : form.save_visited_ips ? 'bg-[#00a896]' : 'bg-slate-300')}>
                      <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', form.save_visited_ips && form.speed_control !== 'none' && 'translate-x-5')} />
                    </button>
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60 transition-opacity" style={{ background: '#2196f3' }}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
        {tab === 'mikrotik' && <MikrotikTab routerId={id} />}
        {tab === 'log' && <LogTab routerId={id} />}
      </div>
    </div>
  );
}

function FF({ label, children }) {
  return <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>{children}</div>;
}