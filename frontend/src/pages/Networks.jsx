import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  RefreshCw,
  Maximize2,
  Minimize2,
  Pencil,
  Info,
  Network,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  List,
  Grid
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/admin/api";

const CIDR_OPTIONS = [
  { cidr: 24, label: "24 (255.255.255.0 - 254 hosts, 256 IP)" },
  { cidr: 25, label: "25 (255.255.255.128 - 126 hosts, 128 IP)" },
  { cidr: 26, label: "26 (255.255.255.192 - 62 hosts, 64 IP)" },
  { cidr: 27, label: "27 (255.255.255.224 - 30 hosts, 32 IP)" },
  { cidr: 28, label: "28 (255.255.255.240 - 14 hosts, 16 IP)" },
  { cidr: 29, label: "29 (255.255.255.248 - 6 hosts, 8 IP)" },
  { cidr: 30, label: "30 (255.255.255.252 - 2 hosts, 4 IP)" },
];

// Extractor universal de arrays para cualquier formato JSON de respuesta
const extractArray = (resData) => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (typeof resData === "object") {
    for (const key of ["routers", "networks", "data", "rows", "items", "result", "results"]) {
      if (Array.isArray(resData[key])) return resData[key];
    }
    if (resData.data && typeof resData.data === "object") {
      for (const key of ["routers", "networks", "rows", "items"]) {
        if (Array.isArray(resData.data[key])) return resData.data[key];
      }
    }
  }
  return [];
};

