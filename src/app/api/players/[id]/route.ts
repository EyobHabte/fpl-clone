export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const player = await prisma.player.findUnique({
    where: { id: Number(params.id) },
    include: { club: true },
  });
  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ player });
}
