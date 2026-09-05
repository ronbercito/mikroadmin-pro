import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authRequired } from '../lib/auth.js';

const router = Router();
router.use(authRequired);

// Obtener todos los routers
router.get('/', async (req, res) => {
  try {
    const routers = await prisma.router.findMany({ orderBy: { id: 'asc' } });
    res.json(routers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un router por ID
router.get('/:id', async (req, res) => {
  try {
    const r = await prisma.router.findUnique({ where: { id: Number(req.params.id) } });
    if (!r) return res.status(404).json({ error: 'No encontrado' });
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener logs del router
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

// Crear un router (Limpia y castea req.body para Prisma)
router.post('/', async (req, res) => {
  try {
    const { name, router_type, host, api_port, use_tls, username, password, location } = req.body;
    
    const newRouter = await prisma.router.create({
      data: {
        name,
        router_type: router_type || 'MikroTik',
        host,
        api_port: Number(api_port) || 8728,
        use_tls: Boolean(use_tls),
        username,
        password, // Guarda la contraseña limpia tal como la escribes
        location: location || '',
        status: 'unknown'
      }
    });

    res.json(newRouter);
  } catch (error) {
    console.error('Error al crear router:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar router (Asegura actualización real de credenciales y tipos)
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;

    // Sanitización y Mapeo explícito para evitar fallos de Prisma con req.body directo
    const updatedData = {
      ...(b.name !== undefined && { name: String(b.name) }),
      ...(b.router_type !== undefined && { router_type: String(b.router_type) }),
      ...(b.host !== undefined && { host: String(b.host).trim() }),
      ...(b.api_port !== undefined && { api_port: Number(b.api_port) }),
      ...(b.use_tls !== undefined && { use_tls: Boolean(b.use_tls) }),
      ...(b.username !== undefined && { username: String(b.username).trim() }),
      ...(b.password !== undefined && { password: String(b.password) }), // Mantiene la clave sin alteraciones
      ...(b.location !== undefined && { location: String(b.location) }),
      ...(b.security !== undefined && { security: String(b.security) }),
      ...(b.security_alt !== undefined && { security_alt: String(b.security_alt) }),
      ...(b.traffic_logging !== undefined && { traffic_logging: String(b.traffic_logging) }),
      ...(b.traffic_flow_target !== undefined && { traffic_flow_target: String(b.traffic_flow_target) }),
      ...(b.traffic_flow_interface !== undefined && { traffic_flow_interface: String(b.traffic_flow_interface) }),
      ...(b.speed_control !== undefined && { speed_control: String(b.speed_control) }),
      ...(b.save_visited_ips !== undefined && { save_visited_ips: Boolean(b.save_visited_ips) }),
      ...(b.notes !== undefined && { notes: String(b.notes) }),
    };

    const updatedRouter = await prisma.router.update({
      where: { id },
      data: updatedData,
    });

    res.json(updatedRouter);
  } catch (error) {
    console.error('Error al actualizar router:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar router
router.delete('/:id', async (req, res) => {
  try {
    await prisma.router.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
