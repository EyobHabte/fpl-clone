'use client';

import ShirtImage from './ShirtImage';

export interface PlayerCardData {
  id: number;
  webName: string;
  position: string;
  price: number; // tenths
  clubShort: string;
  clubCode?: number | null;
  points?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

export default function PlayerCard({
  player,
  onClick,
  actionLabel,
  selected,
}: {
  player: PlayerCardData;
  onClick?: () => void;
  actionLabel?: string;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center w-16 sm:w-24 focus:outline-none rounded-lg transition-shadow ${
        selected ? 'ring-2 ring-fpl-cyan ring-offset-2 ring-offset-transparent' : ''
      }`}
    >
      <div className="relative">
        <ShirtImage clubCode={player.clubCode} clubShort={player.clubShort} position={player.position} />
        {player.isCaptain && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-fpl-purple text-white text-[9px] font-bold flex items-center justify-center border border-white z-10">
            C
          </span>
        )}
        {player.isViceCaptain && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-500 text-white text-[9px] font-bold flex items-center justify-center border border-white z-10">
            V
          </span>
        )}
      </div>
      <div className="w-full bg-fpl-purple text-white text-[9px] sm:text-xs font-semibold py-0.5 px-1 truncate rounded-t-sm text-center -mt-1">
        {player.webName}
      </div>
      <div className="w-full bg-white text-[9px] sm:text-xs text-slate-700 px-1 py-0.5 flex justify-between rounded-b-md shadow">
        <span>{player.clubShort}</span>
        <span>£{(player.price / 10).toFixed(1)}</span>
      </div>
      {typeof player.points === 'number' && (
        <div className="text-[9px] sm:text-[10px] font-bold text-fpl-purple mt-0.5">{player.points} pts</div>
      )}
      {actionLabel && (
        <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-fpl-pink font-semibold">
          {actionLabel}
        </div>
      )}
    </button>
  );
}
