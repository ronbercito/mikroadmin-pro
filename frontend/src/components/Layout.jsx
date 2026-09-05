import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Monitor, ChevronDown, Router as RouterIcon, Globe, Network,
  Activity, Box, Gauge, Star, Wifi, Phone, SlidersHorizontal, Users, User, Map,
  Megaphone, Bell, Wrench, FileText, Mail, HandCoins, CreditCard, Layers,
  ArrowLeftRight, Wallet, FileBarChart, Receipt, BarChart3, Boxes, Tags, Truck,
  Package, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const NAV = [
  { type: 'item', to: '/', end: true, icon: LayoutDashboard, label: 'Panel' },
  { type: 'group', label: 'Gestión de Red', icon: Monitor, items: [
    { to: '/routers', label: 'Routers', icon: RouterIcon },
    { to: '/gestion/smartolt', label: 'SMARTOLT', icon: Globe },
    { to: '/gestion/redes-ipv4', label: 'Redes IPv4', icon: Network },
    { to: '/gestion/monitoreo', label: 'Monitoreo', icon: Activity },
    { to: '/gestion/cajas-nap', label: 'Cajas Nap', icon: Box },
    { to: '/gestion/trafico', label: 'Tráfico', icon: Gauge },
  ]},
  { type: 'group', label: 'Servicios', icon: Star, items: [
    { to: '/servicios/internet', label: 'Internet', icon: Wifi },
    { to: '/servicios/voz', label: 'Voz', icon: Phone },
    { to: '/servicios/personalizado', label: 'Personalizado', icon: SlidersHorizontal },
  ]},
  { type: 'group', label: 'Clientes', icon: Users, items: [
    { to: '/clients', label: 'Usuarios', icon: User },
    { to: '/clientes/mapa', label: 'Mapa clientes', icon: Map },
    { to: '/clientes/anuncios', label: 'Anuncios', icon: Megaphone },
    { to: '/clientes/notificaciones-push', label: 'Notificaciones push', icon: Bell },
    { to: '/clientes/instalaciones', label: 'Instalaciones', icon: Wrench },
    { to: '/clientes/contratos', label: 'Contratos', icon: FileText },
    { to: '/clientes/correos', label: 'Correos', icon: Mail },
  ]},
  { type: 'group', label: 'Finanzas', icon: HandCoins, items: [
    { to: '/finanzas/facturas', label: 'Facturas', icon: FileText },
    { to: '/finanzas/registrar-pago', label: 'Registrar pago', icon: CreditCard },
    { to: '/finanzas/pagos-masivos', label: 'Registrar pagos Masivos', icon: Layers },
    { to: '/finanzas/transacciones', label: 'Transacciones', icon: ArrowLeftRight },
    { to: '/finanzas/otros-ingresos', label: 'Otros Ingresos & Egresos', icon: Wallet },
    { to: '/finanzas/reportes-pago', label: 'Reportes de pago', sub: '(Portal cliente)', icon: FileBarChart },
    { to: '/finanzas/facturacion-electronica', label: 'Facturación Electrónica', icon: Receipt },
    { to: '/finanzas/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  ]},
  { type: 'group', label: 'Almacén', icon: Boxes, items: [
    { to: '/almacen/tipos-productos', label: 'Tipos de Productos', icon: Tags },
    { to: '/almacen/proveedores', label: 'Proveedores', icon: Truck },
    { to: '/almacen/productos', label: 'Productos', icon: Package },
  ]},
  { type: 'item', to: '/ajustes', icon: Settings, label: 'Ajustes' },
];

const isActive = (to, p) => p === to || p.startsWith(to + '/');
const cn = (...a) => a.filter(Boolean).join(' ');

export default function Layout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(() => {
    const o = {};
    NAV.forEach((s) => { if (s.type === 'group') o[s.label] = s.items.some((i) => isActive(i.to, location.pathname)); });
    return o;
  });
  const toggle = (l) => setOpen((s) => ({ ...s, [l]: !s[l] }));

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 shrink-0 bg-[#2C3338] flex flex-col text-[#D3D3D3]">
        <div className="px-5 py-5 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center"><Wifi className="w-5 h-5 text-white" /></div>
          <div><h1 className="font-semibold text-white leading-tight">ISP Panel</h1><p className="text-xs text-white/40">MikroTik Manager</p></div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((s) => s.type === 'item' ? (
            <NavLink key={s.label} to={s.to} end={s.end}
              className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', isActive ? 'bg-white/10 text-white' : 'text-[#D3D3D3] hover:bg-white/5 hover:text-white')}>
              <s.icon className="w-[18px] h-[18px]" />{s.label}
            </NavLink>
          ) : (
            <div key={s.label}>
              <button onClick={() => toggle(s.label)}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', s.items.some((i) => isActive(i.to, location.pathname)) ? 'text-white' : 'text-[#D3D3D3] hover:bg-white/5 hover:text-white')}>
                <s.icon className="w-[18px] h-[18px]" /><span className="flex-1 text-left">{s.label}</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', open[s.label] && 'rotate-180')} />
              </button>
              {open[s.label] && (
                <div className="mt-1 ml-[22px] pl-4 border-l border-white/10 space-y-0.5">
                  {s.items.map((i) => (
                    <NavLink key={i.to} to={i.to}
                      className={({ isActive }) => cn('flex items-center gap-2.5 pl-2 pr-3 py-2 rounded-lg text-sm transition-colors', isActive ? 'text-white' : 'text-[#AEB4B9] hover:text-white hover:bg-white/5')}>
                      <span className="w-1.5 h-1.5 rounded-full border border-current opacity-60" />
                      <i.icon className="w-4 h-4 shrink-0" />
                      <span className="leading-tight">{i.label}{i.sub && <span className="block text-xs text-white/40">{i.sub}</span>}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#AEB4B9] hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
            <LogOut className="w-[18px] h-[18px]" />Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}