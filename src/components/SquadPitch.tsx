'use client';

import PlayerCard, { PlayerCardData } from './PlayerCard';
import EmptySlot from './EmptySlot';

const POSITION_LIMITS: Record<string, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'] as const;

export default function SquadPitch({
  squadPlayers,
  onPlayerClick,
  onEmptySlotClick,
  selectedId,
}: {
  squadPlayers: PlayerCardData[];
  onPlayerClick: (playerId: number) => void;
  onEmptySlotClick: (position: string) => void;
  selectedId?: number | null;
}) {
  return (
    <div className="pitch-bg rounded-xl border-4 border-white/40 py-4 sm:py-6 px-1 sm:px-2 flex flex-col gap-3 sm:gap-5 shadow-lg overflow-x-auto">
      {POSITIONS.map((pos) => {
        const players = squadPlayers.filter((p) => p.position === pos);
        const limit = POSITION_LIMITS[pos];
        const emptyCount = Math.max(0, limit - players.length);

        return (
          <div key={pos} className="flex justify-center gap-1.5 sm:gap-6 flex-nowrap sm:flex-wrap min-w-max sm:min-w-0 mx-auto">
            {players.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                selected={p.id === selectedId}
                onClick={() => onPlayerClick(p.id)}
                actionLabel="View"
              />
            ))}
            {Array.from({ length: emptyCount }).map((_, i) => (
              <EmptySlot key={`${pos}-empty-${i}`} position={pos} onClick={() => onEmptySlotClick(pos)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
