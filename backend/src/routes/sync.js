import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired, adminRequired } from '../lib/auth.js';
import { checkConnection, listDhcpLeases, listPppSecrets } from '../lib/mikrotik.js';

const router = Router();
router.use(authRequired, adminRequired);

router.post('/:id', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  let status = 'online', leases = null, secrets = null, error = null;
  try { await checkConnection(r); leases = await listDhcpLeases(r); secrets = await listPppSecrets(r); }
  catch (e) { status = 'offline'; error = e.message; }
  const updated = await prisma.router.update({ where: { id: r.id }, data: { status, last_sync: new Date() } });
  res.json({ router: updated, leases, secrets, error });
});

export default router;