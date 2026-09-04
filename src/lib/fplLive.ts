const FPL_BASE = 'https://fantasy.premierleague.com/api';

export interface FplLiveElement {
  id: number;
  stats: {
    total_points: number;
    minutes: number;
    goals_scored: number;
    assists: number;
  };
}

export interface FplLiveEvent {
  elements: FplLiveElement[];
}

/**
 * Pulls FPL's own computed per-player points for a gameweek - this already
 * includes bonus points, appearance points, and every other rule FPL applies,
 * so we don't need to reimplement their scoring formula ourselves.
 */
export async function fetchLiveEventData(fplEventId: number): Promise<FplLiveEvent> {
  const res = await fetch(`${FPL_BASE}/event/${fplEventId}/live/`, {
    // scores can change during live matches (goals, bonus points settling after
    // full time), so we cache briefly rather than for a long period like the
    // static bootstrap data
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`FPL live data request failed for event ${fplEventId}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
