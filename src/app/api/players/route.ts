import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Position } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const position = searchParams.get('position') as Position | null;
  const search = searchParams.get('search') ?? undefined;

  const players = await prisma.player.findMany({
    where: {
      ...(position ? { position } : {}),
      ...(search ? { webName: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: { club: true },
    orderBy: { price: 'desc' },
  });

  return NextResponse.json({ players });
}
