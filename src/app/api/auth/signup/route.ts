import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

const BUDGET_DEFAULT = 1000; // £100.0m, tenths convention
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: Request) {
  const { email, password, teamName } = await req.json();

  if (!email || !password || !teamName) {
    return NextResponse.json({ error: 'Email, password, and team name are all required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      teamName: String(teamName).trim(),
      squad: {
        create: { budgetTotal: BUDGET_DEFAULT, budgetRemaining: BUDGET_DEFAULT },
      },
    },
  });

  const token = randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  try {
    await sendVerificationEmail(normalizedEmail, token);
  } catch (err) {
    // Account and token still exist even if the email send fails - the user
    // (or you, via the Resend dashboard) can retry via /api/auth/resend-verification.
    console.error('Failed to send verification email', err);
    return NextResponse.json(
      { ok: true, userId: user.id, emailWarning: 'Account created, but the verification email could not be sent.' },
      { status: 201 }
    );
  }

  return NextResponse.json({ ok: true, userId: user.id });
}

