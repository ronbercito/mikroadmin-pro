import React, { useState, useEffect } from 'react';

export default function RedesIPv4() {
  const [redes, setRedes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí puedes realizar la llamada a tu API o backend para listar las redes o pools de IP
    // Ejemplo: fetch('/api/redes-ipv4').then(res => res.json()).then(data => { setRedes(data); setLoading(false); })
    setLoading(false);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Gestión de Redes IPv4</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Nueva Red / Pool
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
        {loading ? (
          <div className="p-6 text-center text-gray-400">Cargando redes IPv4...</div>
        ) : redes.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No hay redes IPv4 configuradas aún.</p>
            <p className="text-sm text-gray-500">Agrega tu primer segmento de red oéctalo con los pools de tu MikroTik.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-gray-300">
            <thead className="bg-gray-900 text-xs uppercase text-gray-400 border-b border-gray-700">
              <tr>
                <th className="p-4">Red / Subnet</th>
                <th className="p-4">Gateway</th>
                <th className="p-4">Pool IP</th>
                <th className="p-4">Router Asignado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {/* Iterar sobre las redes aquí */}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
