{/* Columna Izquierda: Datos & Configuración */}
<div>
  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Datos & Configuración</h3>
  <div className="space-y-4">
    <FF label="Nombre Router"><input value={form.name} onChange={(e) => set('name', e.target.value)} required className="form-input" /></FF>
    <FF label="Tipo Router"><select value={form.router_type} onChange={(e) => set('router_type', e.target.value)} className="form-input"><option>MikroTik</option><option>Ubiquiti</option><option>Cisco</option><option>Otro</option></select></FF>
    <FF label="Ubicación"><div className="relative"><input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="lat,long" className="form-input pr-9" /><MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /></div></FF>
    <FF label="IP / Host"><input value={form.host} onChange={(e) => set('host', e.target.value)} required className="form-input" /></FF>
    
    {/* --- AGREGAR DESDE AQUÍ --- */}
    <div className="grid grid-cols-2 gap-4">
      <FF label="Puerto API">
        <input 
          type="number" 
          value={form.api_port} 
          onChange={(e) => set('api_port', Number(e.target.value))} 
          className="form-input" 
        />
      </FF>
      <FF label="Usar TLS (SSL)">
        <select 
          value={String(form.use_tls)} 
          onChange={(e) => {
            const isTls = e.target.value === 'true';
            setForm((f) => ({
              ...f,
              use_tls: isTls,
              api_port: isTls ? 8729 : 8728 // Ajusta automáticamente el puerto estándar de MikroTik
            }));
          }} 
          className="form-input"
        >
          <option value="false">No (API - 8728)</option>
          <option value="true">Sí (API-SSL - 8729)</option>
        </select>
      </FF>
    </div>
    {/* --- HASTA AQUÍ --- */}

    <FF label="Seguridad"><select value={form.security} onChange={(e) => set('security', e.target.value)} className="form-input"><option value="none_accounting_api">Ninguno / Accounting API</option><option value="ppp_accounting_api">PPP / Accounting API</option></select></FF>
    <FF label="Seguridad alterna">
      <select
        value={form.security === 'ppp_accounting_api' ? 'none' : form.security_alt}
        onChange={(e) => set('security_alt', e.target.value)}
        disabled={form.security === 'ppp_accounting_api'}
        className="form-input disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        <option value="none">Ninguno</option>
        <option value="ip_mac_binding">Amarre de IP y Mac</option>
        <option value="dhcp_leases">DHCP Leases</option>
        <option value="ip_binding">IP Binding</option>
        <option value="ip_mac_dhcp">Amarre de IP y Mac + DHCP Leases</option>
      </select>
      {form.security === 'ppp_accounting_api' && <p className="text-xs text-slate-400 mt-1">Se desactiva con PPP (clientes PPPoE usan la seguridad principal).</p>}
    </FF>
  </div>
</div>
