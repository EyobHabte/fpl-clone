export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;

  if (!token) {
    return NextResponse.redirect(`${base}/login?verified=0`);
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return NextResponse.redirect(`${base}/login?verified=0`);
  }

  // Idempotent: some email clients and security scanners silently pre-fetch
  // links before the person actually clicks them, which would otherwise
  // consume the token and make the real click show a false "expired" error.
  // If this link already succeeded once, treat repeat visits as success too.
  if (record.usedAt || record.user.emailVerified) {
    return NextResponse.redirect(`${base}/login?verified=1`);
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.redirect(`${base}/login?verified=0`);
  }

  // Atomically claim this token so two near-simultaneous requests (the
  // scanner + the real click) can't both think they were first.
  const claim = await prisma.emailVerificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (claim.count === 1) {
    await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } });
  }

  return NextResponse.redirect(`${base}/login?verified=1`);
}
