import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import NetworkForm from "@/components/NetworkForm";
import NetworkInfoDialog from "@/components/NetworkInfoDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  RefreshCw,
  Maximize2,
  Minimize2,
  Pencil,
  Info,
  Network as NetworkTreeIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Router as RouterIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ipToInt, clientsInNetwork, hostsFor } from "@/lib/networks";

export default function Networks() {
  const [networks, setNetworks] = useState([]);
  const [routers, setRouters] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [minimized, setMinimized] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [infoNet, setInfoNet] = useState(null);
  const [treeNet, setTreeNet] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [nets, rts, cls] = await Promise.all([
        base44.entities.Network.list("-created_date", 500),
        base44.entities.Router.list(),
        base44.entities.Client.list("-updated_date", 500),
      ]);
      setNetworks(nets);
      setRouters(rts);
      setClients(cls);
    } catch {
      toast.error("Error al cargar las redes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const routerName = (id) => routers.find((r) => r.id === id)?.name || "—";

  const sortBy = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortBtn = (key, label) => (
    <button
      onClick={() => sortBy(key)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {sortKey === key ? (
        sortDir === "asc" ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );

  const filtered = networks.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.name?.toLowerCase().includes(q) || n.network?.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "id")
      return dir * (new Date(a.created_date) - new Date(b.created_date));
    if (sortKey === "network")
      return dir * (ipToInt(a.network) - ipToInt(b.network));
    if (sortKey === "cidr") return dir * ((a.cidr || 0) - (b.cidr || 0));
    return dir * String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
  });

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const effectivePage = Math.min(page, pages);
  const startIdx = (effectivePage - 1) * pageSize;
  const rows = sorted.slice(startIdx, startIdx + pageSize).map((n, i) => ({
    ...n,
    _seq: startIdx + i + 1,
  }));

  const pageWindow = [];
  const winStart = Math.max(1, Math.min(effectivePage - 2, pages - 4));
  for (let i = winStart; i <= Math.min(pages, winStart + 4); i++) pageWindow.push(i);

  const from = filtered.length === 0 ? 0 : startIdx + 1;
  const to = Math.min(startIdx + pageSize, filtered.length);

  const remove = async (n) => {
    if (!confirm(`¿Eliminar la red "${n.name}"?`)) return;
    try {
      await base44.entities.Network.delete(n.id);
      toast.success("Red eliminada");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  return (
    <Layout>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-info text-white px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold flex items-center gap-2">
            <RouterIcon className="w-4 h-4" />
            Redes IPv4
          </h1>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 h-8 w-8"
              onClick={load}
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 h-8 w-8"
              onClick={() => setMinimized((m) => !m)}
              title={minimized ? "Expandir" : "Minimizar"}
            >
              {minimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Barra de acciones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="bg-info hover:bg-info/90"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> Nuevo
                </Button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 bg-background"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Tabla */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-info rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <NetworkTreeIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">
                  {search ? "Sin resultados" : "No hay redes registradas"}
                </p>
                {!search && (
                  <Button
                    className="mt-4 bg-info hover:bg-info/90"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" /> Nueva Red IPv4
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">
                        {sortBtn("id", "ID")}
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        {sortBtn("name", "Nombre")}
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        {sortBtn("network", "Red")}
                      </th>
                      <th className="text-left font-medium px-4 py-3">Uso IPs</th>
                      <th className="text-left font-medium px-4 py-3">
                        {sortBtn("cidr", "CIDR")}
                      </th>
                      <th className="text-left font-medium px-4 py-3">Router</th>
                      <th className="text-left font-medium px-4 py-3">Tipo</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((n) => {
                      const used = clientsInNetwork(n, clients).length;
                      const total = hostsFor(n.cidr || 24);
                      const pct = total > 0 ? (used / total) * 100 : 0;
                      return (
                        <tr
                          key={n.id}
                          className="border-t border-border/50 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {n._seq}
                          </td>
                          <td className="px-4 py-3 font-medium">{n.name}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {n.network}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-info rounded-full"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {pct.toFixed(1)}% ({used} de {total})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {n.cidr}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {routerName(n.router_id)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                n.type === "DHCP"
                                  ? "bg-info/10 text-info"
                                  : "bg-success/10 text-success"
                              }`}
                            >
                              {n.type || "ESTÁTICO"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Editar"
                                onClick={() => {
                                  setEditing(n);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Detalles"
                                onClick={() => setInfoNet(n)}
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Clientes en la red"
                                onClick={() => setTreeNet(n)}
                              >
                                <NetworkTreeIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Eliminar"
                                onClick={() => remove(n)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer paginación */}
            {!loading && filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-t text-xs text-muted-foreground">
                <p>
                  Mostrando de {from} al {to} de un total de {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={effectivePage <= 1}
                    onClick={() => setPage(effectivePage - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  {pageWindow.map((p) => (
                    <Button
                      key={p}
                      variant={p === effectivePage ? "default" : "outline"}
                      size="icon"
                      className={
                        p === effectivePage
                          ? "h-7 w-7 bg-info hover:bg-info/90"
                          : "h-7 w-7"
                      }
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={effectivePage >= pages}
                    onClick={() => setPage(effectivePage + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <NetworkForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        network={editing}
        routers={routers}
      />

      <NetworkInfoDialog
        open={!!infoNet}
        onClose={() => setInfoNet(null)}
        network={infoNet}
        mode="details"
        routerName={infoNet ? routerName(infoNet.router_id) : ""}
        usedClients={infoNet ? clientsInNetwork(infoNet, clients).length : 0}
      />

      <NetworkInfoDialog
        open={!!treeNet}
        onClose={() => setTreeNet(null)}
        network={treeNet}
        mode="clients"
        clients={treeNet ? clientsInNetwork(treeNet, clients) : []}
      />
    </Layout>
  );
}
