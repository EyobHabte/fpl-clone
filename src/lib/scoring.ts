import { prisma } from './prisma';
import { fetchLiveEventData } from './fplLive';

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

const POSITION_LIMITS: Record<Position, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

interface SquadPlayerForScoring {
  playerId: number;
  position: Position;
  benchOrder: number | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

/**
 * Mirrors FPL's bench auto-substitution: any starter with 0 minutes gets
 * swapped for the highest-priority bench player (by benchOrder) who did
 * play, as long as the swap keeps the formation valid (1 GK, 3-5 DEF,
 * 2-5 MID, 1-3 FWD). Returns the resulting 11 "effective" starters used
 * for scoring - the originally saved lineup itself is left untouched.
 */
function computeEffectiveStarters(
  players: SquadPlayerForScoring[],
  minutesByPlayer: Map<number, number>
): SquadPlayerForScoring[] {
  const starters = players.filter((p) => p.benchOrder === null);
  const bench = [...players]
    .filter((p) => p.benchOrder !== null)
    .sort((a, b) => (a.benchOrder ?? 0) - (b.benchOrder ?? 0));

  const effective = [...starters];
  const usedBenchIds = new Set<number>();

  for (const starter of starters) {
    const played = (minutesByPlayer.get(starter.playerId) ?? 0) > 0;
    if (played) continue;

    for (const sub of bench) {
      if (usedBenchIds.has(sub.playerId)) continue;
      const subPlayed = (minutesByPlayer.get(sub.playerId) ?? 0) > 0;
      if (!subPlayed) continue;

      const trial = effective.map((p) => (p.playerId === starter.playerId ? sub : p));
      const counts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      trial.forEach((p) => {
        counts[p.position]++;
      });
      const valid = (Object.keys(POSITION_LIMITS) as Position[]).every(
        (pos) => counts[pos] >= POSITION_LIMITS[pos].min && counts[pos] <= POSITION_LIMITS[pos].max
      );
      if (!valid) continue;

      const idx = effective.findIndex((p) => p.playerId === starter.playerId);
      effective[idx] = sub;
      usedBenchIds.add(sub.playerId);
      break;
    }
  }

  return effective;
}

/**
 * Pulls live FPL points for a gameweek, applies them to every snapshotted
 * squad (captain doubling with vice-captain fallback + bench auto-subs),
 * and updates that gameweek's league table. Safe to call repeatedly while
 * a gameweek is in progress - each run just recomputes from the latest
 * live data. Only marks the gameweek as finally "scored" once FPL itself
 * reports the gameweek finished.
 */
export async function scoreGameweek(gameweekId: string) {
  const gameweek = await prisma.gameweek.findUnique({ where: { id: gameweekId } });
  if (!gameweek) return { ok: false, error: 'Gameweek not found' };
  if (!gameweek.processedAt) {
    return { ok: false, error: 'Gameweek has not been processed yet (no squads snapshotted)' };
  }

  const live = await fetchLiveEventData(gameweek.fplEventId);

  const pointsByPlayer = new Map<number, number>();
  const minutesByPlayer = new Map<number, number>();
  live.elements.forEach((el) => {
    pointsByPlayer.set(el.id, el.stats.total_points ?? 0);
    minutesByPlayer.set(el.id, el.stats.minutes ?? 0);
  });

  const knownPlayerIds = new Set((await prisma.player.findMany({ select: { id: true } })).map((p) => p.id));
  for (const el of live.elements) {
    if (!knownPlayerIds.has(el.id)) continue;
    await prisma.playerGameweekStat.upsert({
      where: { playerId_gameweekId: { playerId: el.id, gameweekId: gameweek.id } },
      update: {
        points: el.stats.total_points ?? 0,
        minutes: el.stats.minutes ?? 0,
        goals: el.stats.goals_scored ?? 0,
        assists: el.stats.assists ?? 0,
      },
      create: {
        playerId: el.id,
        gameweekId: gameweek.id,
        points: el.stats.total_points ?? 0,
        minutes: el.stats.minutes ?? 0,
        goals: el.stats.goals_scored ?? 0,
        assists: el.stats.assists ?? 0,
      },
    });
  }

  const league = await prisma.league.findUnique({ where: { gameweekId: gameweek.id } });

  const gwSquads = await prisma.gameweekSquad.findMany({
    where: { gameweekId: gameweek.id },
    include: { players: { include: { player: { select: { position: true } } } } },
  });

  let scored = 0;

  for (const gwSquad of gwSquads) {
    const players: SquadPlayerForScoring[] = gwSquad.players.map((p) => ({
      playerId: p.playerId,
      position: p.player.position as Position,
      benchOrder: p.benchOrder,
      isCaptain: p.isCaptain,
      isViceCaptain: p.isViceCaptain,
    }));

    const effectiveStarters = computeEffectiveStarters(players, minutesByPlayer);
    const basePoints = effectiveStarters.reduce((sum, p) => sum + (pointsByPlayer.get(p.playerId) ?? 0), 0);

    const captain = players.find((p) => p.isCaptain);
    const viceCaptain = players.find((p) => p.isViceCaptain);
    const captainPlayed = captain ? (minutesByPlayer.get(captain.playerId) ?? 0) > 0 : false;
    const viceInEffective = viceCaptain ? effectiveStarters.some((p) => p.playerId === viceCaptain.playerId) : false;
    const vicePlayed = viceCaptain ? (minutesByPlayer.get(viceCaptain.playerId) ?? 0) > 0 : false;

    // Captain's points are doubled if they played. If they didn't, the
    // armband effectively passes to the vice-captain (only if the vice
    // is among the effective starters and also played).
    let bonus = 0;
    if (captain && captainPlayed) {
      bonus = pointsByPlayer.get(captain.playerId) ?? 0;
    } else if (viceCaptain && viceInEffective && vicePlayed) {
      bonus = pointsByPlayer.get(viceCaptain.playerId) ?? 0;
    }

    const total = basePoints + bonus;

    await prisma.$transaction([
      ...gwSquad.players.map((p) =>
        prisma.gameweekSquadPlayer.update({
          where: { id: p.id },
          data: { pointsScored: pointsByPlayer.get(p.playerId) ?? 0 },
        })
      ),
      prisma.gameweekSquad.update({ where: { id: gwSquad.id }, data: { totalPoints: total } }),
      ...(league
        ? [
            prisma.leagueEntry.upsert({
              where: { leagueId_userId: { leagueId: league.id, userId: gwSquad.userId } },
              update: { points: total },
              create: { leagueId: league.id, userId: gwSquad.userId, points: total },
            }),
          ]
        : []),
    ]);

    scored++;
  }

  if (league) {
    const entries = await prisma.leagueEntry.findMany({
      where: { leagueId: league.id },
      orderBy: { points: 'desc' },
    });
    await prisma.$transaction(
      entries.map((entry, i) => prisma.leagueEntry.update({ where: { id: entry.id }, data: { rank: i + 1 } }))
    );
  }

  if (gameweek.isFinished) {
    await prisma.gameweek.update({ where: { id: gameweek.id }, data: { scoredAt: new Date() } });
  }

  return { ok: true, scored, finalized: gameweek.isFinished };
}
