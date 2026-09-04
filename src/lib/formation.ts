export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface LineupPlayer {
  playerId: number;
  position: Position;
  benchOrder: number | null; // null = starting XI, 0-3 = bench slot
  isCaptain: boolean;
  isViceCaptain: boolean;
}

const STARTING_SIZE = 11;
const BENCH_SIZE = 4;

// Standard FPL formation limits for the starting XI's outfield players
const OUTFIELD_LIMITS: Record<'DEF' | 'MID' | 'FWD', { min: number; max: number }> = {
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

export function validateLineup(players: LineupPlayer[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const starting = players.filter((p) => p.benchOrder === null);
  const bench = players.filter((p) => p.benchOrder !== null);

  if (starting.length !== STARTING_SIZE) {
    errors.push(`Starting XI must have exactly ${STARTING_SIZE} players (currently ${starting.length}).`);
  }
  if (bench.length !== BENCH_SIZE) {
    errors.push(`Bench must have exactly ${BENCH_SIZE} players (currently ${bench.length}).`);
  }

  const benchOrders = bench.map((p) => p.benchOrder);
  const uniqueBenchOrders = new Set(benchOrders);
  if (uniqueBenchOrders.size !== benchOrders.length) {
    errors.push('Each bench slot (0-3) can only be used once.');
  }

  const startingGks = starting.filter((p) => p.position === 'GK').length;
  if (startingGks !== 1) {
    errors.push(`Starting XI must have exactly 1 goalkeeper (currently ${startingGks}).`);
  }

  (['DEF', 'MID', 'FWD'] as const).forEach((pos) => {
    const count = starting.filter((p) => p.position === pos).length;
    const { min, max } = OUTFIELD_LIMITS[pos];
    if (count < min || count > max) {
      errors.push(`Starting XI needs between ${min}-${max} ${pos} players (currently ${count}).`);
    }
  });

  const captains = players.filter((p) => p.isCaptain);
  const viceCaptains = players.filter((p) => p.isViceCaptain);

  if (captains.length !== 1) {
    errors.push('Exactly one player must be set as captain.');
  } else if (captains[0].benchOrder !== null) {
    errors.push('The captain must be in the starting XI.');
  }

  if (viceCaptains.length !== 1) {
    errors.push('Exactly one player must be set as vice-captain.');
  } else if (viceCaptains[0].benchOrder !== null) {
    errors.push('The vice-captain must be in the starting XI.');
  }

  if (captains.length === 1 && viceCaptains.length === 1 && captains[0].playerId === viceCaptains[0].playerId) {
    errors.push('Captain and vice-captain must be different players.');
  }

  return { valid: errors.length === 0, errors };
}
