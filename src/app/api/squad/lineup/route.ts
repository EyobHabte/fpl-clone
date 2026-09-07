import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { validateLineup, LineupPlayer } from '@/lib/formation';
import { getLockedGameweek } from '@/lib/gameweekDeadline';
export const dynamic = 'force-dynamic';

// body: { players: LineupPlayer[] }  -- must cover all 15 squad players
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const locked = await getLockedGameweek();
  if (locked) {
    return NextResponse.json(
      { error: `Your lineup is briefly locked while we process the ${locked.name} deadline — try again in a few minutes.` },
      { status: 423 }
    );
  }

  const { players } = (await req.json()) as { players: LineupPlayer[] };

  const squad = await prisma.squad.findUnique({
    where: { userId: user.id },
    include: { players: { include: { player: true } } },
  });
  if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 });

  if (players.length !== squad.players.length) {
    return NextResponse.json({ error: 'Lineup must include every player in your squad' }, { status: 400 });
  }

  const squadPlayerIds = new Set(squad.players.map((sp) => sp.playerId));
  for (const p of players) {
    if (!squadPlayerIds.has(p.playerId)) {
      return NextResponse.json({ error: `Player ${p.playerId} is not in your squad` }, { status: 400 });
    }
  }

  const { valid, errors } = validateLineup(players);
  if (!valid) {
    return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
  }

  await prisma.$transaction(
    players.map((p) => {
      const squadPlayer = squad.players.find((sp) => sp.playerId === p.playerId)!;
      return prisma.squadPlayer.update({
        where: { id: squadPlayer.id },
        data: {
          benchOrder: p.benchOrder,
          isCaptain: p.isCaptain,
          isViceCaptain: p.isViceCaptain,
        },
      });
    })
  );

  return NextResponse.json({ ok: true });
}
