// Cliente para la API nativa de MikroTik RouterOS (protocolo API, puerto 8728/8729)
import net from 'net';
import tls from 'tls';
import crypto from 'crypto';

const SUSPENDED_LIST = 'isp-suspended';
const BOOL_FIELDS = new Set(['disabled', 'dynamic', 'invalid', 'running', 'active', 'blocked', 'radius']);

// --- Codificación del protocolo API (length-prefixed words) ---

function encodeLength(len) {
  if (len < 0x80) return Buffer.from([len]);
  if (len < 0x4000) return Buffer.from([0x80 | (len >> 8), len & 0xFF]);
  if (len < 0x200000) return Buffer.from([0xC0 | (len >> 16), (len >> 8) & 0xFF, len & 0xFF]);
  if (len < 0x10000000) return Buffer.from([0xE0 | (len >> 24), (len >> 16) & 0xFF, (len >> 8) & 0xFF, len & 0xFF]);
  return Buffer.from([0xF0, (len >> 24) & 0xFF, (len >> 16) & 0xFF, (len >> 8) & 0xFF, len & 0xFF]);
}

function encodeWord(str) {
  const buf = Buffer.from(str, 'utf8');
  return Buffer.concat([encodeLength(buf.length), buf]);
}

function encodeSentence(words) {
  const parts = words.map(encodeWord);
  parts.push(Buffer.from([0]));
  return Buffer.concat(parts);
}

function readLength(buf, offset) {
  if (offset >= buf.length) return null;
  const b = buf[offset];
  if (b < 0x80) return { length: b, bytesRead: 1 };
  if ((b & 0xC0) === 0x80) {
    if (offset + 1 >= buf.length) return null;
    return { length: ((b & 0x3F) << 8) | buf[offset + 1], bytesRead: 2 };
  }
  if ((b & 0xE0) === 0xC0) {
    if (offset + 2 >= buf.length) return null;
    return { length: ((b & 0x1F) << 16) | (buf[offset + 1] << 8) | buf[offset + 2], bytesRead: 3 };
  }
  if ((b & 0xF0) === 0xE0) {
    if (offset + 3 >= buf.length) return null;
    return { length: ((b & 0x0F) << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3], bytesRead: 4 };
  }
  if ((b & 0xF8) === 0xF0) {
    if (offset + 4 >= buf.length) return null;
    return { length: (buf[offset + 1] << 24) | (buf[offset + 2] << 16) | (buf[offset + 3] << 8) | buf[offset + 4], bytesRead: 5 };
  }
  return null;
}

// --- Conexión TCP con el router ---

class RouterOSConnection {
  constructor(sock) {
    this.sock = sock;
    this.buffer = Buffer.alloc(0);
    this.waiter = null;
    this.waiterErr = null;
    sock.on('data', (data) => this.onData(data));
    sock.on('error', (err) => this.fail(err));
    sock.on('close', () => this.fail(new Error('Conexión cerrada')));
    sock.on('timeout', () => { sock.destroy(new Error('Timeout de conexión')); });
  }

  onData(data) {
    this.buffer = Buffer.concat([this.buffer, data]);
    this.tryResolve();
  }

  fail(err) {
    if (this.waiterErr) {
      const e = this.waiterErr;
      this.waiter = null;
      this.waiterErr = null;
      e(err);
    }
  }

  tryResolve() {
    while (this.waiter) {
      const sentence = this.tryReadSentence();
      if (!sentence) break;
      const w = this.waiter;
      this.waiter = null;
      this.waiterErr = null;
      w(sentence);
    }
  }

  tryReadSentence() {
    const words = [];
    let offset = 0;
    while (true) {
      const lenInfo = readLength(this.buffer, offset);
      if (!lenInfo) return null;
      offset += lenInfo.bytesRead;
      if (lenInfo.length === 0) {
        this.buffer = this.buffer.subarray(offset);
        return words;
      }
      if (offset + lenInfo.length > this.buffer.length) return null;
      words.push(this.buffer.subarray(offset, offset + lenInfo.length).toString('utf8'));
      offset += lenInfo.length;
    }
  }

  write(words) {
    this.sock.write(encodeSentence(words));
  }

  read() {
    return new Promise((resolve, reject) => {
      this.waiter = resolve;
      this.waiterErr = reject;
      this.tryResolve();
    });
  }

