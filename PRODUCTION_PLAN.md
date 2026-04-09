# Production Readiness Plan

> Generated 2026-04-06 after full codebase audit.

## Current State: Prototype

The app was scaffolded with v0.app. The UI is polished and the question bank is substantial (~180 items across grades 1-4). However, **all data lives in-memory arrays and localStorage** — nothing persists across page refreshes or between devices. The database layer (`lib/db.ts`) exists but is imported nowhere. There is no auth, no API layer, no tests, and no CI/CD.

---

## Gap Analysis

### P0 — Critical (App doesn't function properly without these)

| # | Gap | Details |
|---|-----|---------|
| 1 | **No data persistence** | Students, mastery, drill results all stored in in-memory arrays (`STUDENTS`, `MASTERY_DATA`) that reset on every page load. `localStorage` is used for streaks/coins but is device-bound and easily lost. |
| 2 | **Database layer is dead code** | `lib/db.ts` has full CRUD for Neon but is imported by zero files. Need API routes or Server Actions to bridge client components to the database. |
| 3 | **No API routes** | Zero `route.ts` files exist. Client components can't call `lib/db.ts` directly (it uses `process.env.DATABASE_URL`). |
| 4 | **Schema drift** | SQL script `019_complete_schema_setup.sql` uses `name` on parents, `db.ts` uses `full_name`. `practice_sessions` columns differ between SQL and db.ts (`grade` column missing from SQL, `incorrect_count` missing from SQL mastery table). Multiple competing schema versions. |
| 5 | **Orphan skills in question bank** | `make-10`, `doubles`, `add-9`, `halves` have 50+ questions in `MATH_ITEMS` but no matching entries in the `SKILLS` array — these questions are unreachable through the adaptive engine. Same issue for grade 4 skills `measurement`, `geometry`, `place-value` (items exist, skill IDs don't match). |
| 6 | **Onboarding creates ephemeral students** | `createStudent()` pushes to an in-memory array. Refreshing the page loses the student. The `currentStudentId` in localStorage points to nothing after reload. |

### P1 — High (Required for a usable product)

| # | Gap | Details |
|---|-----|---------|
| 7 | **No authentication** | No parent login/signup. `lib/db.ts` has `createParent` with password hashing but nothing calls it. No sessions, no middleware, no route protection. |
| 8 | **Parent dashboard reads empty arrays** | `parent/page.tsx` reads from `STUDENTS` (always empty on load) and `MASTERY_DATA`. Dashboard will always show "No Students Yet". |
| 9 | **Incomplete topic routing** | Grade 2 speed drills always route to addition regardless of topic selection. Grade 3 always routes to multiplication. Many grade/topic combos fall through to a default. |
| 10 | **No error boundaries** | No `error.tsx`, `loading.tsx`, or `not-found.tsx` anywhere. Unhandled errors crash the entire app with a white screen. |
| 11 | **Missing favicon PNGs** | `layout.tsx` references `icon-light-32x32.png`, `icon-dark-32x32.png`, `apple-icon.png` — none exist in `public/`. Console 404s on every page load. |
| 12 | **Placeholder branding** | Metadata title is "v0 App", description is "Created with v0". Generator tag says "v0.app". |
| 13 | **TypeScript build errors suppressed** | `next.config.mjs` has `ignoreBuildErrors: true`. Hides real type errors in production builds. |
| 14 | **console.log in production** | `diagnostic/page.tsx` line 69 has debug logging that ships to users. |

### P2 — Medium (Quality & robustness)

| # | Gap | Details |
|---|-----|---------|
| 15 | **No tests** | Zero test files. No Jest, Vitest, or testing library configured. No test scripts in `package.json`. |
| 16 | **No CI/CD** | No `.github/workflows/` or any CI config. No automated checks on PRs. |
| 17 | **No input validation** | Student name, answers, and all form inputs are unvalidated. No zod schemas on the data flow despite zod being installed. |
| 18 | **No ESLint in devDependencies** | `pnpm lint` exists but `eslint` isn't installed. Linting will fail. |
| 19 | **Duplicate files** | `app/globals.css` and `styles/globals.css` both exist (only one imported). `hooks/use-mobile.ts` and `components/ui/use-mobile.tsx` are duplicates. `hooks/use-toast.ts` and `components/ui/use-toast.ts` are duplicates. |
| 20 | **ThemeProvider unused** | `components/theme-provider.tsx` exists but isn't wrapped in `layout.tsx`. Dark mode won't work. |
| 21 | **Next.js security vulnerability** | Current `next@16.0.7` has a known security issue (flagged by pnpm). Should upgrade to patched version. |
| 22 | **Stale dependencies** | Many Radix UI packages, React, vaul, and others are significantly behind latest. `vaul@0.9.9` has peer dep conflicts with React 19. |

### P3 — Low (Polish & production hardening)

| # | Gap | Details |
|---|-----|---------|
| 23 | **No accessibility audit** | Custom buttons (raw `<button>` elements) lack ARIA labels. No skip links. No focus management after navigation. Drill inputs lack labels. |
| 24 | **No SEO / Open Graph** | No og:image, no structured data, no per-page metadata. Single global title. |
| 25 | **No rate limiting** | Once API routes exist, no protection against abuse. |
| 26 | **No analytics events** | Vercel Analytics is loaded but no custom events are tracked (drills started, completed, topics selected, etc.). |
| 27 | **No offline support / PWA** | Math practice is a great PWA candidate (kids on tablets, spotty wifi). No service worker or manifest. |
| 28 | **Fonts loaded but unused** | `Geist` and `Geist_Mono` are loaded in `layout.tsx` but stored in underscore-prefixed variables and never applied to the body. |

---

## Production TODO List

### Phase 1: Foundation (Make it actually work)

- [ ] **1.1** Reconcile database schema — unify `019_complete_schema_setup.sql`, `run-migrations.js`, and `lib/db.ts` into one authoritative schema. Add missing columns (`incorrect_count`, `grade` on sessions, `full_name` on parents, etc.)
- [ ] **1.2** Add orphan skills to SKILLS array — `make-10`, `doubles`, `add-9`, `halves` for grade 1; `measurement`, `geometry`, `place-value` skill entries for grade 4 items
- [ ] **1.3** Create Server Actions or API routes — bridge `lib/db.ts` to the UI. Key endpoints: create/get student, record attempts, update mastery, get progress, parent dashboard data
- [ ] **1.4** Wire onboarding to database — replace `createStudent()` mock with real DB insert via server action
- [ ] **1.5** Wire drill results to database — replace `saveDrillResult()` localStorage with DB persistence
- [ ] **1.6** Wire mastery tracking to database — replace `updateMastery()` mock with real DB upsert
- [ ] **1.7** Wire parent dashboard to database — replace in-memory reads with server-fetched data
- [ ] **1.8** Wire practice/summary to database — load student, mastery, skills from DB
- [ ] **1.9** Fix topic routing — ensure all grade/topic combinations route to appropriate drills (especially grade 2 subtraction, grade 3 division)

### Phase 2: Auth & Security

- [ ] **2.1** Add authentication (NextAuth.js or Clerk) — parent signup/login flow
- [ ] **2.2** Add middleware for protected routes — parent dashboard requires login, student routes require valid student
- [ ] **2.3** Add session management — link students to authenticated parents
- [ ] **2.4** Remove `ignoreBuildErrors: true` from next.config.mjs and fix any TS errors
- [ ] **2.5** Remove console.log from diagnostic page
- [ ] **2.6** Add input validation with zod on all forms and API boundaries
- [ ] **2.7** Upgrade Next.js to patch security vulnerability

### Phase 3: Reliability & DX

- [ ] **3.1** Add error boundaries — `error.tsx`, `loading.tsx`, `not-found.tsx` in app root and key route groups
- [ ] **3.2** Install ESLint + configure — add to devDependencies, add `.eslintrc` config
- [ ] **3.3** Add tests — Jest + React Testing Library. Start with: adaptive engine logic, drill scoring, mastery calculation, API routes
- [ ] **3.4** Set up CI/CD — GitHub Actions for lint, typecheck, test on PRs
- [ ] **3.5** Clean up duplicates — remove `styles/globals.css`, deduplicate hooks
- [ ] **3.6** Wire ThemeProvider in layout for dark mode support
- [ ] **3.7** Fix branding — update metadata title/description, generate proper favicons
- [ ] **3.8** Apply Geist font to body element
- [ ] **3.9** Update dependencies — especially Next.js, vaul (peer dep issue), Radix UI

### Phase 4: Polish & Production Hardening

- [ ] **4.1** Accessibility pass — ARIA labels, focus management, keyboard navigation, screen reader testing
- [ ] **4.2** Add per-page SEO metadata and Open Graph images
- [ ] **4.3** Add custom Vercel Analytics events (drill_started, drill_completed, onboarding_completed, etc.)
- [ ] **4.4** Add rate limiting to API routes
- [ ] **4.5** PWA support — service worker, manifest, offline question cache
- [ ] **4.6** Performance audit — Lighthouse, bundle analysis, image optimization
- [ ] **4.7** Add CHANGELOG.md and version tracking
- [ ] **4.8** Deploy to Vercel with proper environment variables

---

## Effort Estimates

| Phase | Items | Effort |
|-------|-------|--------|
| Phase 1 | 9 items | ~2-3 days |
| Phase 2 | 7 items | ~1-2 days |
| Phase 3 | 9 items | ~1-2 days |
| Phase 4 | 8 items | ~2-3 days |
| **Total** | **33 items** | **~6-10 days** |

## Recommended Order

Start with **Phase 1** (data actually persists) → **Phase 2** (users can log in) → **Phase 3** (it won't break silently) → **Phase 4** (it's polished and production-grade).

Within Phase 1, the critical path is: schema reconciliation (1.1) → server actions (1.3) → wire onboarding (1.4) → wire drills (1.5) → wire mastery (1.6).
