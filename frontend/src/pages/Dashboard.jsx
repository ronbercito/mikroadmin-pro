import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import {
  Server,
  Users,
  Activity,
  Pause,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const [routers, setRouters] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, c] = await Promise.all([
          base44.entities.Router.list(),
          base44.entities.Client.list(),
        ]);
        setRouters(r);
        setClients(c);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = clients.filter((c) => c.status === "active").length;
  const suspended = clients.filter((c) => c.status === "suspended").length;

  const stats = [
    {
      label: "Routers",
      value: routers.length,
      icon: Server,
      to: "/routers",
      tint: "text-brand",
    },
    {
      label: "Clientes totales",
      value: clients.length,
      icon: Users,
      to: "/clients",
      tint: "text-blue-500",
    },
    {
      label: "Activos",
      value: active,
      icon: CheckCircle2,
      to: "/clients",
      tint: "text-emerald-500",
    },
    {
      label: "Suspendidos",
      value: suspended,
      icon: Pause,
      to: "/clients",
      tint: "text-amber-500",
    },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
          Panel de administración
        </h1>
        <p className="text-muted-foreground mt-1">
          Resumen general de tu red MikroTik
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link to={s.to} key={s.label}>
            <Card className="hover:shadow-md transition-shadow border-border/60">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-display font-bold mt-1">
                      {loading ? "—" : s.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${s.tint}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Routers conectados</CardTitle>
            <Link
              to="/routers"
              className="text-sm text-brand hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {routers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No hay routers registrados. Agrega tu primer equipo MikroTik.
              </p>
            ) : (
              <div className="space-y-2">
                {routers.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                        <Server className="w-4 h-4 text-brand" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.host}:{r.port || 443}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/monitor"
                      className="text-xs text-brand hover:underline"
                    >
                      Monitorear
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Clientes recientes</CardTitle>
            <Link
              to="/clients"
              className="text-sm text-brand hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No hay clientes. Sincroniza un router o agrega uno manualmente.
              </p>
            ) : (
              <div className="space-y-2">
                {clients.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {c.ip_address}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        c.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : c.status === "suspended"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
