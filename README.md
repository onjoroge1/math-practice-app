# Math Practice App

An adaptive math practice application for grades 1-4, featuring timed drills, Vedic math tricks, mastery tracking, and a parent dashboard.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Database:** Neon PostgreSQL (serverless)
- **Analytics:** Vercel Analytics
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Neon](https://neon.tech) PostgreSQL database (for persistence)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Run database migrations (requires DATABASE_URL)
# node scripts/run-migrations.js

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for all required variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (for persistence) | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | No | App base URL (defaults to localhost:3000) |

## App Flow

1. **Home** (`/`) — Landing page with Start Learning and Parent Dashboard CTAs
2. **Onboarding** (`/onboarding`) — Student enters name, grade (1-4), and picks an avatar
3. **Topic Select** (`/topic-select`) — Choose math topics and practice mode (adaptive or speed drill)
4. **Diagnostic** (`/diagnostic`) — Quick assessment to gauge current level
5. **Practice** (`/practice`) — Adaptive practice with hints, explanations, and Vedic tricks
6. **Speed Drills** (`/timed-drill`, `/grade2-addition-drill`, etc.) — 50 questions in 5 minutes
7. **Summary** (`/practice/summary`) — Student progress dashboard with streaks, coins, skills
8. **Parent Dashboard** (`/parent`) — Parent view of student progress and recommendations

## Project Structure

```
app/              # Next.js App Router pages
components/       # Shared components
  ui/             # shadcn/ui primitives (54 components)
  drill-page.tsx  # Reusable drill component (grid + sequential modes)
hooks/            # Custom React hooks
lib/              # Core logic
  adaptive-engine.ts  # Adaptive difficulty engine
  db.ts              # Neon database operations (not yet wired)
  mock-data.ts       # In-memory data + question bank
  types.ts           # TypeScript types
  utils.ts           # Tailwind cn() helper
scripts/          # SQL migrations
public/           # Static assets
```

## Current Status

This app was scaffolded with v0 and is in **prototype** stage. See `PRODUCTION_PLAN.md` for the full list of gaps and the roadmap to production readiness.