  close() {
    this.sock.destroy();
  }
}

async function connect(router) {
  const useTls = router.use_tls === true;
  const port = router.api_port || (useTls ? 8729 : 8728);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout de conexión (10s)')), 10000);
    if (useTls) {
      const sock = tls.connect(port, router.host, { rejectUnauthorized: false }, () => {
        clearTimeout(timer);
        sock.setTimeout(15000);
        resolve(new RouterOSConnection(sock));
      });
      sock.on('error', (err) => { clearTimeout(timer); reject(err); });
    } else {
      const sock = new net.Socket();
      sock.on('error', (err) => { clearTimeout(timer); reject(err); });
      sock.connect(port, router.host, () => {
        clearTimeout(timer);
        sock.setTimeout(15000);
        resolve(new RouterOSConnection(sock));
      });
    }
  });
}

async function login(conn, username, password) {
  conn.write(['/login']);
  const res = await conn.read();
  let challenge = '';
  for (const w of res) {
    if (w.startsWith('=ret=')) challenge = w.slice(5);
  }
  if (!challenge) throw new Error('Login: no se recibió challenge del router');
  const hash = crypto.createHash('md5')
    .update(Buffer.concat([Buffer.from([0]), Buffer.from(password, 'utf8'), Buffer.from(challenge, 'hex')]))
    .digest('hex');
  conn.write(['/login', `=name=${username}`, `=response=${hash}`]);
  const result = await conn.read();
  if (result[0] !== '!done') {
    const msg = result.find((w) => w.startsWith('=message=')) || '';
    throw new Error('Login fallido: ' + msg.slice(9));
  }
}

function parseRecord(words) {
  const rec = {};
  for (const w of words) {
    if (w.startsWith('=')) {
      const eq = w.indexOf('=', 1);
      const key = w.slice(1, eq);
      const val = w.slice(eq + 1);
      rec[key] = BOOL_FIELDS.has(key) ? val === 'true' : val;
    } else if (w.startsWith('.')) {
      const eq = w.indexOf('=', 1);
      if (eq > 0) rec[w.slice(0, eq)] = w.slice(eq + 1);
    }
  }
  return rec;
}

async function runCommand(router, path, params = {}) {
  const conn = await connect(router);
  try {
    await login(conn, router.username, router.password);
    const words = [path];
    for (const [k, v] of Object.entries(params)) words.push(`=${k}=${v}`);
    conn.write(words);
    const records = [];
    while (true) {
      const sentence = await conn.read();
      if (sentence[0] === '!done') break;
      if (sentence[0] === '!re') records.push(parseRecord(sentence.slice(1)));
      if (sentence[0] === '!trap') {
        const msg = sentence.find((w) => w.startsWith('=message=')) || '';
        throw new Error('RouterOS: ' + msg.slice(9));
      }
    }
    return records;
  } finally {
    conn.close();
  }
}

// === API pública ===

