import { prisma } from './prisma';

/**
 * True while there's a gameweek whose deadline has passed but hasn't been
 * processed yet (i.e. the deadline job hasn't caught up to it). Transfers
 * are locked during this (normally brief - a few minutes at most, bounded
 * by how often the cron job runs) window so a squad can't change between
 * the real deadline and the moment we snapshot it.
 */
export async function getLockedGameweek() {
  return prisma.gameweek.findFirst({
    where: { processedAt: null, deadline: { lte: new Date() } },
    orderBy: { deadline: 'asc' },
  });
}

/**
 * Snapshots every valid 15-man squad's current lineup into a GameweekSquad,
 * and opens that gameweek's League with an entry for each snapshotted user.
 * Safe to call more than once for the same gameweek - already-processed
 * gameweeks are skipped, and per-user upserts make re-running harmless.
 *
 * Each user's snapshot is its own small transaction rather than one giant
 * transaction wrapping every squad - looping many users inside a single
 * interactive transaction can exceed Prisma's default 5s transaction
 * timeout once there are more than a handful of squads, especially with
 * network latency to a remote database like Neon.
 */
export async function processGameweekDeadline(gameweekId: string) {
  const gameweek = await prisma.gameweek.findUnique({ where: { id: gameweekId } });
  if (!gameweek) return { ok: false, error: 'Gameweek not found' };
  if (gameweek.processedAt) return { ok: true, skipped: true, reason: 'already processed' };

  const squads = await prisma.squad.findMany({ include: { players: true } });

  const league = await prisma.league.upsert({
    where: { gameweekId: gameweek.id },
    update: {},
    create: { gameweekId: gameweek.id, name: `${gameweek.name} League` },
  });

  let snapshotted = 0;
  let skippedIncomplete = 0;

  for (const squad of squads) {
    const starting = squad.players.filter((p) => p.benchOrder === null);
    const hasCaptain = squad.players.some((p) => p.isCaptain);
    const hasViceCaptain = squad.players.some((p) => p.isViceCaptain);
    const isValidLineup = squad.players.length === 15 && starting.length === 11 && hasCaptain && hasViceCaptain;

    if (!isValidLineup) {
      skippedIncomplete++;
      continue; // no saved lineup this week - sits out rather than blocking everyone else
    }

    const gwSquad = await prisma.gameweekSquad.upsert({
      where: { userId_gameweekId: { userId: squad.userId, gameweekId: gameweek.id } },
      update: {},
      create: { userId: squad.userId, gameweekId: gameweek.id },
    });

    await prisma.$transaction([
      // clear any stale rows from a previous run before re-inserting (keeps this idempotent)
      prisma.gameweekSquadPlayer.deleteMany({ where: { gameweekSquadId: gwSquad.id } }),
      prisma.gameweekSquadPlayer.createMany({
        data: squad.players.map((p) => ({
          gameweekSquadId: gwSquad.id,
          playerId: p.playerId,
          isCaptain: p.isCaptain,
          isViceCaptain: p.isViceCaptain,
          benchOrder: p.benchOrder,
        })),
      }),
      prisma.leagueEntry.upsert({
        where: { leagueId_userId: { leagueId: league.id, userId: squad.userId } },
        update: {},
        create: { leagueId: league.id, userId: squad.userId, points: 0 },
      }),
    ]);

    snapshotted++;
  }

  await prisma.gameweek.update({ where: { id: gameweek.id }, data: { processedAt: new Date() } });

  return { ok: true, snapshotted, skippedIncomplete };
}
