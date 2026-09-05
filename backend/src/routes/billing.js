import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../lib/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => res.json(await prisma.billingRecord.findMany({ orderBy: { id: 'desc' } })));
router.get('/client/:clientId', async (req, res) => res.json(await prisma.billingRecord.findMany({ where: { client_id: Number(req.params.clientId) }, orderBy: { id: 'desc' } })));
router.post('/', async (req, res) => res.json(await prisma.billingRecord.create({ data: req.body })));
router.put('/:id', async (req, res) => res.json(await prisma.billingRecord.update({ where: { id: Number(req.params.id) }, data: req.body })));
router.delete('/:id', async (req, res) => { await prisma.billingRecord.delete({ where: { id: Number(req.params.id) } }); res.json({ ok: true }); });

export default router;