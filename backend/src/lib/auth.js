import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function hashPassword(p) { return bcrypt.hashSync(p, 10); }
export function comparePassword(p, hash) { return bcrypt.compareSync(p, hash); }

export function signToken(user, secret, exp) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: exp });
}

export function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Token inválido' }); }
}

export function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Requiere admin' });
  next();
}