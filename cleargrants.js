import { prisma } from "@/library/db";
await prisma.grant.deleteMany();
await prisma.$disconnect();
