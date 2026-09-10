# Learning improvements for Aden and Amir

Reviewed against main `209902b` on September 10, 2026. This is a current review;
`PRODUCTION_PLAN.md` describes an older prototype and incorrectly lists several
implemented features (database actions, parent login, tests, CI) as missing.

## Changes in this PR

### Aden: Iowa scores he can return to

- Keep best percentage, latest percentage, attempts, coverage, and last-practiced
  date on every completed unit card.
- Show ten recent dated scores with correct/total and a visual percentage bar,
  both on the Iowa hub and after finishing a unit.
- Save completed attempts locally before network work. Mirror immutable attempt
  IDs to PostgreSQL, restore them on the Iowa hub, and retry pending records on
  later visits, reconnection, or the retry button. Repeated saves count once.
- Validate units, question IDs, and answer choices on the server; derive displayed
  scores from the answer key. Scope the new action to Aden's canonical Grade 5 row.
- Preserve existing browser summaries as a legacy baseline. Their historical
  dates and individual answers cannot be reconstructed from best/latest totals.
  Those earlier totals remain on their original device; new attempts sync.
- Show whether scores synced, saved only on this device, or could not be saved.
  Do not discard an unsaved draft or allow a fresh run to reuse an in-flight ID.

### Amir: practice becomes a lesson

- The shared review explains completed whole-number addition/subtraction in
  worksheet tests, grid and sequential speed drills, mental math quizzes, and
  supported numeric questions at the end of adaptive practice.
- Start with missed or skipped questions. Offer all examples, including correct
  answers. Use one worked problem at a time, big numbers, small colored jumps,
  and ten-frame counters for facts within 20. No timer in the teaching section.
- Handle making ten, crossing a ten, counting back, tens/ones, zero, and equal
  subtraction. Derive explanations deterministically and check the answer key.
  Keep existing authored explanations for word problems, missing operands,
  fractions, decimals, and other unsupported formats.
- Save the latest review per topic and child in **My learning notebook**, linked
  from topics and results. Notebook persistence is on the same device in this PR.
- Expose the previously unreachable subtraction speed drill with its own topic
  card. Correct the addition generator so “within 100” cannot produce sums to 200.
- A corrupt/full local drill backup no longer prevents displaying the completed
  review. Timer-driven completion no longer performs parent updates inside a
  React state updater; duplicate completion is guarded.

## Highest-value next additions

| Priority | Addition | Why this is next |
| --- | --- | --- |
| 1 | A short “Today’s practice” plan | Turn saved mistakes into 3–5 untimed examples followed by a short independent retry. The quiz fact-history engine already exists; connect it to a daily learning flow. |
| 2 | Skill-level Iowa explanations and targeted retry | Iowa records choices and answer keys but has no explanation/skill tag per question. Add reviewed rationales and skill IDs, then recommend the specific skill to revisit. |
| 3 | More question variants and complete coverage | The adaptive bank has 35 questions across 10 Grade 2 skills and 32 across 8 Grade 5 skills. Grade 4 skills `multiply-multi-digit` and `divide-multi-digit` have no direct items. Expand actual content before adding many more modes. These counts exclude generated drills and the separate 361-question Iowa bank. |
| 4 | A useful parent weekly view | Show recent performance by skill, repeated mistakes, improvement, and one next action for each child. Separate first-try answers from helped retries and show completion alongside accuracy. |
| 5 | Family access and durable learning records | The current app intentionally uses a public fixed-profile picker. Existing student actions generally accept IDs without a parent session; it is not ready for multiple families. Establish family/device authorization, then sync notebooks and remaining local learning state. |

Also fix mode routing as the app grows: several unsupported selections fall
through to unrelated speed drills, and the README says Grade 2 has adaptive
quizzes although its current topic list does not expose those quiz cards.
The Iowa score percentages are independent practice scores, not official Iowa
percentiles. Per-attempt changes do not by themselves prove mastery because
question samples differ.

## Release and verification

The new table is created by the additive migration
`scripts/migrations/022_iowa_attempts.sql`. Run the existing migration command
against the deployment database before expecting cross-device Iowa sync:

```sh
pnpm db:migrate
```

The existing command reads `.env.local`; use the project's normal private
environment setup. Do not use `db:reset` on existing student data. Without the
migration or database access, the UI stays usable with explicitly labeled local
score persistence. This PR does not run a production migration or merge itself.

Verification includes regression tests for reload/retry/deduplication, restored
scores on a fresh device, child separation, bad payloads, storage failures,
notebook reopening, unanswered questions, and sequential timer expiry. Worked
arithmetic is checked over every supported addition/subtraction pair from 0–100.
The actual database function and migration are also exercised against an isolated
PostgreSQL engine (PGlite), including immutable retries and migration reruns.

For deployment acceptance: complete one Iowa unit, return to `/iowa`, reload, and
verify the same best/latest/count. Open Aden on another device and verify the new
attempt appears. Complete Amir's addition and subtraction tests, open the notebook,
and inspect one missed, one skipped, and one correct problem. These checks must use
test data or an isolated preview database to avoid adding artificial real scores.
