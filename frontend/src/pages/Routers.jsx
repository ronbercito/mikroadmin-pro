import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, RefreshCw, Router as RouterIcon, Trash2, Pencil, Users, Wrench, X, Eye, EyeOff } from "lucide-react";

const emptyForm = { name: "", host: "", api_port: 8728, use_tls: false, username: "", password: "", location: "", notes: "" };

const speedLabels = {
  simple_queues: "Colas Simples",
  pcq_addresslist: "PCQ + Addresslist",
  simple_queues_dynamic: "Colas Simples Dinámicas",
  dhcp_lease_dynamic: "DHCP Lease Dinámicas",
  none: "Ninguno",
};

export default function Routers() {
  const navigate = useNavigate();
  const [routers, setRouters] = useState([]);
  const [clientCounts, setClientCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [data, clients] = await Promise.all([
        base44.entities.Router.list(),
        base44.entities.Client.list(),
      ]);
      const counts = {};
      (clients || []).forEach((c) => {
        if (c.router_id) counts[c.router_id] = (counts[c.router_id] || 0) + 1;
      });
      setClientCounts(counts);
      setRouters(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function openNew() { setForm(emptyForm); setEditingId(null); setShowForm(true); }
  function openEdit(r) {
    setForm({ name: r.name, host: r.host, api_port: r.api_port || 8728, use_tls: r.use_tls === true, username: r.username, password: r.password || "", location: r.location || "", notes: r.notes || "" });
    setEditingId(r.id); setShowForm(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let created;
      if (editingId) {
        await base44.entities.Router.update(editingId, form);
        setShowForm(false);
        load();
        sync(editingId);
      } else {
        created = await base44.entities.Router.create(form);
        setShowForm(false);
        await load();
        if (created?.id) sync(created.id);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function remove(id) {
    if (!confirm("¿Eliminar este router? Los clientes asignados quedarán sin router.")) return;
    await base44.entities.Router.delete(id);
    load();
  }

  async function sync(id) {
    setSyncing(id);
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), 30000));
      await Promise.race([
        base44.functions.invoke("syncRouter", { router_id: id }),
        timeout,
      ]);
      await load();
    } catch (e) { console.error(e); }
    setSyncing(null);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Routers MikroTik</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona tus equipos y verifica la conexión</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> Agregar router
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[0,1,2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-lg" />)}
        </div>
      ) : routers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RouterIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Aún no hay routers registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f9f9f9] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">IP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Versión</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Clientes</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routers.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => navigate(`/routers/${r.id}/edit`)} className="text-sm font-medium text-[#007BFF] hover:underline">
                      {r.name}
                    </button>
                    <p className="text-xs text-[#f39c12] mt-0.5">API + {speedLabels[r.speed_control] || "Colas simples"}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{r.host}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{r.model || "—"}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{r.ros_version || "—"}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                      {clientCounts[r.id] || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge status={r.status} syncing={syncing === r.id} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => sync(r.id)} disabled={syncing === r.id} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors" title="Sincronizar">
                        <RefreshCw className={`w-4 h-4 ${syncing === r.id ? "animate-spin" : ""}`} />
                      </button>
                      <button onClick={() => navigate(`/routers/${r.id}/edit`)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => navigate(`/routers/${r.id}/edit`)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors" title="Herramientas">
                        <Wrench className="w-4 h-4" />
                      </button>
                      <button onClick={() => navigate("/clients")} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors" title="Clientes">
                        <Users className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(r.id)} className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 bg-[#F8F9FA] border-b border-slate-200">
              <h2 className="text-base font-semibold text-[#333333]">{editingId ? "Editar Router" : "Nuevo Router"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#6C757D] hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={save} className="px-5 py-5 space-y-4">
              <RowInput label="Nombre" placeholder="Nombre del router" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <RowInput label="IP Mikrotik" placeholder="Ip o url de conexión" value={form.host} onChange={(v) => setForm({ ...form, host: v })} required />
              <div className="flex items-center gap-3">
                <label className="w-32 shrink-0 text-right text-sm font-medium text-[#495057]">Puerto API</label>
                <input
                  type="number"
                  value={form.api_port || 8728}
                  onChange={(e) => setForm({ ...form, api_port: Number(e.target.value) })}
                  placeholder="8728"
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-sm text-[#495057] placeholder:text-[#AAB0B6] focus:border-[#007BFF] focus:outline-none focus:ring-1 focus:ring-[#007BFF] transition-colors"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-32 shrink-0 text-right text-sm font-medium text-[#495057]">Usar TLS</label>
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.use_tls || false} onChange={(e) => setForm({ ...form, use_tls: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-[#007BFF] focus:ring-[#007BFF]" />
                    <span className="text-sm text-[#6C757D]">Conexión cifrada (puerto 8729)</span>
                  </label>
                </div>
              </div>
              <RowInput label="Usuario Mikrotik" placeholder="usuario de conexión" value={form.username} onChange={(v) => setForm({ ...form, username: v })} required />
              <div className="flex items-center gap-3">
                <label className="w-32 shrink-0 text-right text-sm font-medium text-[#495057]">Contraseña Mikrotik</label>
                <div className="flex-1 relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password || ""}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="contraseña de conexión"
                    required
                    className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-300 text-sm text-[#495057] placeholder:text-[#AAB0B6] focus:border-[#007BFF] focus:outline-none focus:ring-1 focus:ring-[#007BFF] transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6C757D] hover:text-slate-900">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 -mx-5 -mb-5 px-5 py-3.5 bg-[#F8F9FA] border-t border-slate-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#495057] bg-white border border-slate-300 hover:bg-slate-50 transition-colors">Cerrar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#007BFF] hover:bg-[#0069D9] disabled:opacity-50 transition-colors">{saving ? "Registrando…" : "Registrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, syncing }) {
  if (syncing) {
    return <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">VERIFICANDO…</span>;
  }
  const map = {
    online: "bg-[#00a8a8] text-white",
    offline: "bg-rose-500 text-white",
    unknown: "bg-slate-200 text-slate-500",
  };
  const labels = { online: "CONECTADO", offline: "DESCONECTADO", unknown: "SIN CONECTAR" };
  return <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${map[status] || map.unknown}`}>{labels[status] || labels.unknown}</span>;
}

function RowInput({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-32 shrink-0 text-right text-sm font-medium text-[#495057]">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-sm text-[#495057] placeholder:text-[#AAB0B6] focus:border-[#007BFF] focus:outline-none focus:ring-1 focus:ring-[#007BFF] transition-colors"
      />
    </div>
  );
}
