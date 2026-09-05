import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, adminRequired } from '../lib/auth.js';
import { pingRouter, listDhcpLeases, listPppSecrets, getSystemResource } from '../lib/mikrotik.js';

const router = Router();
router.use(authRequired, adminRequired);

router.post('/:id', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  const ping = await pingRouter(r);
  const status = ping.ok ? 'online' : 'offline';
  let leases = [], secrets = [], systemInfo = {}, error = null;
  if (ping.ok) {
    try {
      systemInfo = await getSystemResource(r);
      leases = await listDhcpLeases(r);
      secrets = await listPppSecrets(r);
    } catch (e) {
      error = e.message;
    }
  }
  const updated = await prisma.router.update({
    where: { id: r.id },
    data: {
      status,
      last_sync: new Date(),
      model: systemInfo.board || r.model || null,
      ros_version: systemInfo.version || r.ros_version || null,
    },
  });
  await prisma.changeLog.create({ data: {
    client_id: null, change_type: 'sync',
    description: `Sincronización ${ping.ok ? 'exitosa' : 'fallida'} del router "${r.name}": ${leases.length} leases DHCP, ${secrets.length} secretos PPPoE${error ? ' — Error: ' + error : ''}${!ping.ok ? ' — ' + ping.error : ''}`,
    performed_by: req.user?.email || 'sistema', router_id: r.id,
  }});
  res.json({
    router: updated,
    dhcp_leases: leases.map((l) => ({ address: l.address, mac: l['mac-address'], host: l.host_name, disabled: l.disabled === true, comment: l.comment })),
    ppp_secrets: secrets.map((s) => ({ name: s.name, service: s.service, profile: s.profile, disabled: s.disabled === true, comment: s.comment })),
    error,
  });
});

export default router;