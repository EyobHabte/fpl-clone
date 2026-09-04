# Weekly Fantasy (FPL-style clone)

A fantasy football platform with the look and structure of the official Fantasy
Premier League site, but with two custom rules:

- **A brand-new league (leaderboard) every gameweek** — everyone starts level each week.
- **Unlimited transfers, budget-limited** — your squad persists week to week; you can
  swap any number of players at any time, as long as your total squad value stays
  within your budget cap (default £100.0m). No free-transfer counting, no point hits.

Real player data (names, clubs, prices, points) is pulled live from the official,
public FPL API — no manual data entry needed.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind — frontend & API routes in one app
- **PostgreSQL + Prisma** — persistence
- **NextAuth** — auth (stubbed with a demo user for now, see `src/lib/auth.ts`)

## Getting started

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL
npx prisma migrate dev --name init
npm run dev
```

Then sync real player/club/gameweek data from FPL:

```bash
curl http://localhost:3000/api/fpl/sync
```

Visit `http://localhost:3000` — you'll land on Pick Team (empty at first).
Go to **Transfers** to build your first 15, subject to the standard FPL squad
shape (2 GK / 5 DEF / 5 MID / 3 FWD, max 3 players per real club) and your budget.

## Project structure

```
prisma/schema.prisma        # DB schema — see model comments for the game logic
src/lib/fpl.ts               # Official FPL API client + sync
src/lib/auth.ts              # Auth stub — swap in real NextAuth session lookup
src/app/api/fpl/sync         # GET: refresh players/prices/points from FPL
src/app/api/squad            # GET current squad, POST to buy/sell (transfer)
src/app/api/players          # GET player list for the transfer market, filterable
src/app/page.tsx             # Pick Team — pitch view
src/app/transfers/page.tsx   # Transfer market
src/app/leagues/page.tsx     # This gameweek's leaderboard
src/components/Pitch.tsx     # Formation layout
src/components/PlayerCard.tsx# FPL-style player "shirt" card
```

## Gameweek deadline automation

At each gameweek's deadline, `/api/cron/process-deadlines` snapshots every valid 15-man squad's
current lineup into that gameweek's history, and opens the weekly league (with an entry for every
user who had a valid lineup saved). It's safe to call more than once - already-processed gameweeks
are skipped, and re-running mid-processing won't create duplicates.

**In production (Vercel):** `vercel.json` schedules this to run every 10 minutes automatically. Set
a `CRON_SECRET` environment variable in your Vercel project (any random string, e.g.
`openssl rand -base64 32`) - Vercel automatically sends it as a Bearer token to the endpoint when the
variable is named exactly `CRON_SECRET`, which is what authenticates the cron request.

**Locally**, nothing triggers this automatically - Vercel Cron only runs on deployed projects. To
test it yourself:

```bash
curl -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d '=' -f2 | tr -d '\"')" \
  http://localhost:3000/api/cron/process-deadlines
```

While a gameweek's deadline has passed but hasn't been processed yet, the transfer and lineup APIs
return a `423 Locked` response with a friendly message - this window is normally just a few minutes,
bounded by how often the cron job runs.

## Live scoring

The same cron run also updates scores: for every gameweek that's been snapshotted (`processedAt`
set) but not yet finalized (`scoredAt` still null), it pulls FPL's own live per-player points
(`/api/event/{id}/live/` - this already includes bonus points and every other rule FPL applies, so
there's no need to reimplement their scoring formula), then for each squad:

- **Bench auto-substitution**: any starter with 0 minutes gets swapped for the first bench player
  (in bench order) who did play, as long as the swap keeps the formation valid - same as real FPL.
- **Captain doubling with vice-captain fallback**: the captain's points count double if they played;
  if they didn't, the armband effectively passes to the vice-captain instead (only if the vice is
  among the effective starters and also played).
- Updates that gameweek's league table (`LeagueEntry.points`) and re-ranks it.

This recomputes on every cron run while a gameweek is in progress, so scores update continuously as
matches happen, and only get marked final (`scoredAt`) once FPL itself reports the gameweek finished.

## What's next (not yet built)

1. **Deploy**: Vercel for the app + Neon or Supabase for Postgres both have generous free tiers, and Vercel Cron (already configured in `vercel.json`) handles both `/api/fpl/sync` scheduling (add your own cron entry for it) and the deadline/scoring job.

This is intentionally scaffolded rather than fully complete — it's meant to be a
solid, correctly-modeled starting point you (or Claude Code) can build on
feature by feature.
