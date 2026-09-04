'use client';

import PlayerCard, { PlayerCardData } from './PlayerCard';

export default function Pitch({
  starting,
  bench,
  onPlayerClick,
  selectedId,
}: {
  starting: PlayerCardData[];
  bench: PlayerCardData[];
  onPlayerClick?: (player: PlayerCardData) => void;
  selectedId?: number | null;
}) {
  const rows: Record<string, PlayerCardData[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  starting.forEach((p) => rows[p.position]?.push(p));

  return (
    <div>
      <div className="pitch-bg rounded-xl border-4 border-white/40 py-4 sm:py-6 px-1 sm:px-2 flex flex-col gap-3 sm:gap-6 shadow-lg overflow-x-auto">
        {(['GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
          <div key={pos} className="flex justify-center gap-1.5 sm:gap-6 flex-nowrap sm:flex-wrap min-w-max sm:min-w-0 mx-auto">
            {rows[pos].map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                selected={p.id === selectedId}
                onClick={() => onPlayerClick?.(p)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 bg-fpl-purpledark rounded-xl p-3 sm:p-4 overflow-x-auto">
        <div className="text-white text-xs font-bold uppercase tracking-wide mb-3">Bench</div>
        <div className="flex gap-1.5 sm:gap-6 flex-nowrap sm:flex-wrap min-w-max sm:min-w-0">
          {bench.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={p.id === selectedId}
              onClick={() => onPlayerClick?.(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
