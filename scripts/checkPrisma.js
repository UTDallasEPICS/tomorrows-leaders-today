import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Prisma client connected. Running simple queries...');
    const grants = await prisma.grant.findMany();
    console.log('grants count:', grants.length);
    const sessions = await prisma.session.findMany();
    console.log('sessions count:', sessions.length);
  } catch (e) {
    console.error('error running prisma checks:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
P
