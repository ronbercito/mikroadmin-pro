import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-2xl w-full ${maxWidth} overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 bg-[#F8F9FA] border-b border-slate-200">
          <h2 className="text-base font-semibold text-[#333333]">{title}</h2>
          <button onClick={onClose} className="text-[#6C757D] hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}