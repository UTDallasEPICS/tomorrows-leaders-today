import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Try to obtain the server session from NextAuth. We attempt to import
 * getServerSession dynamically so this file still works if NextAuth isn't
 * configured in the project. If unavailable, we'll fall back to a
 * system user.
 */
async function getSession(req: Request) {
  try {
    // Dynamic import to avoid hard dependency errors when NextAuth isn't set up
    const nextAuth = await import('next-auth');
    if (typeof nextAuth.getServerSession === 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - compat import shapes across NextAuth versions
      return await nextAuth.getServerSession();
    }
  } catch (err) {
    // ignore - we'll fall back to system user
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { grantId, newStatus } = await req.json();
    if (!grantId) return NextResponse.json({ error: 'missing grantId' }, { status: 400 });

    const grant = await prisma.grant.findUnique({ where: { id: Number(grantId) } });
    if (!grant) return NextResponse.json({ error: 'grant not found' }, { status: 404 });

    // Prefer authenticated server session user when available
    let session = await getSession(req as any);
    let user = null;

    if (session && session.user && session.user.email) {
      user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (!user) {
        user = await prisma.user.create({ data: { email: session.user.email, name: session.user.name ?? null } });
      }
    }

    // Fallback to a local system user for unauthenticated requests
    if (!user) {
      user = await prisma.user.findFirst({ where: { email: 'system@local' } });
      if (!user) {
        user = await prisma.user.create({ data: { email: 'system@local', name: 'System' } });
      }
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
