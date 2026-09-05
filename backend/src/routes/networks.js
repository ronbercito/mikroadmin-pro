const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../lib/auth'); // Ajusta según tu middleware de auth si aplica

// GET: Obtener todas las redes
router.get('/', async (req, res) => {
  try {
    const networks = await prisma.network.findMany({
      include: {
        router: true, // Incluye los datos del router si existe la relación en Prisma
      },
      orderBy: { id: 'asc' },
    });
    res.json(networks);
  } catch (error) {
    console.error('Error al obtener redes:', error);
    res.status(500).json({ error: 'Error al obtener las redes' });
  }
});

// POST: Crear una nueva red
router.post('/', async (req, res) => {
  try {
    const { name, router_id, network, cidr, type } = req.body;

    if (!name || !router_id || !network) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const newNetwork = await prisma.network.create({
      data: {
        name,
        router_id: parseInt(router_id, 10),
        network,
        cidr: parseInt(cidr || 24, 10),
        type: type || 'ESTÁTICO',
      },
    });

    res.status(201).json(newNetwork);
  } catch (error) {
    console.error('Error al crear red:', error);
    res.status(500).json({ error: 'Error al procesar en la base de datos' });
  }
});

// PUT: Actualizar una red
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, router_id, network, cidr, type } = req.body;

    const updatedNetwork = await prisma.network.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        router_id: parseInt(router_id, 10),
        network,
        cidr: parseInt(cidr, 10),
        type,
      },
    });

    res.json(updatedNetwork);
  } catch (error) {
    console.error('Error al actualizar red:', error);
    res.status(500).json({ error: 'Error al actualizar en la base de datos' });
  }
});

// DELETE: Eliminar una red
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.network.delete({
      where: { id: parseInt(id, 10) },
    });
    res.json({ message: 'Red eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar red:', error);
    res.status(500).json({ error: 'Error al eliminar la red' });
  }
});

module.exports = router;
