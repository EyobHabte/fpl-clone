export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getLockedGameweek } from '@/lib/gameweekDeadline';

const SQUAD_SIZE = 15;
const POSITION_LIMITS: Record<string, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const MAX_PER_CLUB = 3;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const squad = await prisma.squad.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { teamName: true } },
      players: { include: { player: { include: { club: true } } } },
    },
  });
  return NextResponse.json({ squad });
}

// body: { action: 'add' | 'remove', playerId: number }
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const locked = await getLockedGameweek();
  if (locked) {
    return NextResponse.json(
      { error: `Transfers are briefly locked while we process the ${locked.name} deadline — try again in a few minutes.` },
      { status: 423 }
    );
  }

  const { action, playerId } = await req.json();

  const squad = await prisma.squad.findUnique({
    where: { userId: user.id },
    include: { players: { include: { player: true } } },
  });
  if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 });

  if (action === 'remove') {
    const entry = squad.players.find((p) => p.playerId === playerId);
    if (!entry) return NextResponse.json({ error: 'Player not in squad' }, { status: 400 });

    await prisma.$transaction([
      prisma.squadPlayer.delete({ where: { id: entry.id } }),
      prisma.squad.update({
        where: { id: squad.id },
        data: { budgetRemaining: { increment: entry.purchasePrice } },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === 'add') {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    if (squad.players.length >= SQUAD_SIZE) {
      return NextResponse.json({ error: `Squad is full (${SQUAD_SIZE} players)` }, { status: 400 });
    }
    if (squad.players.some((p) => p.playerId === playerId)) {
      return NextResponse.json({ error: 'Player already in squad' }, { status: 400 });
    }
    if (player.price > squad.budgetRemaining) {
      return NextResponse.json({ error: 'Not enough budget for this transfer' }, { status: 400 });
    }

    const positionCount = squad.players.filter((p) => p.player.position === player.position).length;
    if (positionCount >= POSITION_LIMITS[player.position]) {
      return NextResponse.json(
        { error: `You can only have ${POSITION_LIMITS[player.position]} ${player.position} players` },
        { status: 400 }
      );
    }

    const clubCount = squad.players.filter((p) => p.player.clubId === player.clubId).length;
    if (clubCount >= MAX_PER_CLUB) {
      return NextResponse.json({ error: `Max ${MAX_PER_CLUB} players from the same club` }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.squadPlayer.create({
        data: { squadId: squad.id, playerId: player.id, purchasePrice: player.price },
      }),
      prisma.squad.update({
        where: { id: squad.id },
        data: { budgetRemaining: { decrement: player.price } },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