export async function pingRouter(router) {
  try {
    await runCommand(router, '/system/identity/print');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function checkConnection(router) {
  const r = await pingRouter(router);
  if (!r.ok) throw new Error(r.error);
  return 'ok';
}

export async function listDhcpLeases(router) {
  return runCommand(router, '/ip/dhcp-server/lease/print');
}

export async function listPppSecrets(router) {
  return runCommand(router, '/ppp/secret/print');
}

export async function listFirewallAddressList(router) {
  return runCommand(router, '/ip/firewall/address-list/print');
}

export async function disableDhcpLease(router, leaseId) {
  await runCommand(router, '/ip/dhcp-server/lease/disable', { numbers: leaseId });
}

export async function enableDhcpLease(router, leaseId) {
  await runCommand(router, '/ip/dhcp-server/lease/enable', { numbers: leaseId });
}

export async function disablePppSecret(router, secretId) {
  await runCommand(router, '/ppp/secret/disable', { numbers: secretId });
}

export async function enablePppSecret(router, secretId) {
  await runCommand(router, '/ppp/secret/enable', { numbers: secretId });
}

export async function addAddressList(router, address, listName, comment) {
  await runCommand(router, '/ip/firewall/address-list/add', {
    address,
    list: listName || SUSPENDED_LIST,
    comment: comment || 'suspended by ISP panel',
  });
}

export async function removeAddressListEntries(router, entries) {
  for (const e of entries) {
    await runCommand(router, '/ip/firewall/address-list/remove', { numbers: e['.id'] });
  }
}

export async function findAddressListEntries(router, address, listName) {
  const all = await listFirewallAddressList(router);
  return (all || []).filter((e) => e.address === address && e.list === listName);
}

// === Seguridad alterna ===

export async function addStaticDhcpLease(router, macAddress, ipAddress, comment) {
  const params = { address: ipAddress };
  if (macAddress) params['mac-address'] = macAddress;
  if (comment) params.comment = comment;
  return runCommand(router, '/ip/dhcp-server/lease/add', params);
}

export async function removeDhcpLease(router, leaseId) {
  return runCommand(router, '/ip/dhcp-server/lease/remove', { numbers: leaseId });
}

export async function listIpBindings(router) {
  return runCommand(router, '/ip/hotspot/ip-binding/print');
}

export async function addIpBinding(router, address, macAddress, server, type) {
  const params = { address, type: type || 'regular' };
  if (macAddress) params['mac-address'] = macAddress;
  if (server) params.server = server;
  return runCommand(router, '/ip/hotspot/ip-binding/add', params);
}

export async function removeIpBinding(router, bindingId) {
  return runCommand(router, '/ip/hotspot/ip-binding/remove', { numbers: bindingId });
}

// === System info & interfaces ===

export async function getSystemResource(router) {
  const records = await runCommand(router, '/system/resource/print');
  return records[0] || {};
}

export async function listInterfaces(router) {
  return runCommand(router, '/interface/print');
}

export async function monitorInterfaceTraffic(router, interfaceName) {
  const records = await runCommand(router, '/interface/monitor-traffic', {
    interface: interfaceName,
    once: '',
  });
  return records[0] || {};
}

// === Traffic Flow ===

export async function enableTrafficFlow(router) {
  await runCommand(router, '/ip/traffic-flow/set', { enabled: 'true' });
}

export async function disableTrafficFlow(router) {
  await runCommand(router, '/ip/traffic-flow/set', { enabled: 'false' });
}

export async function setTrafficFlowTarget(router, address) {
  const existing = await runCommand(router, '/ip/traffic-flow/target/print');
  for (const t of existing) {
    await runCommand(router, '/ip/traffic-flow/target/remove', { numbers: t['.id'] });
  }
  if (address) {
    await runCommand(router, '/ip/traffic-flow/target/add', { address });
  }
}

export async function setTrafficFlowInterface(router, interfaceName) {
  const existing = await runCommand(router, '/ip/traffic-flow/interface/print');
  for (const i of existing) {
    await runCommand(router, '/ip/traffic-flow/interface/remove', { numbers: i['.id'] });
  }
  await runCommand(router, '/ip/traffic-flow/interface/add', { interface: interfaceName });
}

// === Suspend / Activate ===

export async function suspendClient(router, client) {
  if (client.connection_type === 'static' && client.ip_address) {
    await addAddressList(router, client.ip_address, SUSPENDED_LIST, client.full_name);
  } else if (client.connection_type === 'dhcp' && client.mac_address) {
    const leases = await listDhcpLeases(router);
    const lease = leases.find((l) => (l['mac-address'] || '').toLowerCase() === client.mac_address.toLowerCase());
    if (lease) await disableDhcpLease(router, lease['.id']);
  } else if (client.connection_type === 'pppoe' && client.pppoe_user) {
    const secrets = await listPppSecrets(router);
    const s = secrets.find((x) => x.name === client.pppoe_user);
    if (s) await disablePppSecret(router, s['.id']);
  }
}

export async function activateClient(router, client) {
  if (client.connection_type === 'static' && client.ip_address) {
    const entries = await findAddressListEntries(router, client.ip_address, SUSPENDED_LIST);
    if (entries.length > 0) await removeAddressListEntries(router, entries);
  } else if (client.connection_type === 'dhcp' && client.mac_address) {
    const leases = await listDhcpLeases(router);
    const lease = leases.find((l) => (l['mac-address'] || '').toLowerCase() === client.mac_address.toLowerCase());
    if (lease) await enableDhcpLease(router, lease['.id']);
  } else if (client.connection_type === 'pppoe' && client.pppoe_user) {
    const secrets = await listPppSecrets(router);
    const s = secrets.find((x) => x.name === client.pppoe_user);
    if (s) await enablePppSecret(router, s['.id']);
  }
}