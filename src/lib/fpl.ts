import { prisma } from './prisma';
import { Position } from '@prisma/client';

const FPL_BASE = 'https://fantasy.premierleague.com/api';

const POSITION_MAP: Record<number, Position> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export interface FplBootstrap {
  events: Array<{
    id: number;
    name: string;
    deadline_time: string;
    is_current: boolean;
    finished: boolean;
  }>;
  teams: Array<{ id: number; code: number; name: string; short_name: string }>;
  elements: Array<{
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    element_type: number;
    team: number;
    now_cost: number; // already in tenths, e.g. 105 = £10.5m
    total_points: number;
    form: string;
    points_per_game: string;
    selected_by_percent: string;
    code: number;
  }>;
}

/** Pull the full player/team/gameweek dataset from the official, public FPL API. */
export async function fetchBootstrap(): Promise<FplBootstrap> {
  const res = await fetch(`${FPL_BASE}/bootstrap-static/`, {
    // FPL's API is public but occasionally rate-limits aggressive polling
    next: { revalidate: 60 * 30 }, // cache 30 min
  });
  if (!res.ok) {
    throw new Error(`FPL API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Upsert clubs, players, and gameweeks into our DB from live FPL data. */
export async function syncFromFpl() {
  const data = await fetchBootstrap();

  await prisma.$transaction([
    ...data.teams.map((t) =>
      prisma.club.upsert({
        where: { id: t.id },
        update: { name: t.name, shortName: t.short_name, code: t.code },
        create: { id: t.id, name: t.name, shortName: t.short_name, code: t.code },
      })
    ),
  ]);

  await prisma.$transaction([
    ...data.elements.map((p) =>
      prisma.player.upsert({
        where: { id: p.id },
        update: {
          firstName: p.first_name,
          secondName: p.second_name,
          webName: p.web_name,
          position: POSITION_MAP[p.element_type],
          price: p.now_cost,
          clubId: p.team,
          totalPoints: p.total_points,
          form: parseFloat(p.form) || 0,
          pointsPerGame: parseFloat(p.points_per_game) || 0,
          selectedByPercent: parseFloat(p.selected_by_percent) || 0,
          photoCode: String(p.code),
        },
        create: {
          id: p.id,
          firstName: p.first_name,
          secondName: p.second_name,
          webName: p.web_name,
          position: POSITION_MAP[p.element_type],
          price: p.now_cost,
          clubId: p.team,
          totalPoints: p.total_points,
          form: parseFloat(p.form) || 0,
          pointsPerGame: parseFloat(p.points_per_game) || 0,
          selectedByPercent: parseFloat(p.selected_by_percent) || 0,
          photoCode: String(p.code),
        },
      })
    ),
  ]);

  await prisma.$transaction([
    ...data.events.map((e) =>
      prisma.gameweek.upsert({
        where: { fplEventId: e.id },
        update: {
          name: e.name,
          deadline: new Date(e.deadline_time),
          isActive: e.is_current,
          isFinished: e.finished,
        },
        create: {
          fplEventId: e.id,
          name: e.name,
          deadline: new Date(e.deadline_time),
          isActive: e.is_current,
          isFinished: e.finished,
        },
      })
    ),
  ]);

  return {
    clubs: data.teams.length,
    players: data.elements.length,
    gameweeks: data.events.length,
  };
}

/** Build the official shirt/photo image URL FPL itself uses. */
export { playerPhotoUrl } from './playerPhoto';
