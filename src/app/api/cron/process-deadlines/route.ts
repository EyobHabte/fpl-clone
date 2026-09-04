import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncFromFpl } from '@/lib/fpl';
import { processGameweekDeadline } from '@/lib/gameweekDeadline';
import { scoreGameweek } from '@/lib/scoring';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Refresh deadlines/gameweek status from FPL first, in case anything shifted.
  try {
    await syncFromFpl();
  } catch (err) {
    console.error('Cron: FPL sync failed, continuing with existing data', err);
  }

  // Step 1: snapshot any squads whose deadline just passed, and open that
  // gameweek's league.
  const pendingDeadlines = await prisma.gameweek.findMany({
    where: { processedAt: null, deadline: { lte: new Date() } },
    orderBy: { deadline: 'asc' },
  });

  const processed = [];
  for (const gw of pendingDeadlines) {
    const result = await processGameweekDeadline(gw.id);
    processed.push({ gameweek: gw.name, ...result });
  }

  // Step 2: update live scores for any gameweek that's been snapshotted but
  // not yet finalized - this recomputes on every run, so scores update
  // continuously while matches are in progress and finalize once FPL marks
  // the gameweek finished.
  const toScore = await prisma.gameweek.findMany({
    where: { processedAt: { not: null }, scoredAt: null },
    orderBy: { deadline: 'asc' },
  });

  const scored = [];
  for (const gw of toScore) {
    try {
      const result = await scoreGameweek(gw.id);
      scored.push({ gameweek: gw.name, ...result });
    } catch (err) {
      console.error(`Cron: scoring failed for ${gw.name}`, err);
      scored.push({ gameweek: gw.name, ok: false, error: 'Scoring failed' });
    }
  }

  return NextResponse.json({ ok: true, processed, scored });
}
