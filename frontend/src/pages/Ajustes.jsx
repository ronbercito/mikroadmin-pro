import {
  Settings, Users, Mail, FileText, Receipt, CreditCard, Code, User, Bell,
  LifeBuoy, Headset, ShieldAlert, Upload, Repeat, UsersRound, FileCode, MapPin,
  UserPen, MessagesSquare, Cloud, Globe, Database, Clock, ScrollText, Wrench,
  Server, RefreshCw, Key, Info,
} from 'lucide-react';

const MODULES = [
  { label: 'General', icon: Settings }, { label: 'Gestión personal', icon: Users }, { label: 'Servidor de correo', icon: Mail },
  { label: 'Facturación', icon: FileText }, { label: 'Facturación Electrónica', icon: Receipt }, { label: 'Pasarelas de pago', icon: CreditCard },
  { label: 'Editor plantillas', icon: Code }, { label: 'Portal cliente', icon: User }, { label: 'Notificaciones Push', icon: Bell },
  { label: 'Tickets', icon: LifeBuoy }, { label: 'Zendesk Support', icon: Headset }, { label: 'Monitor Blacklist', icon: ShieldAlert },
  { label: 'Importar clientes', icon: Upload }, { label: 'Cambios Masivos', icon: Repeat }, { label: 'Plantillas Configuración', icon: UsersRound },
  { label: 'Mensajes Facturas', icon: FileCode }, { label: 'Ubicaciones', icon: MapPin }, { label: 'Campos personalizados', icon: UserPen },
  { label: 'Mensajería', icon: MessagesSquare }, { label: 'Cloud', icon: Cloud }, { label: 'Google', icon: Globe }, { label: 'Base de datos', icon: Database },
  { label: 'Crontab', icon: Clock }, { label: 'Logs', icon: ScrollText }, { label: 'Sistema', icon: Wrench }, { label: 'Servidor', icon: Server },
  { label: 'Migrar', icon: RefreshCw }, { label: 'Freeradius', icon: Key }, { label: 'Licencia', icon: Info },
];

export default function Ajustes() {
  return (
    <div className="p-8" style={{ background: '#e9ecef', minHeight: '100%' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center"><Settings className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-xl font-semibold text-slate-800">Ajustes</h1><p className="text-sm text-slate-500">Configuración general del sistema</p></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.label} className="flex flex-col items-center gap-2 group">
              <span className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm transition-all group-hover:border-sky-300 group-hover:shadow-md">
                <Icon className="w-6 h-6 text-slate-700 group-hover:text-sky-600" />
              </span>
              <span className="text-xs text-center text-slate-600 leading-tight max-w-[90px]">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}