'use client';

import { useEffect, useState } from 'react';
import Jersey from './Jersey';
import { playerPhotoUrl } from '@/lib/playerPhoto';

interface PlayerDetail {
  id: number;
  webName: string;
  firstName: string;
  secondName: string;
  position: string;
  price: number;
  totalPoints: number;
  form: number;
  pointsPerGame: number;
  selectedByPercent: number;
  photoCode: string | null;
  club: { name: string; shortName: string };
}

export default function PlayerDetailModal({
  playerId,
  owned,
  onClose,
  onRemove,
  onSelectReplacement,
}: {
  playerId: number;
  owned: boolean;
  onClose: () => void;
  onRemove: (playerId: number) => void;
  onSelectReplacement: (position: string) => void;
}) {
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    fetch(`/api/players/${playerId}`)
      .then((r) => r.json())
      .then((d) => setPlayer(d.player))
      .catch(() => setPlayer(null));
  }, [playerId]);

  const photoUrl = player?.photoCode ? playerPhotoUrl(player.photoCode) : null;

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
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
            {photoUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={player?.webName ?? ''}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : player ? (
              <Jersey clubShort={player.club.shortName} position={player.position} size={48} />
            ) : null}
          </div>
          <div className="text-white">
            <div className="text-xs uppercase opacity-80">
              {player ? { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' }[player.position] : ''}
            </div>
            <div className="font-extrabold text-lg leading-tight">{player?.webName ?? 'Loading...'}</div>
            <div className="text-sm opacity-90">{player?.club.name}</div>
          </div>
        </div>

        {player && (
          <>
            <div className="grid grid-cols-4 divide-x text-center py-3 border-b">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Price</div>
                <div className="font-bold text-fpl-purple">£{(player.price / 10).toFixed(1)}m</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Form</div>
                <div className="font-bold text-fpl-purple">{player.form.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Pts/Match</div>
                <div className="font-bold text-fpl-purple">{player.pointsPerGame.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">TSB%</div>
                <div className="font-bold text-fpl-purple">{player.selectedByPercent.toFixed(1)}%</div>
              </div>
            </div>

            <div className="px-4 py-2 text-center text-sm text-slate-500">
              {player.totalPoints} total points this season
            </div>

            <div className="p-3 flex gap-2">
              {owned ? (
                <>
                  <button
                    onClick={() => {
                      onRemove(player.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-full bg-fpl-pink text-white text-sm font-bold"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => {
                      onSelectReplacement(player.position);
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-full bg-fpl-purple text-white text-sm font-bold"
                  >
                    Select Replacement
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-full bg-slate-200 text-slate-700 text-sm font-bold"
                >
                  Close
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
