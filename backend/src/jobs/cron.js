import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { suspendClient } from '../lib/mikrotik.js';

export function startCron() {
  const expr = process.env.CRON_CUTOFF || '0 2 * * *';
  cron.schedule(expr, async () => {
    console.log('[cron] Corte automático...');
    const today = new Date();
    const clients = await prisma.client.findMany({ where: { status: 'active', auto_cutoff: true }, include: { router: true } });
    const eligible = clients.filter((c) => c.next_due_date && new Date(c.next_due_date) < today);
    for (const c of eligible) {
      try {
        if (c.router) await suspendClient(c.router, c);
        await prisma.client.update({ where: { id: c.id }, data: { status: 'suspended', suspended_at: new Date(), suspended_reason: 'Impago' } });
        await prisma.changeLog.create({ data: { client_id: c.id, client_name: c.full_name, change_type: 'suspend', description: 'Corte automático por impago', performed_by: 'cron' } });
      } catch (e) { console.error('[cron] error', c.id, e.message); }
    }
    console.log(`[cron] Cortados ${eligible.length} clientes.`);
  });
  console.log(`[cron] Programado: ${expr}`);
}