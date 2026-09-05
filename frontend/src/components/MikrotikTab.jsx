import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Activity, Network, RefreshCw } from 'lucide-react';

export default function MikrotikTab({ routerId }) {
  const [sysInfo, setSysInfo] = useState(null);
  const [interfaces, setInterfaces] = useState([]);
  const [selectedIface, setSelectedIface] = useState('');
  const [trafficData, setTrafficData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => { loadInfo(); }, [routerId]);

  useEffect(() => {
    if (!selectedIface) return;
    setTrafficData([]);
    pollTraffic();
    pollRef.current = setInterval(pollTraffic, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedIface]);

  async function loadInfo() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.routers.info(routerId);
      setSysInfo(res.system_info || {});
      setInterfaces(res.interfaces || []);
      if (res.interfaces?.length > 0) setSelectedIface(res.interfaces[0].name);
    } catch (e) {
      setError(e.message || 'Error al conectar con el router');
    }
    setLoading(false);
  }

  const pollTraffic = useCallback(async () => {
    if (!selectedIface) return;
    setPolling(true);
    try {
      const res = await api.routers.traffic(routerId, selectedIface);
      const timeLabel = new Date().toLocaleTimeString('es-PE', { hour12: false });
      const tx = Math.round(((res.tx_bps || 0) / 1000000) * 100) / 100;
      const rx = Math.round(((res.rx_bps || 0) / 1000000) * 100) / 100;
      setTrafficData((prev) => [...prev, { time: timeLabel, tx, rx }].slice(-20));
    } catch (e) {
      console.error('Traffic poll error:', e);
    }
    setPolling(false);
  }, [routerId, selectedIface]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-rose-500 mb-3">{error}</p>
        <button onClick={loadInfo} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white bg-sky-500 hover:bg-sky-600">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    );
  }

  const cpuLoad = sysInfo['cpu-load'] || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-500" /> Información del Router
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          <InfoRow label="uptime" value={sysInfo.uptime} />
          <InfoRow label="version" value={sysInfo.version} />
          <InfoRow label="build-time" value={sysInfo['build-time']} />
          <InfoRow label="factory-software" value={sysInfo['factory-software']} />
          <InfoRow label="free-memory" value={sysInfo['free-memory']} />
          <InfoRow label="total-memory" value={sysInfo['total-memory']} />
          <InfoRow label="cpu" value={sysInfo.cpu} />
          <InfoRow label="cpu-count" value={sysInfo['cpu-count']} />
          <InfoRow label="cpu-frequency" value={sysInfo['cpu-frequency']} />
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-slate-600">cpu-load</span>
            <div className="flex items-center gap-2 w-48">
              <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${cpuLoad}%` }} />
              </div>
              <span className="text-sm text-slate-700 font-medium w-10 text-right">{cpuLoad}%</span>
            </div>
          </div>
          <InfoRow label="free-hdd-space" value={sysInfo['free-hdd-space']} />
          <InfoRow label="total-hdd-space" value={sysInfo['total-hdd-space']} />
          <InfoRow label="write-sect-since-reboot" value={sysInfo['write-sect-since-reboot']} />
          <InfoRow label="write-sect-total" value={sysInfo['write-sect-total']} />
          <InfoRow label="bad-blocks" value={sysInfo['bad-blocks']} />
          <InfoRow label="architecture-name" value={sysInfo['architecture-name']} />
          <InfoRow label="board-name" value={sysInfo['board-name']} />
          <InfoRow label="platform" value={sysInfo.platform} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Network className="w-4 h-4 text-sky-500" /> Tráfico Actual
          </h3>
          <div className="flex items-center gap-2">
            {polling && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            <select
              value={selectedIface}
              onChange={(e) => setSelectedIface(e.target.value)}
              className="h-8 px-2 text-sm rounded-md border border-slate-300 text-slate-600 bg-white focus:border-sky-400 focus:outline-none"
            >
              {interfaces.map((iface) => (
                <option key={iface.name} value={iface.name}>{iface.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-4">
          {trafficData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-sm text-slate-400">Recopilando datos de tráfico…</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mbps" />
                  <Tooltip contentStyle={{ background: 'rgba(51,51,51,0.92)', border: 'none', borderRadius: '6px', fontSize: 12 }} labelStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="tx" stroke="#007bff" strokeWidth={2} dot={false} name="TX" />
                  <Line type="monotone" dataKey="rx" stroke="#e74c3c" strokeWidth={2} dot={false} name="RX" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-3">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#007bff]" /><span className="text-xs text-slate-600 font-medium">TX</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#e74c3c]" /><span className="text-xs text-slate-600 font-medium">RX</span></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value || '—'}</span>
    </div>
  );
}