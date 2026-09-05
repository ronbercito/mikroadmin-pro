import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import routerRoutes from './routes/routers.js';
import clientRoutes from './routes/clients.js';
import billingRoutes from './routes/billing.js';
import syncRoutes from './routes/sync.js';
import cutoffRoutes from './routes/cutoff.js';
import { startCron } from './jobs/cron.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/routers', routerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/cutoff', cutoffRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => { console.log(`API MikroAdmin en http://localhost:${PORT}`); startCron(); });