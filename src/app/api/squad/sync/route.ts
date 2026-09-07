import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getLockedGameweek } from '@/lib/gameweekDeadline';
export const dynamic = 'force-dynamic';

const SQUAD_SIZE = 15;
const POSITION_LIMITS: Record<string, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const MAX_PER_CLUB = 3;

// body: { playerIds: number[] } - the FULL desired squad membership
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

  const { playerIds } = (await req.json()) as { playerIds: number[] };

  if (!Array.isArray(playerIds) || new Set(playerIds).size !== playerIds.length) {
    return NextResponse.json({ error: 'Invalid player list' }, { status: 400 });
  }
  if (playerIds.length !== SQUAD_SIZE) {
    return NextResponse.json({ error: `Squad must have exactly ${SQUAD_SIZE} players to save` }, { status: 400 });
  }

  const squad = await prisma.squad.findUnique({
    where: { userId: user.id },
    include: { players: true },
  });
  if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 });

  const targetPlayers = await prisma.player.findMany({ where: { id: { in: playerIds } } });
  if (targetPlayers.length !== playerIds.length) {
    return NextResponse.json({ error: 'One or more players could not be found' }, { status: 400 });
  }

  // Squad-shape validation
  (['GK', 'DEF', 'MID', 'FWD'] as const).forEach(() => {});
  for (const pos of Object.keys(POSITION_LIMITS)) {
    const count = targetPlayers.filter((p) => p.position === pos).length;
    if (count > POSITION_LIMITS[pos]) {
      return NextResponse.json({ error: `Too many ${pos} players (max ${POSITION_LIMITS[pos]})` }, { status: 400 });
    }
  }
  const clubCounts = new Map<number, number>();
  for (const p of targetPlayers) {
    clubCounts.set(p.clubId, (clubCounts.get(p.clubId) ?? 0) + 1);
  }
  for (const [, count] of clubCounts) {
    if (count > MAX_PER_CLUB) {
      return NextResponse.json({ error: `Max ${MAX_PER_CLUB} players from the same club` }, { status: 400 });
    }
  }

  const totalCost = targetPlayers.reduce((sum, p) => sum + p.price, 0);
  if (totalCost > squad.budgetTotal) {
    return NextResponse.json({ error: 'This squad exceeds your budget' }, { status: 400 });
  }

  const currentIds = new Set(squad.players.map((sp) => sp.playerId));
  const targetIds = new Set(playerIds);
  const toRemove = squad.players.filter((sp) => !targetIds.has(sp.playerId));
  const toAdd = targetPlayers.filter((p) => !currentIds.has(p.id));

  await prisma.$transaction([
    ...toRemove.map((sp) => prisma.squadPlayer.delete({ where: { id: sp.id } })),
    ...toAdd.map((p) =>
      prisma.squadPlayer.create({ data: { squadId: squad.id, playerId: p.id, purchasePrice: p.price } })
    ),
    prisma.squad.update({
      where: { id: squad.id },
      data: { budgetRemaining: squad.budgetTotal - totalCost },
    }),
  ]);

  return NextResponse.json({ ok: true, budgetRemaining: squad.budgetTotal - totalCost });
}
