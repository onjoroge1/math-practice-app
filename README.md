# Math Practice App

An adaptive math practice application for grades 1-5, featuring timed drills, Vedic math tricks, mastery tracking, and a parent dashboard.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Database:** Neon PostgreSQL (serverless)
- **Analytics:** Vercel Analytics
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 20.9+
- pnpm (`npm install -g pnpm`)
- A [Neon](https://neon.tech) PostgreSQL database (for persistence)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Existing database: apply non-destructive migrations (requires DATABASE_URL)
pnpm db:migrate

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For a brand-new disposable database, initialize the schema and then record the
incremental migrations:

```bash
ALLOW_DB_RESET=1 pnpm db:reset
pnpm db:migrate
```

`db:reset` deletes existing application data and refuses to run unless
`ALLOW_DB_RESET=1` is set. Routine deployments should use only `db:migrate`.

### Environment Variables

See `.env.example` for all required variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (for persistence) | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | No | App base URL (defaults to localhost:3000) |
| `AUTH_SECRET` | Yes | Auth.js session signing secret |
| `AUTH_TRUST_HOST` | Local/proxy | Set to `true` only when the app is behind a trusted proxy; Vercel sets it automatically |
| `PARENT_ADMIN_USERNAME` | No | Parent portal username (defaults to `admin`) |
| `PARENT_ADMIN_PASSWORD` | Yes | Private parent password, at least 12 characters; never commit it |

The parent portal is a single-family admin area. Public signup is disabled. Set
the credential only through local or deployment environment variables, then
sign in at `/login`.

### Kid profiles

Profiles are defined in `lib/profiles.ts` and seeded into the database. To add them to an
existing database without wiping progress:

```bash
pnpm db:seed-profiles
```

`pnpm db:migrate` applies each file in `scripts/migrations` once and verifies that applied
migrations have not been edited. For a disposable fresh database only, run
`ALLOW_DB_RESET=1 pnpm db:reset`; the reset command drops every application table.

## App Flow

1. **Home** (`/`) — Profile picker: tap **Amir** (Grade 2) or **Aden** (Grade 5). There is no
   sign-up or onboarding; each name maps to a fixed `students` row, so all progress accumulates
   under that name and shows up in the parent portal.
2. **Topic Select** (`/topic-select`) — Choose math topics and practice mode (adaptive or speed drill)
3. **Diagnostic** (`/diagnostic`) — Quick assessment to gauge current level
4. **Practice** (`/practice`) — Adaptive practice with hints, explanations, and Vedic tricks
5. **Speed Drills** (`/timed-drill`, `/grade2-addition-drill`, etc.) — 50 questions in 5 minutes

### Adaptive Quizzes (Grades 2–5)

`/mental-math-quiz`, `/times-tables-quiz`, and `/division-quiz` share
`components/mental-math-quiz.tsx` and are offered on every grade from 2 to 5. Each opens on a
settings screen where the number ranges, times tables (individually or via presets like
*Easy (2, 5, 10)* and *Mix (2–9)*), question count, and timer are all adjustable. Logic lives in
`lib/adaptive-quiz.ts` and adapts in two independent ways:

- **Difficulty ladder** — 6 levels, stored per student per quiz. Level 1 stays on the easy tables
  with small factors; level 6 is the full range the student selected. A run at 85%+ moves up a
  level, below 60% moves down, and runs shorter than 5 answered questions never move it. The
  ladder only ever *narrows* the chosen settings, so it can't exceed the configured ceiling.
  Turn it off with **Start easy and build up**.
- **Missed-fact review** — every individual fact (e.g. `7 × 8`) is scored per student. Facts the
  student gets wrong are ranked by miss rate and re-drawn in later quizzes, filling up to 40% of
  the next run. Turn it off with **Practice missed facts more often**.

Starting ranges scale with the student's grade (`defaultSettingsForGrade`): Grade 2 opens on the
2/5/10 tables to 10, Grade 5 on all tables to 12.
6. **Summary** (`/practice/summary`) — Student progress dashboard with streaks, coins, skills
7. **Parent Dashboard** (`/parent`) — Parent view of student progress and recommendations

## Project Structure

```
app/              # Next.js App Router pages
components/       # Shared components
  ui/             # shadcn/ui primitives (54 components)
  drill-page.tsx  # Reusable drill component (grid + sequential modes)
hooks/            # Custom React hooks
lib/              # Core logic
  adaptive-engine.ts  # Adaptive difficulty engine
  db.ts              # Neon database operations
  mock-data.ts       # Static skills and question bank
  types.ts           # TypeScript types
  utils.ts           # Tailwind cn() helper
scripts/          # SQL migrations
public/           # Static assets
```

## Current Status

See [Learning improvements and current review](docs/LEARNING_IMPROVEMENTS_2026-09-10.md)
for the saved Iowa scores, arithmetic teaching notebook, release migration, and
prioritized next improvements. `PRODUCTION_PLAN.md` is the original prototype
audit; several of its listed gaps have since been addressed.
