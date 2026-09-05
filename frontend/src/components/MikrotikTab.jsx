import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, RefreshCw } from 'lucide-react';

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || bytes === '') return '—';
  const num = Number(bytes);
  if (isNaN(num) || num === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  const val = num / Math.pow(k, i);
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${sizes[i]}`;
}

export default function MikrotikTab({ routerId }) {
  const [sysInfo, setSysInfo] = useState(null);
  const [interfaces, setInterfaces] = useState([]);
  const [selectedIface, setSelectedIface] = useState('');
  const [trafficData, setTrafficData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  const trafficPollRef = useRef(null);
  const infoPollRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, [routerId]);

  // Intervalo para información general (cada 10 segundos para no saturar)
  useEffect(() => {
    infoPollRef.current = setInterval(fetchSystemInfo, 10000);
    return () => {
      if (infoPollRef.current) clearInterval(infoPollRef.current);
    };
  }, [routerId]);

  // Intervalo para tráfico (cada 2 segundos)
  useEffect(() => {
    if (!selectedIface) return;
    setTrafficData([]);
    
    pollTraffic();
    trafficPollRef.current = setInterval(pollTraffic, 2000);

    return () => {
      if (trafficPollRef.current) clearInterval(trafficPollRef.current);
    };
  }, [selectedIface]);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.routers.info(routerId);
      setSysInfo(res.system_info || {});
      setInterfaces(res.interfaces || []);
      if (res.interfaces?.length > 0) {
        setSelectedIface(res.interfaces[0].name);
      }
    } catch (e) {
      setError(e.message || 'Error al conectar con el router');
    }
    setLoading(false);
  }

  async function fetchSystemInfo() {
    try {
      const res = await api.routers.info(routerId);
      if (res?.system_info) {
        setSysInfo(res.system_info);
      }
    } catch (e) {
      console.error('Error al actualizar sysInfo:', e);
    }
  }

  const pollTraffic = useCallback(async () => {
    if (!selectedIface) return;
    setPolling(true);
    try {
      const res = await api.routers.traffic(routerId, selectedIface);
      
      if (res) {
        const timeLabel = new Date().toLocaleTimeString('es-PE', { hour12: false });

        // Detección flexible de nombres de atributos recibidos del backend
        const rawTx = res.tx_bps ?? res['tx-bits-per-second'] ?? res.tx ?? 0;
        const rawRx = res.rx_bps ?? res['rx-bits-per-second'] ?? res.rx ?? 0;

        const tx = Math.round(((Number(rawTx) || 0) / 1000000) * 100) / 100;
        const rx = Math.round(((Number(rawRx) || 0) / 1000000) * 100) / 100;

        setTrafficData((prev) => [...prev, { time: timeLabel, tx, rx }].slice(-20));
      }
    } catch (e) {
      console.error('Error al obtener tráfico:', e);
    }
    setPolling(false);
  }, [routerId, selectedIface]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-rose-500 mb-3">{error}</p>
        <button onClick={loadInitialData} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-sky-500 hover:bg-sky-600">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    );
  }

  const cpuLoad = sysInfo?.['cpu-load'] || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-100 min-h-screen font-sans">
      {/* Panel Izquierdo: Información del Router */}
      <div className="lg:col-span-4 bg-white border border-slate-300 rounded shadow-sm overflow-hidden text-xs">
        <div className="divide-y divide-slate-100">
          <InfoRow label="uptime" value={sysInfo?.uptime} isZebra={true} />
          <InfoRow label="version" value={sysInfo?.version} />
          <InfoRow label="build-time" value={sysInfo?.['build-time']} isZebra={true} />
          <InfoRow label="factory-software" value={sysInfo?.['factory-software']} />
          <InfoRow label="free-memory" value={formatBytes(sysInfo?.['free-memory'])} isZebra={true} />
          <InfoRow label="total-memory" value={formatBytes(sysInfo?.['total-memory'])} />
          <InfoRow label="cpu" value={sysInfo?.cpu} isZebra={true} />
          <InfoRow label="cpu-count" value={sysInfo?.['cpu-count']} />
          <InfoRow label="cpu-frequency" value={sysInfo?.['cpu-frequency']} isZebra={true} />
          
          <div className="flex items-center py-1.5 px-3 bg-white">
            <div className="w-36 text-right pr-2 text-slate-600 font-normal">cpu-load</div>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-slate-400">:</span>
              <span className="text-slate-800 font-medium w-8">{cpuLoad}%</span>
              <div className="w-32 h-3.5 bg-slate-300 rounded-sm overflow-hidden inline-block">
                <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${cpuLoad}%` }} />
              </div>
            </div>
          </div>

          <InfoRow label="free-hdd-space" value={formatBytes(sysInfo?.['free-hdd-space'])} isZebra={true} />
          <InfoRow label="total-hdd-space" value={formatBytes(sysInfo?.['total-hdd-space'])} />
          <InfoRow label="write-sect-since-reboot" value={sysInfo?.['write-sect-since-reboot']} isZebra={true} />
          <InfoRow label="write-sect-total" value={sysInfo?.['write-sect-total']} />
          <InfoRow label="bad-blocks" value={sysInfo?.['bad-blocks']} isZebra={true} />
          <InfoRow label="architecture-name" value={sysInfo?.['architecture-name']} />
          <InfoRow label="board-name" value={sysInfo?.['board-name']} isZebra={true} />
          <InfoRow label="platform" value={sysInfo?.platform} />
        </div>
      </div>

      {/* Panel Derecho: Tráfico Actual */}
      <div className="lg:col-span-8 bg-white border border-slate-300 rounded shadow-sm p-4">
        <div className="flex items-center justify-end gap-3 mb-4">
          <span className="text-xs text-slate-700 font-medium">Seleccionar Interface</span>
          <select
            value={selectedIface}
            onChange={(e) => setSelectedIface(e.target.value)}
            className="h-8 px-3 text-xs rounded border border-slate-300 text-slate-800 bg-white focus:outline-none focus:border-sky-500"
          >
            {interfaces.map((iface) => (
              <option key={iface.name} value={iface.name}>{iface.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full">
          {trafficData.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center">
              <p className="text-xs text-slate-400">Recopilando datos de tráfico…</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trafficData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${v.toFixed(2)} Mbps`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '4px', fontSize: '11px', color: '#fff' }}
                  formatter={(value, name) => [`${Number(value).toFixed(2)} Mbps`, name]}
                />
                <Line type="monotone" dataKey="tx" stroke="#0284c7" strokeWidth={1.5} dot={false} name="TX" isAnimationActive={false} />
                <Line type="monotone" dataKey="rx" stroke="#dc2626" strokeWidth={1.5} dot={false} name="RX" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, isZebra }) {
  return (
    <div className={`flex items-center py-1.5 px-3 ${isZebra ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="w-36 text-right pr-2 text-slate-600 font-normal">{label}</div>
      <div className="flex-1 flex items-center gap-1 text-slate-800 font-medium">
        <span className="text-slate-400 mr-1">:</span>
        <span>{value || '—'}</span>
      </div>
    </div>
  );
}
