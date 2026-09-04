import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function LeaguesPage() {
  // The most recently processed gameweek is our own source of truth for
  // "which league is current" - more reliable than FPL's isActive flag,
  // which reflects their live-match window rather than our deadline job.
  const currentGameweek = await prisma.gameweek.findFirst({
    where: { processedAt: { not: null } },
    orderBy: { deadline: 'desc' },
  });

  const league = currentGameweek
    ? await prisma.league.findUnique({
        where: { gameweekId: currentGameweek.id },
        include: { entries: { include: { user: true }, orderBy: { points: 'desc' } } },
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-extrabold text-fpl-purple mb-1">
        {currentGameweek ? currentGameweek.name : 'This Week'} League
      </h1>
      <p className="text-sm text-slate-500 mb-4">
        A brand new leaderboard every gameweek — everyone starts level.
      </p>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-12 bg-fpl-purple text-white text-xs font-bold uppercase px-4 py-2">
          <div className="col-span-1">#</div>
          <div className="col-span-8">Team</div>
          <div className="col-span-3 text-right">Points</div>
        </div>
        {league && league.entries.length > 0 ? (
          league.entries.map((entry, i) => (
            <div key={entry.id} className="grid grid-cols-12 px-4 py-3 text-sm border-b last:border-0">
              <div className="col-span-1 font-bold text-slate-400">{i + 1}</div>
              <div className="col-span-8 font-semibold text-slate-800">{entry.user.teamName}</div>
              <div className="col-span-3 text-right font-bold text-fpl-purple">{entry.points}</div>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">
            No scores yet — check back after the gameweek deadline passes.
          </div>
        )}
      </div>
    </div>
  );
}
