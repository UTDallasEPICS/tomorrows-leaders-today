import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { grantId, newStatus } = await req.json();
    if (!grantId) return NextResponse.json({ error: 'missing grantId' }, { status: 400 });

    const grant = await prisma.grant.findUnique({ where: { id: Number(grantId) } });
    if (!grant) return NextResponse.json({ error: 'grant not found' }, { status: 404 });

    // For now, use a system user if no session is available. You can replace this with session user.
    let user = await prisma.user.findFirst({ where: { email: 'system@local' } });
    if (!user) {
      user = await prisma.user.create({ data: { email: 'system@local', name: 'System' } });
    }

    const updated = await prisma.grant.update({ where: { id: Number(grantId) }, data: { status: newStatus } });

    await prisma.changeLog.create({ data: { grantId: updated.id, userId: user.id, originalStatus: grant.status ?? null, newStatus } });

    return NextResponse.json({ success: true, grant: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
