import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, adminRequired } from '../lib/auth.js';
import { pingRouter, getSystemResource, listInterfaces, monitorInterfaceTraffic } from '../lib/mikrotik.js';

const router = Router();
router.use(authRequired, adminRequired);

router.get('/:id/info', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'Router no encontrado' });
  const ping = await pingRouter(r);
  if (!ping.ok) return res.status(503).json({ error: 'Router no conectado: ' + ping.error });
  try {
    const system_info = await getSystemResource(r);
    const interfaces = await listInterfaces(r);
    res.json({
      ok: true,
      system_info,
      interfaces: (interfaces || []).map((i) => ({
        name: i.name,
        type: i.type,
        running: i.running === true,
        disabled: i.disabled === true,
        mac: i['mac-address'],
        mtu: i.mtu,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/traffic/:interface', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'Router no encontrado' });
  try {
    const traffic = await monitorInterfaceTraffic(r, req.params.interface);
    res.json({
      ok: true,
      tx_bps: parseInt(traffic['tx-bps'] || '0', 10),
      rx_bps: parseInt(traffic['rx-bps'] || '0', 10),
      tx_pps: parseInt(traffic['tx-pps'] || '0', 10),
      rx_pps: parseInt(traffic['rx-pps'] || '0', 10),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;