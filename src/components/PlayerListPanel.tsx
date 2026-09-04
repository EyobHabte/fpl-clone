'use client';

import { useMemo } from 'react';

type SortKey = 'points' | 'price';
type PositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD';

export interface MarketPlayer {
  id: number;
  webName: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  price: number;
  totalPoints: number;
  club: { shortName: string; code?: number };
}

export interface ClubOption {
  id: number;
  name: string;
  shortName: string;
}

export default function PlayerListPanel({
  players,
  ownedIds,
  positionFilter,
  onPositionFilterChange,
  sortKey,
  onSortKeyChange,
  search,
  onSearchChange,
  maxPrice,
  onMaxPriceChange,
  affordableOnly,
  onAffordableOnlyChange,
  clubFilter,
  onClubFilterChange,
  clubs,
  onReset,
  onAdd,
  onRemove,
  onViewPlayer,
  affordableIds,
  budgetRemaining,
}: {
  players: MarketPlayer[];
  ownedIds: Set<number>;
  positionFilter: PositionFilter;
  onPositionFilterChange: (p: PositionFilter) => void;
  sortKey: SortKey;
  onSortKeyChange: (k: SortKey) => void;
  search: string;
  onSearchChange: (s: string) => void;
  maxPrice: number | null;
  onMaxPriceChange: (p: number | null) => void;
  affordableOnly: boolean;
  onAffordableOnlyChange: (v: boolean) => void;
  clubFilter: string | null;
  onClubFilterChange: (shortName: string | null) => void;
  clubs: ClubOption[];
  onReset: () => void;
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  onViewPlayer: (id: number) => void;
  affordableIds: Set<number>;
  budgetRemaining: number;
}) {
  const priceOptions = useMemo(() => {
    const max = players.length ? Math.max(...players.map((p) => p.price)) : 150;
    const opts: number[] = [];
    for (let v = max; v >= 40; v -= 5) opts.push(v);
    return opts;
  }, [players]);

  const filtered = players
    .filter((p) => (positionFilter === 'ALL' ? true : p.position === positionFilter))
    .filter((p) => (search ? p.webName.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((p) => (maxPrice !== null ? p.price <= maxPrice : true))
    .filter((p) => (affordableOnly ? affordableIds.has(p.id) || ownedIds.has(p.id) : true))
    .filter((p) => (clubFilter ? p.club.shortName === clubFilter : true))
    .sort((a, b) => (sortKey === 'points' ? b.totalPoints - a.totalPoints : b.price - a.price));

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase">Find a player</div>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name"
          className="w-full px-3 py-1.5 rounded-full text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-fpl-green"
        />
        <div className="flex gap-1.5 flex-wrap items-center">
          <select
            value={positionFilter}
            onChange={(e) => onPositionFilterChange(e.target.value as PositionFilter)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border-none focus:outline-none"
          >
            <option value="ALL">All players</option>
            <option value="GK">Goalkeepers</option>
            <option value="DEF">Defenders</option>
            <option value="MID">Midfielders</option>
            <option value="FWD">Forwards</option>
          </select>

          <select
            value={clubFilter ?? 'ALL'}
            onChange={(e) => onClubFilterChange(e.target.value === 'ALL' ? null : e.target.value)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border-none focus:outline-none"
          >
            <option value="ALL">All clubs</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.shortName}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border-none focus:outline-none"
          >
            <option value="points">Total points</option>
            <option value="price">Price</option>
          </select>

          <select
            value={affordableOnly ? 'AFFORDABLE' : maxPrice ?? 'ANY'}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'AFFORDABLE') {
                onAffordableOnlyChange(true);
                onMaxPriceChange(null);
              } else if (v === 'ANY') {
                onAffordableOnlyChange(false);
                onMaxPriceChange(null);
              } else {
                onAffordableOnlyChange(false);
                onMaxPriceChange(Number(v));
              }
            }}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border-none focus:outline-none"
          >
            <option value="AFFORDABLE">Affordable</option>
            {priceOptions.map((p) => (
              <option key={p} value={p}>
                £{(p / 10).toFixed(1)}m
              </option>
            ))}
          </select>

          <button
            onClick={onReset}
            className="ml-auto px-2.5 py-1 rounded-full text-xs font-semibold text-fpl-pink hover:bg-fpl-pink/10"
          >
            Reset
          </button>
        </div>

        <div className="bg-gradient-to-r from-fpl-cyan to-fpl-purple rounded-full text-center py-1.5 text-sm font-bold text-white">
          Bank £{(budgetRemaining / 10).toFixed(1)}m
        </div>

        <div className="text-xs text-slate-400">{filtered.length} players shown</div>
      </div>

      <div className="overflow-y-auto flex-1 max-h-[420px] sm:max-h-[520px] divide-y">
        {filtered.map((p) => {
          const owned = ownedIds.has(p.id);
          const affordable = affordableIds.has(p.id) || owned;
          return (
            <div key={p.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
              <button
                onClick={() => onViewPlayer(p.id)}
                className="flex items-center gap-2.5 min-w-0 text-left flex-1"
              >
                <span className="w-8 h-8 shrink-0 rounded-full bg-fpl-purple/10 text-fpl-purple font-bold flex items-center justify-center text-[10px]">
                  {p.position}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{p.webName}</div>
                  <div className="text-slate-400 text-xs">
                    {p.club.shortName} · £{(p.price / 10).toFixed(1)}m · {p.totalPoints} pts
                  </div>
                </div>
              </button>
              <button
                onClick={() => (owned ? onRemove(p.id) : onAdd(p.id))}
                disabled={!owned && !affordable}
                className={`w-7 h-7 shrink-0 rounded-full text-white font-bold text-sm flex items-center justify-center disabled:opacity-30 ${
                  owned ? 'bg-fpl-pink' : 'bg-fpl-green text-fpl-purple'
                }`}
                title={owned ? 'Remove from squad' : 'Add to squad'}
              >
                {owned ? '−' : '+'}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">No players match.</div>
        )}
      </div>
    </div>
  );
}
