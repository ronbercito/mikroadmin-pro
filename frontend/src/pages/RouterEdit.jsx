import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  Settings, Ban, Router as RouterIcon, BarChart3, ScrollText, Maximize2, X,
  Save, Eye, EyeOff, MapPin, Lock, ChevronRight, Loader2,
} from 'lucide-react';

const TABS = [
  { id: 'datos', label: 'Datos & Configuración', icon: Settings },
  { id: 'bloqueo', label: 'Bloqueo de Páginas', icon: Ban },
  { id: 'mikrotik', label: 'Mikrotik', icon: RouterIcon },
  { id: 'graficos', label: 'Gráficos', icon: BarChart3 },
  { id: 'log', label: 'Log', icon: ScrollText },
];
const cn = (...a) => a.filter(Boolean).join(' ');

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
      api_port: r.api_port || 443, use_tls: r.use_tls !== false, username: r.username || '',
      password: r.password || '', location: r.location || '', security: r.security || 'none',
      security_alt: r.security_alt || 'none', radius_secret: r.radius_secret || '',
      radius_nas_ip: r.radius_nas_ip || '', traffic_logging: r.traffic_logging || 'traffic_flow',
      speed_control: r.speed_control || 'simple_queues', save_visited_ips: r.save_visited_ips !== false,
      notes: r.notes || '',
    })).finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try { await api.routers.update(id, form); navigate('/routers'); }
    catch (err) { alert('Error: ' + err.message); }
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
                  <FF label="Seguridad"><select value={form.security} onChange={(e) => set('security', e.target.value)} className="form-input"><option value="none">Ninguno</option><option value="accounting_api">Accounting API</option></select></FF>
                  <FF label="Seguridad alterna"><select value={form.security_alt} onChange={(e) => set('security_alt', e.target.value)} className="form-input"><option value="none">Ninguno</option><option value="accounting_api">Accounting API</option></select></FF>
                  <div className="pt-2">
                    <p className="text-sm font-medium text-slate-700 mb-3">Configuración Radius</p>
                    <div className="space-y-4">
                      <FF label="Radius Secret"><div className="relative"><input type="password" value={form.radius_secret} onChange={(e) => set('radius_secret', e.target.value)} className="form-input pr-9" /><Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /></div></FF>
                      <FF label="Radius NAS IP"><input value={form.radius_nas_ip} onChange={(e) => set('radius_nas_ip', e.target.value)} className="form-input" /></FF>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">MIKROTIK</h3>
                <div className="space-y-4">
                  <FF label="Usuario (API)"><input value={form.username} onChange={(e) => set('username', e.target.value)} required className="form-input" /></FF>
                  <FF label="Contraseña (API)"><div className="relative"><input type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} required className="form-input pr-9" /><button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></FF>
                  <FF label="Registro de tráfico"><select value={form.traffic_logging} onChange={(e) => set('traffic_logging', e.target.value)} className="form-input"><option value="none">Ninguno</option><option value="traffic_flow">Traffic Flow (RouterOS V6x, V7.x)</option></select></FF>
                  <FF label="Control Velocidad"><select value={form.speed_control} onChange={(e) => set('speed_control', e.target.value)} className="form-input"><option value="simple_queues">Colas Simples (Estáticas)</option><option value="queue_tree">Queue Tree</option><option value="pcq">PCQ</option></select></FF>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-slate-700">Guardar IP Visitadas</span>
                    <button type="button" onClick={() => set('save_visited_ips', !form.save_visited_ips)} className={cn('relative w-11 h-6 rounded-full transition-colors', form.save_visited_ips ? 'bg-[#00a896]' : 'bg-slate-300')}>
                      <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', form.save_visited_ips && 'translate-x-5')} />
                    </button>
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ background: '#2196f3' }}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
        {tab !== 'datos' && (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
              {(() => { const I = TABS.find((t) => t.id === tab).icon; return <I className="w-6 h-6 text-slate-400" />; })()}
            </div>
            <h3 className="text-base font-medium text-slate-700">{TABS.find((t) => t.id === tab).label}</h3>
            <p className="text-sm text-slate-400 mt-1">Esta sección estará disponible próximamente.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FF({ label, children }) {
  return <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>{children}</div>;
}