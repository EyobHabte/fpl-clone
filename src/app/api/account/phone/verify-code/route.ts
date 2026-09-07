import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Enter the code we sent you' }, { status: 400 });

  const record = await prisma.phoneVerificationCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return NextResponse.json({ error: 'No pending verification. Request a new code.' }, { status: 400 });
  }
  if (record.expiresAt < new Date()) {
    await prisma.phoneVerificationCode.delete({ where: { id: record.id } });
    return NextResponse.json({ error: 'That code expired. Request a new one.' }, { status: 400 });
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.phoneVerificationCode.delete({ where: { id: record.id } });
    return NextResponse.json({ error: 'Too many incorrect attempts. Request a new code.' }, { status: 429 });
  }

  if (record.code !== String(code).trim()) {
    await prisma.phoneVerificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { phone: record.phone, phoneVerified: new Date() } }),
    prisma.phoneVerificationCode.deleteMany({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ ok: true, phone: record.phone });
}
