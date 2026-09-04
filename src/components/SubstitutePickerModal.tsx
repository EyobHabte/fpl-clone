'use client';

import ShirtImage from './ShirtImage';

export interface SubCandidate {
  playerId: number;
  webName: string;
  position: string;
  clubShort: string;
  clubCode: number;
  valid: boolean;
  invalidReason?: string;
}

export default function SubstitutePickerModal({
  sourceName,
  direction,
  candidates,
  onPick,
  onClose,
}: {
  sourceName: string;
  direction: 'toBench' | 'toStarting';
  candidates: SubCandidate[];
  onPick: (candidateId: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:justify-end bg-black/40 sm:bg-transparent sm:pt-20 sm:pr-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 sm:mx-0 overflow-hidden">
        <div className="relative bg-gradient-to-r from-fpl-cyan to-fpl-purple px-4 py-4">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 text-white flex items-center justify-center"
          >
            ✕
          </button>
          <div className="text-white text-xs uppercase opacity-80">Choose replacement for</div>
          <div className="text-white font-extrabold text-lg leading-tight">{sourceName}</div>
          <div className="text-white/80 text-xs mt-0.5">
            {direction === 'toBench' ? 'Pick who comes on from the bench' : 'Pick who makes way in the Starting XI'}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {candidates.map((c) => (
            <button
              key={c.playerId}
              onClick={() => c.valid && onPick(c.playerId)}
              disabled={!c.valid}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left disabled:opacity-40"
            >
              <ShirtImage clubCode={c.clubCode} clubShort={c.clubShort} position={c.position} size={32} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800 truncate">{c.webName}</div>
                <div className="text-slate-400 text-xs">
                  {c.position} · {c.clubShort}
                  {!c.valid && c.invalidReason ? ` · ${c.invalidReason}` : ''}
                </div>
              </div>
            </button>
          ))}
          {candidates.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">No players available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
