'use client';

import { useMemo, useState } from 'react';
import Pitch from '@/components/Pitch';
import { PlayerCardData } from '@/components/PlayerCard';
import PickTeamActionModal, { ActionablePlayer } from '@/components/PickTeamActionModal';
import SubstitutePickerModal, { SubCandidate } from '@/components/SubstitutePickerModal';
import { validateLineup, LineupPlayer, Position } from '@/lib/formation';
import { computeAutoPick } from '@/lib/autoPick';
import MessageBox from '@/components/MessageBox';

interface SquadPlayerRow {
  playerId: number;
  benchOrder: number | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  player: {
    webName: string;
    position: Position;
    price: number;
    totalPoints: number;
    club: { shortName: string; code: number };
  };
}

const POSITION_LIMITS: Record<Position, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

export default function PickTeamClient({
  initialSquad,
}: {
  initialSquad: {
    budgetRemaining: number;
    budgetTotal: number;
    user: { teamName: string } | null;
    players: SquadPlayerRow[];
  } | null;
}) {
  const [teamName] = useState(initialSquad?.user?.teamName ?? 'Your Team');
  const [rows, setRows] = useState<SquadPlayerRow[]>(initialSquad?.players ?? []);
  const [budgetRemaining] = useState(initialSquad?.budgetRemaining ?? 0);
  const [budgetTotal] = useState(initialSquad?.budgetTotal ?? 0);
  const [actionPlayerId, setActionPlayerId] = useState<number | null>(null);
  const [substituteSourceId, setSubstituteSourceId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [saving, setSaving] = useState(false);

  const lineup: LineupPlayer[] = rows.map((r) => ({
    playerId: r.playerId,
    position: r.player.position,
    benchOrder: r.benchOrder,
    isCaptain: r.isCaptain,
    isViceCaptain: r.isViceCaptain,
  }));

  const validation = useMemo(() => (rows.length === 15 ? validateLineup(lineup) : { valid: false, errors: [] }), [rows]);

  const cards: (PlayerCardData & { benchOrder: number | null })[] = rows
    .map((r) => ({
      id: r.playerId,
      webName: r.player.webName,
      position: r.player.position,
      price: r.player.price,
      clubShort: r.player.club.shortName,
      clubCode: r.player.club.code,
      points: r.player.totalPoints,
      isCaptain: r.isCaptain,
      isViceCaptain: r.isViceCaptain,
      benchOrder: r.benchOrder,
    }))
    .sort((a, b) => (a.benchOrder ?? -1) - (b.benchOrder ?? -1));

  const starting = cards.filter((c) => c.benchOrder === null);
  const bench = cards.filter((c) => c.benchOrder !== null);
  const actionRow = rows.find((r) => r.playerId === actionPlayerId);

  function openSubstitute(playerId: number) {
    setActionPlayerId(null);
    setSubstituteSourceId(playerId);
  }

  function checkSwapValidity(sourceId: number, candidateId: number): { valid: boolean; reason?: string } {
    const source = rows.find((r) => r.playerId === sourceId);
    const candidate = rows.find((r) => r.playerId === candidateId);
    if (!source || !candidate) return { valid: false, reason: 'Player not found' };

    const sourceGoingToBench = source.benchOrder === null; // source is currently starting

    const simulatedStarting = rows
      .filter((r) => r.benchOrder === null)
      .map((r) => r.playerId)
      .filter((id) => id !== sourceId && id !== candidateId);
    // whichever of the pair ends up starting gets added back in
    simulatedStarting.push(sourceGoingToBench ? candidateId : sourceId);

    const counts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    simulatedStarting.forEach((id) => {
      const row = rows.find((r) => r.playerId === id);
      if (row) counts[row.player.position]++;
    });

    for (const pos of Object.keys(POSITION_LIMITS) as Position[]) {
      const { min, max } = POSITION_LIMITS[pos];
      if (counts[pos] < min || counts[pos] > max) {
        return { valid: false, reason: `Needs ${min}-${max} ${pos}` };
      }
    }
    return { valid: true };
  }

  function performSwap(candidateId: number) {
    if (!substituteSourceId) return;
    const source = rows.find((r) => r.playerId === substituteSourceId);
    const candidate = rows.find((r) => r.playerId === candidateId);
    if (!source || !candidate) return;

    const sourceGoingToBench = source.benchOrder === null;

    setRows((prev) =>
      prev.map((r) => {
        if (r.playerId === source.playerId) {
          return {
            ...r,
            benchOrder: sourceGoingToBench ? candidate.benchOrder : null,
            isCaptain: sourceGoingToBench ? false : r.isCaptain,
            isViceCaptain: sourceGoingToBench ? false : r.isViceCaptain,
          };
        }
        if (r.playerId === candidate.playerId) {
          return {
            ...r,
            benchOrder: sourceGoingToBench ? null : source.benchOrder,
            isCaptain: sourceGoingToBench ? r.isCaptain : false,
            isViceCaptain: sourceGoingToBench ? r.isViceCaptain : false,
          };
        }
        return r;
      })
    );
    setSubstituteSourceId(null);
    setMessage(null);
  }

  function makeCaptain(playerId: number) {
    setMessage(null);
    setRows((prev) => {
      const target = prev.find((r) => r.playerId === playerId);
      if (!target || target.benchOrder !== null) return prev; // bench players can't be captain
      const prevCaptainId = prev.find((r) => r.isCaptain)?.playerId ?? null;
      // the previous captain automatically becomes vice-captain, until the user picks one themselves
      const autoViceId = prevCaptainId && prevCaptainId !== playerId ? prevCaptainId : null;
      return prev.map((r) => ({
        ...r,
        isCaptain: r.playerId === playerId,
        isViceCaptain: autoViceId ? r.playerId === autoViceId : r.playerId === playerId ? false : r.isViceCaptain,
      }));
    });
  }

  function makeViceCaptain(playerId: number) {
    setMessage(null);
    setRows((prev) => {
      const target = prev.find((r) => r.playerId === playerId);
      if (!target || target.benchOrder !== null) return prev; // bench players can't be vice-captain
      if (target.isCaptain) return prev; // one player can't be both
      return prev.map((r) => ({ ...r, isViceCaptain: r.playerId === playerId }));
    });
  }

  /** Auto-fills a valid starting XI, bench, captain, and vice-captain from the current 15-man squad. */
  function autoPick() {
    if (rows.length !== 15) {
      setMessage({ text: 'Your squad needs exactly 15 players before you can auto pick — build it in Transfers first.', type: 'error' });
      return;
    }
    setMessage(null);

    const assignments = computeAutoPick(
      rows.map((r) => ({ playerId: r.playerId, position: r.player.position, totalPoints: r.player.totalPoints }))
    );
    if (!assignments) {
      setMessage({ text: 'Could not auto pick — your squad shape looks unusual.', type: 'error' });
      return;
    }

    setRows((prev) =>
      prev.map((r) => {
        const a = assignments.find((x) => x.playerId === r.playerId)!;
        return { ...r, benchOrder: a.benchOrder, isCaptain: a.isCaptain, isViceCaptain: a.isViceCaptain };
      })
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch('/api/squad/lineup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players: lineup }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ text: data.error ?? 'Could not save lineup', type: 'error' });
      return;
    }
    setMessage({ text: 'Lineup saved.', type: 'success' });
  }

  const actionablePlayer: ActionablePlayer | null = actionRow
    ? {
        playerId: actionRow.playerId,
        webName: actionRow.player.webName,
        position: actionRow.player.position,
        clubShort: actionRow.player.club.shortName,
        clubCode: actionRow.player.club.code,
        benchOrder: actionRow.benchOrder,
        isCaptain: actionRow.isCaptain,
        isViceCaptain: actionRow.isViceCaptain,
      }
    : null;

  const substituteSourceRow = rows.find((r) => r.playerId === substituteSourceId) ?? null;
  const substituteCandidates: SubCandidate[] = substituteSourceRow
    ? rows
        .filter((r) =>
          substituteSourceRow.benchOrder === null ? r.benchOrder !== null : r.benchOrder === null
        )
        .map((r) => {
          const { valid, reason } = checkSwapValidity(substituteSourceRow.playerId, r.playerId);
          return {
            playerId: r.playerId,
            webName: r.player.webName,
            position: r.player.position,
            clubShort: r.player.club.shortName,
            clubCode: r.player.club.code,
            valid,
            invalidReason: reason,
          };
        })
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-fpl-purple">{teamName}</h1>
          <p className="text-sm text-slate-500">Tap a player for substitute, captain, and vice-captain options.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoPick}
            className="bg-fpl-purple text-white rounded-lg shadow px-4 py-2 text-sm font-bold whitespace-nowrap"
          >
            Auto Pick
          </button>
          <div className="bg-white rounded-lg shadow px-4 py-2 text-sm">
            <span className="text-slate-500">Budget: </span>
            <span className="font-bold text-fpl-purple">
              £{(budgetRemaining / 10).toFixed(1)}m{' '}
              <span className="text-slate-400 font-normal">/ £{(budgetTotal / 10).toFixed(1)}m</span>
            </span>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500">
          Your squad is empty. Head to{' '}
          <a href="/transfers" className="text-fpl-pink font-semibold">
            Transfers
          </a>{' '}
          to build your first 15.
        </div>
      ) : (
        <>
          <Pitch starting={starting} bench={bench} onPlayerClick={(p) => setActionPlayerId(p.id)} />

          {message && (
        <MessageBox text={message.text} type={message.type} onDismiss={() => setMessage(null)} className="mt-3" />
      )}

          {!validation.valid && validation.errors.length > 0 && (
            <ul className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 space-y-0.5">
              {validation.errors.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          )}

          <button
            onClick={save}
            disabled={saving || !validation.valid}
            className="mt-4 w-full sm:w-auto px-6 py-2.5 rounded-full bg-fpl-green text-fpl-purple font-bold disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Lineup'}
          </button>
        </>
      )}

      {actionablePlayer && (
        <PickTeamActionModal
          player={actionablePlayer}
          onClose={() => setActionPlayerId(null)}
          onOpenSubstitute={openSubstitute}
          onMakeCaptain={makeCaptain}
          onMakeViceCaptain={makeViceCaptain}
        />
      )}

      {substituteSourceRow && (
        <SubstitutePickerModal
          sourceName={substituteSourceRow.player.webName}
          direction={substituteSourceRow.benchOrder === null ? 'toBench' : 'toStarting'}
          candidates={substituteCandidates}
          onPick={performSwap}
          onClose={() => setSubstituteSourceId(null)}
        />
      )}
    </div>
  );
}
