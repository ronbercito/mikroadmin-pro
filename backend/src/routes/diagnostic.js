import { Router } from 'express';
import net from 'net';
import prisma from '../lib/prisma.js';
import { authRequired } from '../lib/auth.js';

const router = Router();
router.use(authRequired);

// Diagnóstico de conectividad TCP cruda al router
router.post('/:id/test', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'No encontrado' });

  const host = r.host;
  const port = r.api_port || 8728;
  const t0 = Date.now();

  // 1. Test TCP crudo — solo intenta conectar, sin protocolo API
  const tcpResult = await new Promise((resolve) => {
    const sock = new net.Socket();
    const timer = setTimeout(() => {
      sock.destroy();
      resolve({ ok: false, error: `Timeout TCP — el servidor no pudo alcanzar ${host}:${port} en 5s. Posible causa: el servidor no tiene ruta hacia esa IP, o firewall bloquea el puerto.`, ms: Date.now() - t0 });
    }, 5000);
    sock.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: `Error TCP [${err.code}]: ${err.message}`, ms: Date.now() - t0 });
    });
    sock.on('connect', () => {
      clearTimeout(timer);
      const ms = Date.now() - t0;
      sock.destroy();
      resolve({ ok: true, ms });
    });
    sock.connect(port, host);
  });

  res.json({
    host,
    port,
    use_tls: r.use_tls,
    tcp: tcpResult,
    server_time: new Date().toISOString(),
  });
});

export default router;
