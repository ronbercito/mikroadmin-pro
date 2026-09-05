// Cliente REST API RouterOS v7.1+ (portado de la versión Base44)
const SUSPENDED_LIST = 'isp-suspended';

function baseUrl(r) {
  const proto = r.use_tls !== false ? 'https' : 'http';
  return `${proto}://${r.host}:${r.api_port || 443}/rest`;
}
function authHeader(r) {
  const token = Buffer.from(`${r.username}:${r.password}`).toString('base64');
  return { Authorization: `Basic ${token}`, 'Content-Type': 'application/json' };
}
async function call(r, method, path, body) {
  const res = await fetch(`${baseUrl(r)}${path}`, {
    method, headers: authHeader(r),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`MikroTik ${res.status}: ${text}`);
  return data;
}

export async function checkConnection(r) { const d = await call(r, 'GET', '/system/identity'); return d?.name || 'ok'; }
export async function listDhcpLeases(r) { return call(r, 'GET', '/ip/dhcp-server/lease'); }
export async function listPppSecrets(r) { return call(r, 'GET', '/ppp/secret'); }
export async function setDhcpLeaseDisabled(r, id, disabled) { return call(r, 'PATCH', `/ip/dhcp-server/lease/${id}`, { disabled }); }
export async function setPppSecretDisabled(r, id, disabled) { return call(r, 'PATCH', `/ppp/secret/${id}`, { disabled }); }
export async function addAddressList(r, address, list = SUSPENDED_LIST) { return call(r, 'POST', '/ip/firewall/address-list', { address, list, comment: 'isp-panel' }); }
export async function findAddressList(r, address, list = SUSPENDED_LIST) {
  return call(r, 'GET', `/ip/firewall/address-list?where={"list":"${list}","address":"${address}"}`);
}
export async function removeAddressList(r, id) { return call(r, 'DELETE', `/ip/firewall/address-list/${id}`); }

export async function suspendClient(r, c) {
  if (c.connection_type === 'static' && c.ip_address) await addAddressList(r, c.ip_address);
  else if (c.connection_type === 'dhcp' && c.mac_address) {
    const leases = await listDhcpLeases(r);
    const lease = leases.find((l) => (l['mac-address'] || '').toLowerCase() === c.mac_address.toLowerCase());
    if (lease) await setDhcpLeaseDisabled(r, lease['.id'], true);
  } else if (c.connection_type === 'pppoe' && c.pppoe_user) {
    const secrets = await listPppSecrets(r);
    const s = secrets.find((x) => x.name === c.pppoe_user);
    if (s) await setPppSecretDisabled(r, s['.id'], true);
  }
}

export async function activateClient(r, c) {
  if (c.connection_type === 'static' && c.ip_address) {
    const found = await findAddressList(r, c.ip_address);
    if (Array.isArray(found) && found.length) await removeAddressList(r, found[0]['.id']);
  } else if (c.connection_type === 'dhcp' && c.mac_address) {
    const leases = await listDhcpLeases(r);
    const lease = leases.find((l) => (l['mac-address'] || '').toLowerCase() === c.mac_address.toLowerCase());
    if (lease) await setDhcpLeaseDisabled(r, lease['.id'], false);
  } else if (c.connection_type === 'pppoe' && c.pppoe_user) {
    const secrets = await listPppSecrets(r);
    const s = secrets.find((x) => x.name === c.pppoe_user);
    if (s) await setPppSecretDisabled(r, s['.id'], false);
  }
}