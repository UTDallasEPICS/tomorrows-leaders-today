import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.grant.deleteMany();
await prisma.$disconnect();
