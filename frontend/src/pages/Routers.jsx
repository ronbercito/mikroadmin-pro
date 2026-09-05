import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../lib/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    const routers = await prisma.router.findMany({ orderBy: { id: 'asc' } });
    res.json(routers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
    if (!r) return res.status(404).json({ error: 'No encontrado' });
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await prisma.changeLog.findMany({
      where: { router_id: Number(req.params.id) },
      orderBy: { id: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear Router - Asegurando limpieza de datos
router.post('/', async (req, res) => {
  try {
    const { name, host, api_port, use_tls, username, password, location, notes, speed_control } = req.body;
    
    console.log(`[Router Post] Intentando registrar router ${host} con usuario ${username}`);

    const nuevoRouter = await prisma.router.create({
      data: {
        name,
        host,
        api_port: Number(api_port) || 8728,
        use_tls: Boolean(use_tls),
        username,
        password, // Asegúrate de que llegue en texto plano para que el cliente de RouterOS pueda usarla
        location,
        notes,
        speed_control: speed_control || 'simple_queues'
      }
    });

    res.json(nuevoRouter);
  } catch (error) {
    console.error("Error al crear router:", error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar Router - Clave para no sobreescribir la contraseña con espacios o vacíos
router.put('/:id', async (req, res) => {
  try {
    const routerId = Number(req.params.id);
    const { password, ...restData } = req.body;
    
    const updateData = { ...restData };
    if (restData.api_port) updateData.api_port = Number(restData.api_port);

    // Solo actualizamos la contraseña si el usuario escribió una nueva y no está vacía
    if (password && typeof password === 'string' && password.trim() !== '' && !password.includes('***')) {
      updateData.password = password;
    }

    const routerActualizado = await prisma.router.update({
      where: { id: routerId },
      data: updateData,
    });

    res.json(routerActualizado);
  } catch (error) {
    console.error("Error al actualizar router:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => { 
  try {
    await prisma.router.delete({ where: { id: Number(req.params.id) } }); 
    res.json({ ok: true }); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
