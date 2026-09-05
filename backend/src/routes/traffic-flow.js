import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, adminRequired } from '../lib/auth.js';
import { enableTrafficFlow, disableTrafficFlow, setTrafficFlowTarget, setTrafficFlowInterface } from '../lib/mikrotik.js';

const router = Router();
router.use(authRequired, adminRequired);

router.post('/:id/traffic-flow', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'Router no encontrado' });
  try {
    if (r.traffic_logging !== 'traffic_flow') {
      await disableTrafficFlow(r);
      await prisma.changeLog.create({ data: {
        client_id: null, change_type: 'sync',
        description: `Traffic Flow deshabilitado en router "${r.name}"`,
        performed_by: req.user?.email || 'sistema', router_id: r.id,
      }});
      return res.json({ ok: true, message: 'Traffic Flow deshabilitado' });
    }
    const target = r.traffic_flow_target || '';
    const iface = r.traffic_flow_interface || 'all';
    await enableTrafficFlow(r);
    if (target) await setTrafficFlowTarget(r, target);
    await setTrafficFlowInterface(r, iface);
    await prisma.changeLog.create({ data: {
      client_id: null, change_type: 'sync',
      description: `Traffic Flow habilitado en router "${r.name}": colector=${target || 'no configurado'}, interfaz=${iface}`,
      performed_by: req.user?.email || 'sistema', router_id: r.id,
    }});
    res.json({ ok: true, message: 'Traffic Flow configurado', target, interface: iface });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;