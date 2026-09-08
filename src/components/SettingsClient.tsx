'use client';

import { useState } from 'react';

export default function SettingsClient({
  email,
  teamName: initialTeamName,
}: {
  email: string;
  teamName: string;
}) {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [teamNameMessage, setTeamNameMessage] = useState<string | null>(null);
  const [savingTeamName, setSavingTeamName] = useState(false);

  async function saveTeamName(e: React.FormEvent) {
    e.preventDefault();
    setSavingTeamName(true);
    setTeamNameMessage(null);
    const res = await fetch('/api/account/team-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName }),
    });
    const data = await res.json();
    setSavingTeamName(false);
    setTeamNameMessage(res.ok ? 'Saved.' : data.error ?? 'Could not save');
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl font-extrabold text-fpl-purple mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="text-xs font-semibold text-slate-500 mb-1">Email</div>
        <div className="text-sm text-slate-800">{email}</div>
      </div>

      <form onSubmit={saveTeamName} className="bg-white rounded-xl shadow p-4 space-y-2">
        <label className="text-xs font-semibold text-slate-500">Team name</label>
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-fpl-green"
        />
        {teamNameMessage && <p className="text-xs text-slate-500">{teamNameMessage}</p>}
        <button
          type="submit"
          disabled={savingTeamName}
          className="px-4 py-2 rounded-full bg-fpl-purple text-white text-xs font-bold disabled:opacity-40"
        >
          {savingTeamName ? 'Saving...' : 'Save team name'}
        </button>
      </form>
    </div>
  );
}