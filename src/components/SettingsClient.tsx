'use client';

import { useState } from 'react';

export default function SettingsClient({
  email,
  teamName: initialTeamName,
  phone: initialPhone,
  phoneVerified: initialPhoneVerified,
}: {
  email: string;
  teamName: string;
  phone: string | null;
  phoneVerified: boolean;
}) {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [teamNameMessage, setTeamNameMessage] = useState<string | null>(null);
  const [savingTeamName, setSavingTeamName] = useState(false);

  const [phone, setPhone] = useState(initialPhone ?? '');
  const [phoneVerified, setPhoneVerified] = useState(initialPhoneVerified);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [phoneMessage, setPhoneMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

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

  async function sendCode() {
    setSendingCode(true);
    setPhoneMessage(null);
    const res = await fetch('/api/account/phone/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSendingCode(false);
    if (!res.ok) {
      setPhoneMessage({ text: data.error ?? 'Could not send code', type: 'error' });
      return;
    }
    setCodeSent(true);
    setPhoneMessage({ text: 'Code sent — check your phone.', type: 'success' });
  }

  async function verifyCode() {
    setVerifyingCode(true);
    setPhoneMessage(null);
    const res = await fetch('/api/account/phone/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setVerifyingCode(false);
    if (!res.ok) {
      setPhoneMessage({ text: data.error ?? 'Incorrect code', type: 'error' });
      return;
    }
    setPhoneVerified(true);
    setCodeSent(false);
    setCode('');
    setPhoneMessage({ text: 'Phone number verified.', type: 'success' });
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl font-extrabold text-fpl-purple mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="text-xs font-semibold text-slate-500 mb-1">Email</div>
        <div className="text-sm text-slate-800">{email}</div>
      </div>

      <form onSubmit={saveTeamName} className="bg-white rounded-xl shadow p-4 mb-4 space-y-2">
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

      <div className="bg-white rounded-xl shadow p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500">Phone number (optional)</label>
          {phoneVerified && (
            <span className="text-xs font-bold text-green-600 bg-green-50 rounded-full px-2 py-0.5">Verified</span>
          )}
        </div>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09XXXXXXXX"
          disabled={phoneVerified}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-fpl-green disabled:bg-slate-50 disabled:text-slate-400"
        />

        {phoneMessage && (
          <div
            className={`text-xs rounded-lg px-3 py-2 border ${
              phoneMessage.type === 'success'
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-fpl-pink/10 border-fpl-pink text-fpl-pink'
            }`}
          >
            {phoneMessage.text}
          </div>
        )}

        {!phoneVerified && !codeSent && (
          <button
            onClick={sendCode}
            disabled={sendingCode || !phone}
            className="px-4 py-2 rounded-full bg-fpl-purple text-white text-xs font-bold disabled:opacity-40"
          >
            {sendingCode ? 'Sending...' : 'Send verification code'}
          </button>
        )}

        {!phoneVerified && codeSent && (
          <div className="space-y-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-fpl-green"
            />
            <div className="flex gap-2">
              <button
                onClick={verifyCode}
                disabled={verifyingCode || code.length < 6}
                className="px-4 py-2 rounded-full bg-fpl-green text-fpl-purple text-xs font-bold disabled:opacity-40"
              >
                {verifyingCode ? 'Verifying...' : 'Verify code'}
              </button>
              <button onClick={sendCode} disabled={sendingCode} className="px-4 py-2 text-xs font-semibold text-fpl-pink">
                Resend
              </button>
            </div>
          </div>
        )}

        {phoneVerified && (
          <button
            onClick={() => {
              setPhoneVerified(false);
              setPhone('');
              setPhoneMessage(null);
            }}
            className="text-xs text-fpl-pink font-semibold"
          >
            Change phone number
          </button>
        )}
      </div>
    </div>
  );
}
