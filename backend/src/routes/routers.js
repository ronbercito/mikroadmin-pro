import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../lib/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => res.json(await prisma.router.findMany({ orderBy: { id: 'asc' } })));
router.get('/:id', async (req, res) => {
  const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
  if (!r) return res.status(404).json({ error: 'No encontrado' });
  res.json(r);
});
router.post('/', async (req, res) => res.json(await prisma.router.create({ data: req.body })));
router.put('/:id', async (req, res) => res.json(await prisma.router.update({ where: { id: Number(req.params.id) }, data: req.body })));
router.delete('/:id', async (req, res) => { await prisma.router.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); });

export default router;