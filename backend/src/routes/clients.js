import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../lib/auth.js';
import { suspendClient, activateClient } from '../lib/mikrotik.js';

const router = Router();
router.use(authRequired);

async function logChange(client, change_type, description, extra = {}) {
  await prisma.changeLog.create({ data: {
    client_id: client.id, client_name: client.full_name, change_type, description,
    performed_by: extra.performed_by || 'system', router_id: client.router_id || null,
    field: extra.field || null, old_value: extra.old_value || null, new_value: extra.new_value || null,
  }});
}

router.get('/', async (req, res) => res.json(await prisma.client.findMany({ orderBy: { id: 'desc' } })));
router.get('/:id', async (req, res) => {
  const c = await prisma.client.findUnique({
    where: { id: Number(req.params.id) },
    include: { billing_records: { orderBy: { id: 'desc' } }, change_logs: { orderBy: { id: 'desc' } } },
  });
  if (!c) return res.status(404).json({ error: 'No encontrado' });
  res.json(c);
});
router.post('/', async (req, res) => {
  const data = req.body;
  if (data.router_id) { const r = await prisma.router.findUnique({ where: { id: Number(data.router_id) } }); data.router_name = r?.name; }
  const c = await prisma.client.create({ data });
  await logChange(c, 'create', `Cliente creado: ${c.full_name}`, { performed_by: req.user.email });
  res.json(c);
});
router.put('/:id', async (req, res) => {
  const data = req.body;
  if (data.router_id) { const r = await prisma.router.findUnique({ where: { id: Number(data.router_id) } }); data.router_name = r?.name; }
  const c = await prisma.client.update({ where: { id: Number(req.params.id) }, data });
  await logChange(c, 'update', `Cliente actualizado: ${c.full_name}`, { performed_by: req.user.email });
  res.json(c);
});
router.delete('/:id', async (req, res) => {
  const c = await prisma.client.findUnique({ where: { id: Number(req.params.id) } });
  if (!c) return res.status(404).json({ error: 'No encontrado' });
  await prisma.client.delete({ where: { id: c.id } });
  await logChange(c, 'delete', `Cliente eliminado: ${c.full_name}`, { performed_by: req.user.email });
  res.json({ ok: true });
});

router.post('/:id/status', async (req, res) => {
  const { action } = req.body;
  const c = await prisma.client.findUnique({ where: { id: Number(req.params.id) } });
  if (!c) return res.status(404).json({ error: 'No encontrado' });
  if (c.router_id) {
    const r = await prisma.router.findUnique({ where: { id: c.router_id } });
    if (r) {
      try { action === 'suspend' ? await suspendClient(r, c) : await activateClient(r, c); }
      catch (e) { return res.status(500).json({ error: 'MikroTik: ' + e.message }); }
    }
  }
  const updated = await prisma.client.update({ where: { id: c.id }, data: {
    status: action === 'suspend' ? 'suspended' : 'active',
    suspended_at: action === 'suspend' ? new Date() : null,
    suspended_reason: action === 'suspend' ? (req.body.reason || 'Manual') : null,
  }});
  await logChange(c, action === 'suspend' ? 'suspend' : 'reactivate', action === 'suspend' ? 'Servicio suspendido' : 'Servicio reactivado', { performed_by: req.user.email });
  res.json(updated);
});

export default router;