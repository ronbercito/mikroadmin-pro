import { Router } from 'express';
import net from 'net';
import tls from 'tls';
import prisma from '../lib/prisma.js';
import { authRequired } from '../lib/auth.js';
import { pingRouter, getSystemResource } from '../lib/mikrotik.js';

const router = Router();
router.use(authRequired);

// Diagnóstico completo: TCP crudo + login API
router.post('/:id/test', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'No encontrado' });

  const host = r.host;
  const port = r.api_port || 8728;
  const useTls = r.use_tls === true;
  const t0 = Date.now();

  // 1. Test TCP crudo
  const tcpResult = await new Promise((resolve) => {
    const sock = useTls ? new tls.TLSSocket() : new net.Socket();
    const timer = setTimeout(() => {
      sock.destroy();
      resolve({ ok: false, error: `Timeout TCP — el servidor no pudo alcanzar ${host}:${port} en 5s`, ms: Date.now() - t0 });
    }, 5000);
    sock.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: `Error TCP [${err.code}]: ${err.message}`, ms: Date.now() - t0 });
    });
    sock.on('secureConnect', () => {
      clearTimeout(timer);
      resolve({ ok: true, ms: Date.now() - t0 });
      sock.destroy();
    });
    sock.on('connect', () => {
      clearTimeout(timer);
      resolve({ ok: true, ms: Date.now() - t0 });
      sock.destroy();
    });
    if (useTls) {
      sock.connect({ port, host, rejectUnauthorized: false });
    } else {
      sock.connect(port, host);
    }
  });

  // 2. Test API completo (login + comando)
  let apiResult = { ok: false, error: 'No se probó API' };
  if (tcpResult.ok) {
    try {
      const ping = await pingRouter(r);
      if (ping.ok) {
        const res2 = await getSystemResource(r);
        apiResult = {
          ok: true,
          board: res2['board-name'] || res2.board || '',
          version: res2.version || '',
          uptime: res2.uptime || '',
        };
      } else {
        apiResult = { ok: false, error: ping.error };
      }
    } catch (e) {
      apiResult = { ok: false, error: e.message };
    }
  }

  res.json({
    host,
    port,
    use_tls: useTls,
    tcp: tcpResult,
    api: apiResult,
    server_time: new Date().toISOString(),
  });
});

export default router;
