const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const grants = await prisma.grant.count();
    const users = await prisma.user.count();
    const changeLogs = await prisma.changeLog.count();
    console.log('grants', grants);
    console.log('users', users);
    console.log('changeLogs', changeLogs);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
