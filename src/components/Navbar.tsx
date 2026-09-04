'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const links = [
  { href: '/', label: 'Pick Team' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/leagues', label: 'Leagues' },
  { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-fpl-purple text-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-fpl-green" />
          <span className="font-extrabold tracking-tight text-lg">Weekly Fantasy</span>
        </div>

        {status === 'authenticated' && (
          <nav className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 rounded-md text-sm font-semibold hover:bg-fpl-purpledark transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 text-sm">
          {status === 'authenticated' ? (
            <>
              <span className="hidden sm:inline text-white/80">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1.5 rounded-md font-semibold hover:bg-fpl-purpledark transition-colors"
              >
                Sign out
              </button>
            </>
          ) : status === 'unauthenticated' ? (
            <>
              <Link href="/login" className="px-3 py-1.5 rounded-md font-semibold hover:bg-fpl-purpledark">
                Log in
              </Link>
              <Link href="/signup" className="px-3 py-1.5 rounded-full bg-fpl-green text-fpl-purple font-bold">
                Sign up
              </Link>
            </>
          ) : null}
        </div>
      </div>
      <div className="h-1 bg-fpl-green" />
    </header>
  );
}
