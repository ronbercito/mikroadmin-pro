import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword, signToken, authRequired } from '../lib/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !comparePassword(password, user.password))
    return res.status(401).json({ error: 'Credenciales inválidas' });
  const access = signToken(user, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '8h');
  const refresh = signToken(user, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN || '7d');
  res.json({ access_token: access, refresh_token: refresh, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
});

router.get('/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'No encontrado' });
  res.json({ id: user.id, email: user.email, role: user.role, full_name: user.full_name });
});

export default router;