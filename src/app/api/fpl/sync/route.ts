export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { syncFromFpl } from '@/lib/fpl';

// Trigger with: GET /api/fpl/sync
// Wire this to a scheduled job (e.g. Vercel Cron, hourly) so prices/points stay current.
export async function GET() {
  try {
    const result = await syncFromFpl();
    return NextResponse.json({ ok: true, synced: result });
  } catch (err) {
    console.error('FPL sync failed', err);
    return NextResponse.json({ ok: false, error: 'Sync failed' }, { status: 500 });
  }
}
