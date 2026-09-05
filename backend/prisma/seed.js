import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/auth.js';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@mikroadmin.local';
  const pwd = process.env.ADMIN_PASSWORD || 'admin123';
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hashPassword(pwd), full_name: 'Administrador', role: 'admin' },
  });
  console.log(`Admin listo: ${email} / ${pwd}`);
}
main().finally(() => prisma.$disconnect());