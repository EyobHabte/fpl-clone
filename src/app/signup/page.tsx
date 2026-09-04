'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, teamName }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Could not create your account');
      return;
    }
    setSubmittedEmail(email);
  }

  if (submittedEmail) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-fpl-purple mb-2">Check your email</h1>
        <p className="text-sm text-slate-600">
          We sent a confirmation link to <span className="font-semibold">{submittedEmail}</span>. Click it to
          activate your account, then log in.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 px-6 py-2.5 rounded-full bg-fpl-purple text-white font-bold text-sm"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-extrabold text-fpl-purple mb-1">Create your team</h1>
      <p className="text-sm text-slate-500 mb-6">One squad, unlimited transfers, a fresh league every week.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500">Team name</label>
          <input
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Your team name"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-fpl-green"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-fpl-green"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-fpl-green"
          />
          <p className="text-xs text-slate-400 mt-1">At least 8 characters.</p>
        </div>

        {error && (
          <div className="bg-fpl-pink/10 border border-fpl-pink text-fpl-pink text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-full bg-fpl-green text-fpl-purple font-bold text-sm disabled:opacity-40"
        >
          {loading ? 'Creating...' : 'Create team'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4 text-center">
        Already have a team?{' '}
        <Link href="/login" className="text-fpl-pink font-semibold">
          Log in
        </Link>
      </p>
    </div>
  );
}
