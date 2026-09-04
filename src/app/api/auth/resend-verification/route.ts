import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Always return a generic success message, whether or not the account exists -
  // this avoids leaking which emails are registered.
  const genericResponse = NextResponse.json({
    ok: true,
    message: 'If that account exists and needs verifying, a new email is on its way.',
  });

  if (!user || user.emailVerified) return genericResponse;

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  const token = randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  try {
    await sendVerificationEmail(normalizedEmail, token);
  } catch (err) {
    console.error('Failed to resend verification email', err);
  }

  return genericResponse;
}