export default function Networks() {
  const [networks, setNetworks] = useState([]);
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNet, setEditingNet] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    router_id: "",
    network: "",
    cidr: 24,
    type: "ESTÁTICO",
  });

  const getHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token") || "";
    return {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    };
  };

  const fetchRouters = async () => {
    try {
      const res = await fetch(`${API_BASE}/routers`, { headers: getHeaders() });
      if (!res.ok) return [];
      const raw = await res.json();
      const list = extractArray(raw);
      setRouters(list);
      return list;
    } catch (e) {
      console.error("Error al obtener routers:", e);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [currentRouters, netsRes] = await Promise.all([
        fetchRouters(),
        fetch(`${API_BASE}/networks`, { headers: getHeaders() })
      ]);

      const netsRaw = netsRes.ok ? await netsRes.json() : [];
      setNetworks(extractArray(netsRaw));
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredNetworks = useMemo(() => {
    return networks.filter(
      (n) =>
        n.name?.toLowerCase().includes(search.toLowerCase()) ||
        n.network?.includes(search) ||
        n.type?.toLowerCase().includes(search.toLowerCase())
    );
  }, [networks, search]);

  const totalPages = Math.ceil(filteredNetworks.length / pageSize) || 1;
  const paginatedNetworks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNetworks.slice(start, start + pageSize);
  }, [filteredNetworks, currentPage, pageSize]);

  const openModal = async (net = null) => {
    // Al abrir modal refrescamos lista de routers actualizados
    const currentRouters = await fetchRouters();

    if (net) {
      setEditingNet(net);
      const netRouterId = String(net.router_id ?? net.routerId ?? (currentRouters[0]?.id ?? currentRouters[0]?._id ?? ""));
      setFormData({
        name: net.name || "",
        router_id: netRouterId,
        network: net.network || "",
        cidr: net.cidr || 24,
        type: net.type || "ESTÁTICO",
      });
    } else {
      setEditingNet(null);
      const defaultRouterId = currentRouters.length > 0 
        ? String(currentRouters[0].id ?? currentRouters[0]._id ?? "") 
        : "";

      setFormData({
        name: "",
        router_id: defaultRouterId,
        network: "",
        cidr: 24,
        type: "ESTÁTICO",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNet(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedRouterId = parseInt(formData.router_id, 10);

      if (!parsedRouterId || isNaN(parsedRouterId)) {
        alert("Seleccione un router válido.");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        router_id: parsedRouterId,
        routerId: parsedRouterId,
        network: formData.network.trim(),
        cidr: parseInt(formData.cidr, 10),
        type: formData.type
      };

      const url = editingNet
        ? `${API_BASE}/networks/${editingNet.id}`
        : `${API_BASE}/networks`;
      const method = editingNet ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorDetail = await res.json().catch(() => ({}));
        throw new Error(errorDetail.message || errorDetail.error || "Error al procesar en la base de datos");
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error al guardar red:", error);
      alert(error.message || "Error al guardar la red IPv4");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Está seguro de eliminar la red "${name}"?`)) {
      try {
        const res = await fetch(`${API_BASE}/networks/${id}`, {
          method: "DELETE",
          headers: getHeaders()
        });
        if (!res.ok) throw new Error("Error al eliminar");
        fetchData();
      } catch (error) {
        alert("Error al eliminar la red");
      }
    }
  };

  const getHostsCount = (cidr) => {
    const total = Math.pow(2, 32 - parseInt(cidr || 24, 10));
    return total > 2 ? total - 2 : total;
  };

  return (
    <div className="w-full font-sans text-gray-700 bg-gray-100 min-h-screen p-4">
      <div className="bg-white rounded-t shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header Superior */}
        <div className="bg-[#0267a5] text-white px-4 py-2.5 flex items-center justify-between">
          <span className="font-medium text-sm">Redes IPv4</span>
          <div className="flex items-center space-x-2 text-white/80">
            <button className="hover:text-white" title="Maximizar"><Maximize2 size={15} /></button>
            <button onClick={fetchData} className="hover:text-white" title="Recargar"><RefreshCw size={15} /></button>
            <button className="hover:text-white" title="Minimizar"><Minimize2 size={15} /></button>
          </div>
        </div>

        {/* Toolbar Superior */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-700 focus:outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded border border-gray-300 bg-white">
              <List size={14} />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded border border-gray-300 bg-white">
              <Grid size={14} />
            </button>
            <button
              onClick={() => openModal()}
              className="bg-[#0267a5] hover:bg-[#02568a] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus size={14} /> Nuevo
            </button>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full border border-gray-300 rounded px-3 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Tabla principal */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase font-semibold">
                <th className="p-2.5 w-12 border-r border-gray-200">ID</th>
                <th className="p-2.5 border-r border-gray-200">NOMBRE</th>
                <th className="p-2.5 border-r border-gray-200">RED</th>
                <th className="p-2.5 border-r border-gray-200 w-64">USO IPS</th>
                <th className="p-2.5 border-r border-gray-200 w-16">CIDR</th>
                <th className="p-2.5 border-r border-gray-200">ROUTER</th>
                <th className="p-2.5 border-r border-gray-200 w-24">TIPO</th>
                <th className="p-2.5 text-center w-28">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">Cargando datos...</td>
                </tr>
              ) : paginatedNetworks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">No hay redes IPv4 registradas.</td>
                </tr>
              ) : (
                paginatedNetworks.map((net, index) => {
                  const totalHosts = getHostsCount(net.cidr);
                  const usedHosts = net.used_ips || net.usedIps || 0;
                  const percentage = ((usedHosts / totalHosts) * 100).toFixed(1);
                  const router = routers.find((r) => String(r.id ?? r._id) === String(net.router_id ?? net.routerId));

                  return (
                    <tr key={net.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-2.5 border-r border-gray-200 text-gray-500">{net.id || index + 1}</td>
                      <td className="p-2.5 border-r border-gray-200 font-medium text-gray-800">{net.name}</td>
                      <td className="p-2.5 border-r border-gray-200 font-mono text-gray-700">{net.network}</td>
                      <td className="p-2.5 border-r border-gray-200">
                        <div className="relative w-full bg-gray-300 rounded-full h-4 overflow-hidden border border-gray-300">
                          <div
                            className="bg-gray-500 h-full transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium drop-shadow">
                            {percentage}% ({usedHosts} de {totalHosts})
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5 border-r border-gray-200">{net.cidr}</td>
                      <td className="p-2.5 border-r border-gray-200">
                        {router ? (router.name || router.nombre || router.alias || router.identity || router.ip) : (net.router_name || net.routerName || "Sin router")}
                      </td>
                      <td className="p-2.5 border-r border-gray-200">
                        <span className="bg-[#007a87] text-white text-[10px] px-2 py-0.5 rounded font-semibold uppercase">
                          {net.type || "ESTÁTICO"}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5 text-gray-600">
                          <button onClick={() => openModal(net)} className="hover:text-blue-600" title="Editar"><Pencil size={14} /></button>
                          <button className="hover:text-blue-600" title="Información"><Info size={14} /></button>
                          <button className="hover:text-blue-600" title="Árbol de Clientes"><Network size={14} /></button>
                          <button onClick={() => handleDelete(net.id, net.name)} className="hover:text-red-600" title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con Paginación */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Mostrando de {filteredNetworks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} al{" "}
            {Math.min(currentPage * pageSize, filteredNetworks.length)} de un total de {filteredNetworks.length}
          </div>
          <div className="flex items-center space-x-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1 border border-gray-300 bg-white rounded disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="bg-[#0267a5] text-white px-2.5 py-1 rounded font-medium">{currentPage}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 border border-gray-300 bg-white rounded disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nueva / Editar Red */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                {editingNet ? "Editar Red IPv4" : "Nueva Red IPv4"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-right text-gray-600 font-medium">Nombre</label>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="nombre de red"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-right text-gray-600 font-medium">Router</label>
                  <div className="col-span-2">
                    <select
                      required
                      value={formData.router_id}
                      onChange={(e) => setFormData({ ...formData, router_id: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {routers.map((r) => {
                        const rId = String(r.id ?? r._id ?? r.router_id ?? "");
                        const rName = r.name || r.nombre || r.alias || r.identity || r.ip || `Router ID ${rId}`;
                        return (
                          <option key={rId} value={rId}>
                            {rName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-start gap-2">
                  <label className="text-right text-gray-600 font-medium pt-1.5">Red</label>
                  <div className="col-span-2">
                    <div className="flex rounded border border-gray-300 overflow-hidden focus-within:border-blue-500">
                      <span className="bg-gray-100 p-1.5 text-gray-500 flex items-center justify-center border-r border-gray-300">
                        <Network size={14} />
                      </span>
                      <input
                        type="text"
                        placeholder="Ejm: 192.168.1.0"
                        required
                        value={formData.network}
                        onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                        className="w-full px-2 py-1.5 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Ejm: 192.168.1.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-right text-gray-600 font-medium">CIDR</label>
                  <div className="col-span-2">
                    <select
                      value={formData.cidr}
                      onChange={(e) => setFormData({ ...formData, cidr: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
                    >
                      {CIDR_OPTIONS.map((opt) => (
                        <option key={opt.cidr} value={opt.cidr}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-right text-gray-600 font-medium">Tipo de Uso</label>
                  <div className="col-span-2">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="ESTÁTICO">ESTÁTICO</option>
                      <option value="DHCP">DHCP</option>
                      <option value="PPPOE">PPPoE</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-1.5 rounded hover:bg-gray-100 font-medium"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="bg-[#52a3ff] hover:bg-[#3d92f5] text-white px-5 py-1.5 rounded font-medium shadow-sm transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
