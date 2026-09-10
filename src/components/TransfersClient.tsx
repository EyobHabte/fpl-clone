'use client';

import { useState } from 'react';
import SquadPitch from '@/components/SquadPitch';
import PlayerListPanel, { MarketPlayer, ClubOption } from '@/components/PlayerListPanel';
import PlayerDetailModal from '@/components/PlayerDetailModal';
import { PlayerCardData } from '@/components/PlayerCard';
import MessageBox from '@/components/MessageBox';

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
type PositionFilter = 'ALL' | Position;


interface SquadPlayerRow {
  playerId: number;
  player: {
    webName: string;
    position: Position;
    price: number;
    totalPoints: number;
    club: { shortName: string; code: number };
  };
}
const SQUAD_SIZE = 15;
const POSITION_LIMITS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const MAX_PER_CLUB = 3;

export default function TransfersClient({
  initialPlayers,
  initialClubs,
  initialSquad,
}: {
  initialPlayers: MarketPlayer[];
  initialClubs: ClubOption[];
  initialSquad: {
    budgetTotal: number;
    user: { teamName: string } | null;
    players: SquadPlayerRow[];
  } | null;
}) {
  const [teamName] = useState(initialSquad?.user?.teamName ?? 'Your Team');
  const [pendingReplacement, setPendingReplacement] = useState<SquadPlayerRow | null>(null);
  const [allPlayers] = useState<MarketPlayer[]>(initialPlayers);
  const [clubs] = useState<ClubOption[]>(initialClubs);

  // savedSquadPlayers = last known-good state from the server (what Reset reverts to)
  const [savedSquadPlayers, setSavedSquadPlayers] = useState<SquadPlayerRow[]>(initialSquad?.players ?? []);
  // squadPlayers = the working/staged squad the user is currently editing
  const [squadPlayers, setSquadPlayers] = useState<SquadPlayerRow[]>(initialSquad?.players ?? []);

  const [budgetTotal] = useState(initialSquad?.budgetTotal ?? 0);
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('ALL');
  const [sortKey, setSortKey] = useState<'points' | 'price'>('points');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [affordableOnly, setAffordableOnly] = useState(false);
  const [clubFilter, setClubFilter] = useState<string | null>(null);

  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [mobileView, setMobileView] = useState<'pitch' | 'list'>('pitch');
  const [detailPlayerId, setDetailPlayerId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);


  // Everything below only touches local state - instant, no network round trip.
  // Nothing hits the database until Save is clicked.

  const spentSoFar = squadPlayers.reduce((sum, sp) => sum + sp.player.price, 0);
  const budgetRemaining = budgetTotal - spentSoFar;

  function add(playerId: number) {
    const market = allPlayers.find((p) => p.id === playerId);
    if (!market) return;
    if (squadPlayers.some((sp) => sp.playerId === playerId)) return;

    if (squadPlayers.length >= SQUAD_SIZE) {
      setMessage({ text: `Squad is full (${SQUAD_SIZE} players) — remove someone first.`, type: 'error' });
      return;
    }
    if (market.price > budgetRemaining) {
      setMessage({ text: 'Not enough budget for this transfer.', type: 'error' });
      return;
    }
    const posCount = squadPlayers.filter((sp) => sp.player.position === market.position).length;
    if (posCount >= POSITION_LIMITS[market.position]) {
      setMessage({ text: `You can only have ${POSITION_LIMITS[market.position]} ${market.position} players.`, type: 'error' });
      return;
    }
    const clubCount = squadPlayers.filter((sp) => sp.player.club.shortName === market.club.shortName).length;
    if (clubCount >= MAX_PER_CLUB) {
      setMessage({ text: `Max ${MAX_PER_CLUB} players from the same club.`, type: 'error' });
      return;
    }

    setMessage(null);
    setSquadPlayers((prev) => [
      ...prev,
      {
        playerId: market.id,
        player: {
          webName: market.webName,
          position: market.position,
          price: market.price,
          totalPoints: market.totalPoints,
          club: { shortName: market.club.shortName, code: market.club.code ?? 0 },
        },
      },
    ]);
    if (pendingReplacement) setPendingReplacement(null);
  }

  function remove(playerId: number) {
    setMessage(null);
    setSquadPlayers((prev) => prev.filter((sp) => sp.playerId !== playerId));
  }
 function startReplacement(row: SquadPlayerRow) {
    // if a different replacement was already in progress, restore it first
    if (pendingReplacement) {
      setSquadPlayers((prev) => [...prev, pendingReplacement]);
    }
    setPendingReplacement(row);
    setSquadPlayers((prev) => prev.filter((sp) => sp.playerId !== row.playerId));
    setPositionFilter(row.player.position as PositionFilter);
    setMobileView('list');
    setMessage(null);
  }

  function cancelReplacement() {
    if (!pendingReplacement) return;
    setSquadPlayers((prev) => [...prev, pendingReplacement]);
    setPendingReplacement(null);
  }
  function resetFilters() {
    setPositionFilter('ALL');
    setSortKey('points');
    setSearch('');
    setMaxPrice(null);
    setAffordableOnly(false);
    setClubFilter(null);
  }

  const isFull = squadPlayers.length === SQUAD_SIZE;
  const isDirty =
    squadPlayers.length !== savedSquadPlayers.length ||
    squadPlayers.some((sp) => !savedSquadPlayers.some((s) => s.playerId === sp.playerId));

  function resetSquad() {
    setSquadPlayers(savedSquadPlayers);
    setPendingReplacement(null);
    setMessage(null);
  }

  async function saveSquad() {
    if (!isFull) {
      setMessage({ text: `Your squad needs exactly ${SQUAD_SIZE} players before you can save.`, type: 'error' });
      return;
    }
    setSaving(true);
    setMessage(null);
    const res = await fetch('/api/squad/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds: squadPlayers.map((sp) => sp.playerId) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ text: data.error ?? 'Could not save your squad', type: 'error' });
      return;
    }
    setSavedSquadPlayers(squadPlayers);
    setMessage({ text: 'Squad saved.', type: 'success' });
  }

  const ownedIds = new Set(squadPlayers.map((sp) => sp.playerId));
  const affordableIds = new Set(allPlayers.filter((p) => p.price <= budgetRemaining).map((p) => p.id));

  const squadCards: PlayerCardData[] = squadPlayers.map((sp) => ({
    id: sp.playerId,
    webName: sp.player.webName,
    position: sp.player.position,
    price: sp.player.price,
    clubShort: sp.player.club.shortName,
    clubCode: sp.player.club.code,
    points: sp.player.totalPoints,
  }));

  const listPanel = (
    <PlayerListPanel
      players={allPlayers}
      clubs={clubs}
      ownedIds={ownedIds}
      affordableIds={affordableIds}
      positionFilter={positionFilter}
      onPositionFilterChange={setPositionFilter}
      sortKey={sortKey}
      onSortKeyChange={setSortKey}
      search={search}
      onSearchChange={setSearch}
      maxPrice={maxPrice}
      onMaxPriceChange={setMaxPrice}
      affordableOnly={affordableOnly}
      onAffordableOnlyChange={setAffordableOnly}
      clubFilter={clubFilter}
      onClubFilterChange={setClubFilter}
      onReset={resetFilters}
      onAdd={add}
      onRemove={remove}
      onViewPlayer={(id) => setDetailPlayerId(id)}
      budgetRemaining={budgetRemaining}
    />
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-extrabold text-fpl-purple">{teamName}</h1>
        <div className="flex gap-3">
          <div className="bg-white rounded-lg shadow px-4 py-2 text-sm">
            <span className="text-slate-500">Players selected: </span>
            <span className={`font-bold ${isFull ? 'text-fpl-purple' : 'text-amber-600'}`}>
              {squadPlayers.length}/15
            </span>
          </div>
          <div className="bg-white rounded-lg shadow px-4 py-2 text-sm">
            <span className="text-slate-500">Bank: </span>
            <span className="font-bold text-fpl-purple">
              £{(budgetRemaining / 10).toFixed(1)}m
              <span className="text-slate-400 font-normal"> / £{(budgetTotal / 10).toFixed(1)}m</span>
            </span>
          </div>
        </div>
      </div>

      {message && (
        <MessageBox text={message.text} type={message.type} onDismiss={() => setMessage(null)} className="mb-4" />
      )}

      {pendingReplacement && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-lg px-4 py-2 mb-4 flex items-center justify-between gap-3">
          <span>
            Replacing <strong>{pendingReplacement.player.webName}</strong> — pick their replacement below.
          </span>
          <button onClick={cancelReplacement} className="text-fpl-pink font-semibold text-xs whitespace-nowrap">
            Cancel
          </button>
        </div>
      )}

      {isDirty && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-2 mb-4">
          You have unsaved changes.
        </div>
      )}

      {/* Mobile Pitch/List toggle */}
      <div className="flex lg:hidden gap-1 bg-white rounded-lg shadow p-1 mb-4 w-fit">
        <button
          onClick={() => setMobileView('pitch')}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
            mobileView === 'pitch' ? 'bg-fpl-purple text-white' : 'text-slate-500'
          }`}
        >
          Pitch
        </button>
        <button
          onClick={() => setMobileView('list')}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
            mobileView === 'list' ? 'bg-fpl-purple text-white' : 'text-slate-500'
          }`}
        >
          List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">
        <div className="hidden lg:block">{listPanel}</div>

        <div>
          <SquadPitch
            squadPlayers={squadCards}
            selectedId={detailPlayerId}
            onPlayerClick={(id) => setDetailPlayerId(id)}
            onEmptySlotClick={(position) => {
              setPositionFilter(position as PositionFilter);
              setMobileView('list');
            }}
          />
        </div>
      </div>

      {/* Mobile full-screen "Player Selection" overlay, closed with the X */}
      {mobileView === 'list' && (
        <div className="fixed inset-0 z-40 lg:hidden bg-fpl-purpledark overflow-y-auto">
          <div className="p-4 pb-24">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-white text-xl font-extrabold">Player Selection</h2>
                <p className="text-white/70 text-xs mt-1">
                  Choose players for your squad, within your £{(budgetTotal / 10).toFixed(1)}m budget.
                </p>
              </div>
              <button
                onClick={() => setMobileView('pitch')}
                aria-label="Close and return to pitch"
                className="text-white text-2xl leading-none px-1"
              >
                ✕
              </button>
            </div>
            {listPanel}
          </div>
        </div>
      )}

      {detailPlayerId !== null && (
        <PlayerDetailModal
          playerId={detailPlayerId}
          owned={ownedIds.has(detailPlayerId)}
          onClose={() => setDetailPlayerId(null)}
          onRemove={remove}
          onSelectReplacement={() => {
            const row = squadPlayers.find((sp) => sp.playerId === detailPlayerId);
            if (row) startReplacement(row);
            setDetailPlayerId(null);
          }}
        />
      )}

      {/* Sticky Save / Reset bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
          <button
            onClick={resetSquad}
            disabled={!isDirty || saving}
            className="px-5 py-2.5 rounded-full bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-40"
          >
            Reset
          </button>
          <button
            onClick={saveSquad}
            disabled={!isFull || saving}
            className="px-6 py-2.5 rounded-full bg-fpl-green text-fpl-purple text-sm font-bold disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
