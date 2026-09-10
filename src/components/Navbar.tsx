'use client';

import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-fpl-purple text-white relative">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full bg-fpl-green shrink-0" />
          <span className="font-extrabold tracking-tight text-lg whitespace-nowrap truncate">Weekly Fantasy</span>
        </div>

        {status === 'authenticated' && (
          <nav className="hidden sm:flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 rounded-md text-sm font-semibold hover:bg-fpl-purpledark transition-colors whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {status === 'authenticated' && (
            <>
              <span className="hidden md:inline text-white/80 text-sm">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="hidden sm:inline-block px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-fpl-purpledark transition-colors whitespace-nowrap"
              >
                Sign out
              </button>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-fpl-purpledark shrink-0"
              >
                <span className="text-xl leading-none">{menuOpen ? '✕' : '☰'}</span>
              </button>
            </>
          )}
          {status === 'unauthenticated' && (
            <>
              <Link href="/login" className="px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-fpl-purpledark whitespace-nowrap">
                Log in
              </Link>
              <Link href="/signup" className="px-3 py-1.5 rounded-full bg-fpl-green text-fpl-purple text-sm font-bold whitespace-nowrap">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {status === 'authenticated' && menuOpen && (
        <nav className="sm:hidden bg-fpl-purpledark px-4 pb-3 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-semibold hover:bg-white/10"
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              signOut({ callbackUrl: '/login' });
            }}
            className="text-left px-3 py-2 rounded-md text-sm font-semibold hover:bg-white/10"
          >
            Sign out
          </button>
        </nav>
      )}

      <div className="h-1 bg-fpl-green" />
    </header>
  );
}