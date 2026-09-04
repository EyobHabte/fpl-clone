'use client';

import ShirtImage from './ShirtImage';

export interface ActionablePlayer {
  playerId: number;
  webName: string;
  position: string;
  clubShort: string;
  clubCode: number;
  benchOrder: number | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export default function PickTeamActionModal({
  player,
  onClose,
  onOpenSubstitute,
  onMakeCaptain,
  onMakeViceCaptain,
}: {
  player: ActionablePlayer;
  onClose: () => void;
  onOpenSubstitute: (playerId: number) => void;
  onMakeCaptain: (playerId: number) => void;
  onMakeViceCaptain: (playerId: number) => void;
}) {
  const isStarting = player.benchOrder === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:justify-end bg-black/40 sm:bg-transparent sm:pt-20 sm:pr-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 sm:mx-0 overflow-hidden">
        <div className="relative bg-gradient-to-r from-fpl-cyan to-fpl-purple px-4 py-4 flex items-center gap-4">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 text-white flex items-center justify-center"
          >
            ✕
          </button>
          <div className="w-14 h-14 flex items-center justify-center shrink-0">
            <ShirtImage clubCode={player.clubCode} clubShort={player.clubShort} position={player.position} size={48} />
          </div>
          <div className="text-white">
            <div className="text-xs uppercase opacity-80">{isStarting ? 'Starting XI' : 'Bench'}</div>
            <div className="font-extrabold text-lg leading-tight">{player.webName}</div>
            <div className="text-sm opacity-90 flex gap-2 items-center">
              {player.clubShort}
              {player.isCaptain && (
                <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">Captain</span>
              )}
              {player.isViceCaptain && (
                <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">Vice-Captain</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 flex flex-col gap-2">
          <button
            onClick={() => {
              onOpenSubstitute(player.playerId);
              onClose();
            }}
            className="py-2.5 rounded-full bg-slate-200 text-slate-700 text-sm font-bold"
          >
            {isStarting ? 'Substitute — Choose Replacement' : 'Substitute — Choose Who Comes Off'}
          </button>

          {isStarting ? (
            <>
              <button
                onClick={() => {
                  onMakeCaptain(player.playerId);
                  onClose();
                }}
                disabled={player.isCaptain}
                className="py-2.5 rounded-full bg-fpl-purple text-white text-sm font-bold disabled:opacity-40"
              >
                {player.isCaptain ? 'Already Captain' : 'Make Captain'}
              </button>
              <button
                onClick={() => {
                  onMakeViceCaptain(player.playerId);
                  onClose();
                }}
                disabled={player.isViceCaptain || player.isCaptain}
                className="py-2.5 rounded-full bg-slate-500 text-white text-sm font-bold disabled:opacity-40"
              >
                {player.isViceCaptain
                  ? 'Already Vice-Captain'
                  : player.isCaptain
                  ? "Captain can't also be Vice"
                  : 'Make Vice-Captain'}
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center px-2 py-1">
              Move this player to the Starting XI to make them captain or vice-captain.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
