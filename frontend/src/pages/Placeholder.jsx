import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function Placeholder() {
  const { pathname } = useLocation();
  const title = decodeURIComponent(pathname.split('/').filter(Boolean).pop() || 'Sección').replace(/-/g, ' ');
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2 capitalize">{title}</h1>
      <p className="text-sm text-slate-500 mb-8">Sección del panel</p>
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
        <Construction className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-slate-700">Próximamente</h2>
        <p className="text-sm text-slate-400 mt-1">Esta sección estará disponible en próximas versiones.</p>
      </div>
    </div>
  );
}