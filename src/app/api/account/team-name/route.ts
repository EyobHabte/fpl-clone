import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { teamName } = await req.json();
  const trimmed = String(teamName ?? '').trim();
  if (!trimmed) return NextResponse.json({ error: 'Team name cannot be empty' }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { teamName: trimmed } });
  return NextResponse.json({ ok: true });
}
