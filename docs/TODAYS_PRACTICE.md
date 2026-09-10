# Today’s Practice and worked Iowa lessons

Built on main 9d21f6c (PR #8 merged).

## Learning flow

- `/todays-practice` offers five untimed learn → independent check → worked review items.
- Amir starts from his latest saved incorrect or skipped arithmetic examples. A newer correct answer to the same fact takes precedence. Each check uses a different arithmetic fact, preserving the worked strategy where possible. Without history, use short addition/subtraction warmups.
- Aden starts from the latest answer to each saved Iowa question, prioritizing mistakes. Checks prefer an unseen question with the same skill tag. If none exists, the UI explicitly asks him to retry the same question with the explanation hidden. Without mistakes/history, choose a varied set of worked examples.
- A source answered successfully in a recent daily check gets a three-day break. This is a short review interval, not a mastery claim. Missed sources remain eligible.
- A plan is fixed for the local calendar day once created. New test results feed the next day’s plan. Leaving, reloading, or returning keeps the same plan, phase, and first check answers. Checks do not modify exam scores or claim independent mastery after showing a worked example.
- Daily plans/completion records are stored per student and date on the current device. They do not sync across devices. Save failures are visible and retryable. Iowa attempt history is restored using the existing sync path before creating a new daily plan; a five-second limit permits local history when the network is slow.

## Graded tests become lessons

- Amir’s addition and subtraction worksheets keep the existing visual review and now include a Show steps control beside every graded problem, including correctly answered ones.
- Iowa results automatically open a one-question-at-a-time learning review, defaulting to mistakes. All examples remain available. Numbered steps explain the computation, grammar rule, or evidence. Reading/editing stimuli remain available with the explanation.
- `/learning-notebook` now restores completed Iowa attempts for later study, alongside the existing arithmetic lessons. Old browser summary-only scores do not contain individual answers and cannot be reconstructed into lessons.

## Iowa content

- All 361 original questions have authored explanations and skill tags in `iowa-explanations.json`.
- `iowa-expansion.json` adds 50 questions: five in each of the ten units, including a new reading passage and five linked comprehension questions. Each new question includes a worked explanation.
- Total: 411 stored questions; 408 active. Three legacy punctuation items (1, 5, 14) have ambiguous style or multiple-line corrections. They remain addressable for old scores and drafts but are excluded from new sampling and daily plans. Their historical review explains the ambiguity. No historical answer key or question ID is changed.
- Vocabulary no longer displays an unrelated extracted table as its first question’s passage. Encoded comparison/arrow symbols render as readable text.
- UI sampling and coverage counts use active questions. Original bundled PDF/DOCX practice packages remain the original edition and are not expanded by this change.
- Explanations and new content are authored educational material, not externally certified or official Iowa Assessments questions. Automated checks validate structure, answer-key continuity, sampler behavior, and learning flows, not every editorial judgment.

## Verification and release

- 173 tests across 21 files; TypeScript, lint, and production build pass locally.
- Regression tests cover saved daily checks, reload/resume, first-response scoring, child/day separation, storage failure, recent-answer precedence, matching-skill Iowa selection, all-question explanation coverage, immutable historical keys, and retired-item exclusion.
- Component interaction tests exercise learn → hidden-answer check → graded review → reload → completion. Existing worksheet and Iowa journey tests verify steps appear immediately after grading.
- Browser verification attempted with agent-browser and Playwright. The execution environment prevents Chrome from creating a required socket (`Operation not permitted`); visual/mobile acceptance remains pending.
- No new migration is introduced. Cross-device Iowa history still depends on the existing migration `022_iowa_attempts.sql` from PR #8. No production database or child score was modified for verification.
- Before production acceptance, use an isolated preview/test profile to finish an addition/subtraction worksheet, an Iowa unit, and a daily plan; inspect mobile layout, passage visibility, saved notebook review, and reload behavior.
