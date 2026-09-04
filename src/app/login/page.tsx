'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setResendStatus(null);
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      if (res.error.includes('EMAIL_NOT_VERIFIED')) {
        setNeedsVerification(true);
        setError('Please verify your email before logging in.');
      } else {
        setError('Incorrect email or password.');
      }
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function resendVerification() {
    setResendStatus('Sending...');
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setResendStatus(data.message ?? 'If that account needs verifying, a new email is on its way.');
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-extrabold text-fpl-purple mb-1">Log in</h1>
      <p className="text-sm text-slate-500 mb-6">Welcome back to Weekly Fantasy.</p>

      {verified === '1' && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">
          Email confirmed — you can log in now.
        </div>
      )}
      {verified === '0' && (
        <div className="bg-fpl-pink/10 border border-fpl-pink text-fpl-pink text-sm rounded-lg px-3 py-2 mb-4">
          That verification link is invalid or expired. Log in and request a new one below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-fpl-green"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-fpl-green"
          />
        </div>

        {error && (
          <div className="bg-fpl-pink/10 border border-fpl-pink text-fpl-pink text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {needsVerification && (
          <button
            type="button"
            onClick={resendVerification}
            className="text-sm text-fpl-pink font-semibold"
          >
            Resend verification email
          </button>
        )}
        {resendStatus && <p className="text-xs text-slate-500">{resendStatus}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-full bg-fpl-purple text-white font-bold text-sm disabled:opacity-40"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4 text-center">
        No account?{' '}
        <Link href="/signup" className="text-fpl-pink font-semibold">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
