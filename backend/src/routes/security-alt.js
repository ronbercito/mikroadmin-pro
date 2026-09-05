import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, adminRequired } from '../lib/auth.js';
import { addStaticDhcpLease, addIpBinding } from '../lib/mikrotik.js';

const router = Router();
router.use(authRequired, adminRequired);

router.post('/:id/security-alt', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'Router no encontrado' });
  const securityAlt = r.security_alt || 'none';
  if (securityAlt === 'none') {
    return res.json({ ok: true, message: 'Seguridad alterna: Ninguno — sin acción', applied: 0 });
  }
  const clients = await prisma.client.findMany({ where: { router_id: r.id } });
  let applied = 0, skipped = 0;
  const errors = [];
  for (const c of clients) {
    try {
      const mac = c.mac_address || '';
      const ip = c.ip_address || '';
      if (securityAlt === 'ip_mac_binding' || securityAlt === 'ip_mac_dhcp') {
        if (mac && ip) { await addStaticDhcpLease(r, mac, ip, c.full_name); applied++; }
        else skipped++;
      }
      if (securityAlt === 'dhcp_leases') {
        if (mac && ip) { await addStaticDhcpLease(r, mac, ip, c.full_name); applied++; }
        else skipped++;
      }
      if (securityAlt === 'ip_binding') {
        if (ip) { await addIpBinding(r, ip, mac, 'all', 'regular'); applied++; }
        else skipped++;
      }
    } catch (e) {
      errors.push({ client: c.full_name, error: e.message });
    }
  }
  await prisma.changeLog.create({ data: {
    client_id: null, change_type: 'sync',
    description: `Seguridad alterna aplicada (${securityAlt}) en router "${r.name}": ${applied} aplicados, ${skipped} omitidos${errors.length > 0 ? ', ' + errors.length + ' errores' : ''}`,
    performed_by: req.user?.email || 'sistema', router_id: r.id,
  }});
  res.json({ ok: true, security_alt: securityAlt, clients_total: clients.length, applied, skipped, errors: errors.length > 0 ? errors : undefined });
});

export default router;