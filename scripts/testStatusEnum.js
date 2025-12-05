import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'enum-test@example.com' },
    update: {},
    create: { id: 'enum-test', name: 'Enum Test', email: 'enum-test@example.com' }
  });
  const grant = await prisma.grant.findFirst({ where: { opportunityNumber: 'ENUM-1' } }) || await prisma.grant.create({ data: { opportunityNumber: 'ENUM-1', title: 'Enum Grant' } });
  // Ensure an Account exists for the accountId foreign key
  const account = await prisma.account.create({ data: { email: 'enum-account@example.com', accountId: 'acct-enum', providerId: 'local', userId: user.id } });
  const app = await prisma.grantApplication.create({ data: { grantId: grant.id, accountId: account.id, userId: user.id, status: 'IN_PROGRESS' } });
  console.log('created app:', app);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
