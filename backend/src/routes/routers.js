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

router.get('/:id/logs', async (req, res) => {
  const logs = await prisma.changeLog.findMany({
    where: { router_id: Number(req.params.id) },
    orderBy: { id: 'desc' },
    take: 100,
  });
  res.json(logs);
});

// Crear router
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    const nuevoRouter = await prisma.router.create({ data });
    res.json(nuevoRouter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar router (Evita sobreescribir la contraseña si viene vacía o enmascarada)
router.put('/:id', async (req, res) => {
  try {
    const { password, ...restData } = req.body;
    const updateData = { ...restData };

    // Solo actualizar la contraseña si el usuario escribió una nueva y no está vacía
    if (password && password.trim() !== '' && !password.includes('***')) {
      updateData.password = password;
    }

    const routerActualizado = await prisma.router.update({
      where: { id: Number(req.params.id) },
      data: updateData,
    });

    res.json(routerActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => { 
  await prisma.router.delete({ where: { id: Number(req.params.id) } }); 
  res.json({ ok: true }); 
});

export default router;
