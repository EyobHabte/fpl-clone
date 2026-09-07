import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendSms, normalizeEthiopianPhone } from '@/lib/sms';
export const dynamic = 'force-dynamic';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { phone } = await req.json();
  const normalized = normalizeEthiopianPhone(String(phone ?? ''));
  if (!normalized) {
    return NextResponse.json(
      { error: 'Enter a valid Ethiopian mobile number, e.g. 09XXXXXXXX or +2519XXXXXXXX' },
      { status: 400 }
    );
  }

  const existingOwner = await prisma.user.findFirst({
    where: { phone: normalized, phoneVerified: { not: null }, NOT: { id: user.id } },
  });
  if (existingOwner) {
    return NextResponse.json({ error: 'That phone number is already verified on another account' }, { status: 409 });
  }

  const recent = await prisma.phoneVerificationCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return NextResponse.json({ error: 'Please wait a moment before requesting another code.' }, { status: 429 });
  }

  await prisma.phoneVerificationCode.deleteMany({ where: { userId: user.id } });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.phoneVerificationCode.create({
    data: { userId: user.id, phone: normalized, code, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  try {
    await sendSms(normalized, `Your Weekly Fantasy verification code is ${code}. It expires in 10 minutes.`);
  } catch (err) {
    console.error('Failed to send SMS verification code', err);
    return NextResponse.json({ error: 'Could not send the SMS. Please try again shortly.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
