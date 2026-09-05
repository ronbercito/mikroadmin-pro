import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, adminRequired } from '../lib/auth.js';
import { suspendClient } from '../lib/mikrotik.js';

const router = Router();
router.use(authRequired, adminRequired);

router.post('/', async (req, res) => {
  const today = new Date();
  const clients = await prisma.client.findMany({ where: { status: 'active', auto_cutoff: true }, include: { router: true } });
  const eligible = clients.filter((c) => c.next_due_date && new Date(c.next_due_date) < today);
  const suspended = [];
  for (const c of eligible) {
    try {
      if (c.router) await suspendClient(c.router, c);
      await prisma.client.update({ where: { id: c.id }, data: { status: 'suspended', suspended_at: new Date(), suspended_reason: 'Impago' } });
      await prisma.changeLog.create({ data: { client_id: c.id, client_name: c.full_name, change_type: 'suspend', description: 'Corte automático por impago', performed_by: 'cron' } });
      suspended.push(c.id);
    } catch (e) { /* continuar */ }
  }
  res.json({ checked: clients.length, eligible: eligible.length, suspended });
});

export default router;