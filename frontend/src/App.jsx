import React, { useState } from 'react';

export default function RedesIPv4() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redes, setRedes] = useState([
    { id: 1, nombre: 'RED 15', red: '192.168.15.0', uso: '0.8%', detalleUso: '2 de 254', cidr: '24', router: 'CCR2004', tipo: 'ESTÁTICO' },
    { id: 2, nombre: 'RED 60', red: '192.168.60.0', uso: '0.4%', detalleUso: '1 de 254', cidr: '24', router: 'CCR2004', tipo: 'ESTÁTICO' },
    { id: 3, nombre: 'RED 5', red: '192.168.5.0', uso: '0.4%', detalleUso: '1 de 254', cidr: '24', router: 'CCR2004', tipo: 'ESTÁTICO' },
    { id: 4, nombre: 'RED 100 FO', red: '100.10.10.0', uso: '0.8%', detalleUso: '2 de 254', cidr: '24', router: 'CCR2004', tipo: 'ESTÁTICO' },
    { id: 5, nombre: 'RED 100.20 FO', red: '100.10.20.0', uso: '0.8%', detalleUso: '2 de 254', cidr: '24', router: 'CCR2004', tipo: 'ESTÁTICO' },
  ]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Cabecera de la sección */}
      <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg flex justify-between items-center shadow">
        <h1 className="text-lg font-bold">Redes IPv4</h1>
        <div className="flex gap-2 text-white">
          <button className="hover:bg-blue-600 p-1 rounded"><span className="material-icons">fullscreen</span></button>
          <button className="hover:bg-blue-600 p-1 rounded"><span className="material-icons">refresh</span></button>
          <button className="hover:bg-blue-600 p-1 rounded"><span className="material-icons">remove</span></button>
        </div>
      </div>

      {/* Barra de herramientas superior */}
      <div className="bg-white p-3 border-x border-gray-200 flex flex-wrap justify-between items-center gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <select className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
            <option>15</option>
            <option>30</option>
            <option>50</option>
          </select>
          <button className="border border-gray-300 p-1.5 rounded bg-white hover:bg-gray-50 text-gray-600"><span className="material-icons text-sm">view_list</span></button>
          <button className="border border-gray-300 p-1.5 rounded bg-white hover:bg-gray-50 text-gray-600"><span className="material-icons text-sm">grid_view</span></button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-1 shadow"
          >
            + Nuevo
          </button>
        </div>
        <div>
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700 uppercase text-xs border-b border-gray-200">
              <th className="p-3 border-r border-gray-200 cursor-pointer">ID ↕</th>
              <th className="p-3 border-r border-gray-200 cursor-pointer">NOMBRE ↕</th>
              <th className="p-3 border-r border-gray-200 cursor-pointer">RED ↕</th>
              <th className="p-3 border-r border-gray-200 cursor-pointer">USO IPS ↕</th>
              <th className="p-3 border-r border-gray-200 cursor-pointer">CIDR ↕</th>
              <th className="p-3 border-r border-gray-200 cursor-pointer">ROUTER ↕</th>
              <th className="p-3 border-r border-gray-200 cursor-pointer">TIPO ↕</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {redes.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-3 border-r border-gray-100">{item.id}</td>
                <td className="p-3 border-r border-gray-100 font-medium">{item.nombre}</td>
                <td className="p-3 border-r border-gray-100">{item.red}</td>
                <td className="p-3 border-r border-gray-100">
                  <div className="bg-gray-300 rounded overflow-hidden relative text-xs text-center text-white font-semibold">
                    <div className="bg-blue-400 absolute top-0 left-0 bottom-0" style={{ width: item.uso }}></div>
                    <span className="relative z-10 drop-shadow-sm text-gray-700">{item.uso} ({item.detalleUso})</span>
                  </div>
                </td>
                <td className="p-3 border-r border-gray-100">{item.cidr}</td>
                <td className="p-3 border-r border-gray-100">{item.router}</td>
                <td className="p-3 border-r border-gray-100">
                  <span className="bg-teal-600 text-white text-xs px-2.5 py-1 rounded font-semibold">{item.tipo}</span>
                </td>
                <td className="p-3 text-center flex justify-center gap-1.5">
                  <button className="p-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-600" title="Editar"><span className="material-icons text-sm">edit</span></button>
                  <button className="p-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-600" title="Info"><span className="material-icons text-sm">info</span></button>
                  <button className="p-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-600" title="Subredes"><span className="material-icons text-sm">account_tree</span></button>
                  <button className="p-1 border border-gray-300 rounded hover:bg-gray-100 text-red-600" title="Eliminar"><span className="material-icons text-sm">delete</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="bg-white p-3 border-x border-b border-gray-200 rounded-b-lg flex justify-between items-center text-sm text-gray-600 shadow-sm">
        <div>Mostrando de 1 al 5 de un total de 5</div>
        <div className="flex gap-1">
          <button className="border border-gray-300 px-3 py-1 rounded bg-white hover:bg-gray-100 disabled:opacity-50">←</button>
          <button className="border border-blue-500 bg-blue-500 text-white px-3 py-1 rounded">1</button>
          <button className="border border-gray-300 px-3 py-1 rounded bg-white hover:bg-gray-100 disabled:opacity-50">→</button>
        </div>
      </div>

      {/* Modal Nueva Red IPv4 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden">
            <div className="flex justify-between items-center bg-white px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Nueva Red IPv4</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" placeholder="nombre de red" className="col-span-2 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-700">Router</label>
                <select className="col-span-2 border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Seleccionar...</option>
                  <option>CCR2004</option>
                </select>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-700">Red</label>
                <div className="col-span-2 flex items-center border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="bg-gray-200 px-3 py-2 text-gray-600 border-r border-gray-300">🌐</span>
                  <input type="text" placeholder="Ejm: 192.168.1.0" className="w-full px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3"><div className="col-start-2 col-span-2 text-xs text-gray-500">Ejm: 192.168.1.0</div></div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-700">CIDR</label>
                <select className="col-span-2 border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>24 (255.255.255.0 - 254 hosts, 256 IP)</option>
                  <option>30 (255.255.255.252 - 2 hosts, 4 IP)</option>
                  <option>29 (255.255.255.248 - 6 hosts, 8 IP)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-right text-sm font-medium text-gray-700">Tipo de Uso</label>
                <select className="col-span-2 border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Seleccionar...</option>
                  <option>Estático</option>
                  <option>DHCP Pool</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 px-4 py-1.5 rounded text-sm font-medium"
              >
                Cerrar
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-1.5 rounded text-sm font-medium shadow"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
