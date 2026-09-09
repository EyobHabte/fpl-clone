export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface AutoPickInput {
  playerId: number;
  position: Position;
  totalPoints: number;
}

export interface AutoPickAssignment {
  playerId: number;
  benchOrder: number | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

const POSITION_LIMITS: Record<Position, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

/**
 * Picks a valid starting XI (+ bench order, captain, vice-captain) from a
 * 15-man squad, favoring total points while respecting FPL's formation
 * limits (1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD). Returns null if the input isn't
 * a complete 15-man squad - there's nothing sensible to auto-pick yet.
 */
export function computeAutoPick(players: AutoPickInput[]): AutoPickAssignment[] | null {
  if (players.length !== 15) return null;

  const byPosition: Record<Position, AutoPickInput[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  players.forEach((p) => byPosition[p.position].push(p));
  if (byPosition.GK.length !== 2 || byPosition.DEF.length !== 5 || byPosition.MID.length !== 5 || byPosition.FWD.length !== 3) {
    return null; // not a standard squad shape - nothing safe to auto-pick
  }
  (Object.keys(byPosition) as Position[]).forEach((pos) =>
    byPosition[pos].sort((a, b) => b.totalPoints - a.totalPoints)
  );

  const startingIds = new Set<number>();
  startingIds.add(byPosition.GK[0].playerId);

  (['DEF', 'MID', 'FWD'] as const).forEach((pos) => {
    byPosition[pos].slice(0, POSITION_LIMITS[pos].min).forEach((p) => startingIds.add(p.playerId));
  });

  const outfieldPool = [...byPosition.DEF, ...byPosition.MID, ...byPosition.FWD]
    .filter((p) => !startingIds.has(p.playerId))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  let outfieldStartingCount = startingIds.size - 1; // minus the GK
  for (const p of outfieldPool) {
    if (outfieldStartingCount >= 10) break;
    const currentCount = players.filter((row) => startingIds.has(row.playerId) && row.position === p.position).length;
    if (currentCount >= POSITION_LIMITS[p.position].max) continue;
    startingIds.add(p.playerId);
    outfieldStartingCount++;
  }

  const reserveGk = byPosition.GK[1];
  const reserveOutfield = [...byPosition.DEF, ...byPosition.MID, ...byPosition.FWD]
    .filter((p) => !startingIds.has(p.playerId))
    .sort((a, b) => b.totalPoints - a.totalPoints);
  const benchOrdered = [reserveGk, ...reserveOutfield];

  const startingSortedByPoints = players
    .filter((p) => startingIds.has(p.playerId))
    .sort((a, b) => b.totalPoints - a.totalPoints);
  const captainId = startingSortedByPoints[0]?.playerId;
  const viceId = startingSortedByPoints[1]?.playerId;

  return players.map((p) => {
    if (startingIds.has(p.playerId)) {
      return {
        playerId: p.playerId,
        benchOrder: null,
        isCaptain: p.playerId === captainId,
        isViceCaptain: p.playerId === viceId,
      };
    }
    const benchIdx = benchOrdered.findIndex((b) => b.playerId === p.playerId);
    return { playerId: p.playerId, benchOrder: benchIdx, isCaptain: false, isViceCaptain: false };
  });
}