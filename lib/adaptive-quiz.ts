// Adaptive mental-math quiz engine.
//
// Two things make these quizzes different from the fixed speed drills:
//   1. The number ranges are configurable before every run.
//   2. Every individual fact (e.g. "7×8") is scored per student, and facts the
//      student gets wrong are re-drawn more often in later sessions.
//
// Fact stats live in localStorage keyed by student id, so Amir and Aden build
// up separate weak-fact lists on the same device.

export type QuizKind = "mental-math" | "multiplication" | "division"

export type Operation = "+" | "-" | "×" | "÷"

export interface QuizSettings {
  questionCount: number
  timed: boolean
  totalSeconds: number
  /** mental-math only: which operations to mix in. */
  operations: ("+" | "-")[]
  /** mental-math only: smallest / largest term. */
  minTerm: number
  maxTerm: number
  /** multiplication: first factor. division: the divisor. */
  tables: number[]
  /** multiplication: max second factor. division: max quotient. */
  maxFactor: number
  /** Draw extra questions from facts this student has missed before. */
  focusOnMissed: boolean
  /** Ramp difficulty up from an easy start instead of using the full range. */
  autoLevel: boolean
}

export interface QuizQuestion {
  id: number
  a: number
  b: number
  op: Operation
  question: string
  answer: number
  factKey: string
}

export interface FactStat {
  seen: number
  missed: number
  lastMissedAt?: string
}

export type FactStats = Record<string, FactStat>

/** Share of a quiz that may be replaced by previously-missed facts. */
const MAX_REVIEW_SHARE = 0.4

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Record<QuizKind, QuizSettings> = {
  "mental-math": {
    questionCount: 20,
    timed: true,
    totalSeconds: 300,
    operations: ["+", "-"],
    minTerm: 1,
    maxTerm: 20,
    tables: [],
    maxFactor: 10,
    focusOnMissed: true,
    autoLevel: true,
  },
  multiplication: {
    questionCount: 20,
    timed: true,
    totalSeconds: 300,
    operations: ["+"],
    minTerm: 1,
    maxTerm: 20,
    tables: [2, 5, 10],
    maxFactor: 10,
    focusOnMissed: true,
    autoLevel: true,
  },
  division: {
    questionCount: 20,
    timed: true,
    totalSeconds: 300,
    operations: ["+"],
    minTerm: 1,
    maxTerm: 20,
    tables: [2, 5, 10],
    maxFactor: 10,
    focusOnMissed: true,
    autoLevel: true,
  },
}

/**
 * Starting point for a student's first quiz. The same three quizzes serve
 * Grade 2 through Grade 5, so the ceiling scales with the grade — Aden opens on
 * the 2/5/10 tables to 10, Amir on the full tables to 12.
 */
export function defaultSettingsForGrade(kind: QuizKind, grade: number): QuizSettings {
  const base = { ...DEFAULT_SETTINGS[kind] }

  if (kind === "mental-math") {
    base.maxTerm = grade <= 2 ? 20 : grade === 3 ? 50 : grade === 4 ? 100 : 200
    return base
  }

  if (grade <= 2) {
    base.tables = [2, 5, 10]
    base.maxFactor = 10
  } else if (grade === 3) {
    base.tables = [2, 3, 4, 5, 6, 7, 8, 9, 10]
    base.maxFactor = 10
  } else {
    base.tables = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    base.maxFactor = 12
  }
  return base
}

// ─── Difficulty levels ────────────────────────────────────────────────────────

export const MAX_LEVEL = 6

/** Tables that are reachable early — skip counting the student already knows. */
const EASY_TABLES = [1, 2, 5, 10]

/** Largest second factor (multiplication) / quotient (division) per level. */
const FACTOR_LADDER = [3, 5, 6, 8, 10, 12]

/**
 * Narrow the student's chosen settings down to their current level. Level 6 is
 * exactly what they picked; lower levels are an easier slice of it, so the
 * ladder can never push a quiz beyond the configured ceiling.
 */
export function applyLevel(kind: QuizKind, settings: QuizSettings, level: number): QuizSettings {
  if (!settings.autoLevel) return settings
  const lvl = Math.min(MAX_LEVEL, Math.max(1, level))
  if (lvl >= MAX_LEVEL) return settings

  if (kind === "mental-math") {
    // Grow the upper bound across the range the student chose.
    const span = settings.maxTerm - settings.minTerm
    const maxTerm = settings.minTerm + Math.max(1, Math.ceil((span * lvl) / MAX_LEVEL))
    return { ...settings, maxTerm: Math.min(settings.maxTerm, maxTerm) }
  }

  const maxFactor = Math.min(settings.maxFactor, FACTOR_LADDER[lvl - 1])

  // Early levels stay on the easy tables, but only if the student selected
  // some — never override an explicit choice into an empty set.
  let tables = settings.tables
  if (lvl <= 2) {
    const easy = settings.tables.filter((t) => EASY_TABLES.includes(t))
    if (easy.length > 0) tables = easy
  }

  return { ...settings, tables, maxFactor }
}

/**
 * Where the student lands after a quiz. Strong runs move up, weak runs move
 * down one step, and anything in between holds. A short quiz is noisy, so a
 * level only moves on a run of at least 5 answered questions.
 */
export function nextLevel(current: number, accuracy: number, answered: number): number {
  if (answered < 5) return current
  if (accuracy >= 85) return Math.min(MAX_LEVEL, current + 1)
  if (accuracy < 60) return Math.max(1, current - 1)
  return current
}

// ─── Fact helpers ─────────────────────────────────────────────────────────────

export function makeFactKey(a: number, op: Operation, b: number): string {
  return `${a}${op}${b}`
}

export function parseFactKey(key: string): { a: number; op: Operation; b: number } | null {
  const m = /^(\d+)([+\-×÷])(\d+)$/.exec(key)
  if (!m) return null
  return { a: Number(m[1]), op: m[2] as Operation, b: Number(m[3]) }
}

export function buildQuestion(id: number, a: number, op: Operation, b: number): QuizQuestion {
  const answer =
    op === "+" ? a + b :
    op === "-" ? a - b :
    op === "×" ? a * b :
    a / b
  return { id, a, b, op, question: `${a} ${op} ${b}`, answer, factKey: makeFactKey(a, op, b) }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function statsKey(studentId: string, kind: QuizKind) {
  return `factStats:${studentId}:${kind}`
}

function settingsKey(studentId: string, kind: QuizKind) {
  return `quizSettings:${studentId}:${kind}`
}

function levelKey(studentId: string, kind: QuizKind) {
  return `quizLevel:${studentId}:${kind}`
}

/** The student's current rung on the difficulty ladder (1…MAX_LEVEL). */
export function loadLevel(studentId: string, kind: QuizKind): number {
  if (typeof window === "undefined") return 1
  const raw = Number(localStorage.getItem(levelKey(studentId, kind)))
  if (!Number.isFinite(raw) || raw < 1) return 1
  return Math.min(MAX_LEVEL, Math.floor(raw))
}

export function saveLevel(studentId: string, kind: QuizKind, level: number) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(levelKey(studentId, kind), String(Math.min(MAX_LEVEL, Math.max(1, level))))
  } catch {
    // ignore
  }
}

export function loadFactStats(studentId: string, kind: QuizKind): FactStats {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(statsKey(studentId, kind)) || "{}") as FactStats
  } catch {
    return {}
  }
}

export function saveFactStats(studentId: string, kind: QuizKind, stats: FactStats) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(statsKey(studentId, kind), JSON.stringify(stats))
  } catch {
    // storage full or blocked — quiz still works, just without adaptation
  }
}

/** Fold one quiz's results into the student's running fact stats. */
export function recordResults(
  studentId: string,
  kind: QuizKind,
  results: { factKey: string; correct: boolean }[],
): FactStats {
  const stats = loadFactStats(studentId, kind)
  const now = new Date().toISOString()

  for (const r of results) {
    const prev = stats[r.factKey] ?? { seen: 0, missed: 0 }
    stats[r.factKey] = {
      seen: prev.seen + 1,
      missed: prev.missed + (r.correct ? 0 : 1),
      lastMissedAt: r.correct ? prev.lastMissedAt : now,
    }
  }

  saveFactStats(studentId, kind, stats)
  return stats
}

export function clearFactStats(studentId: string, kind: QuizKind) {
  if (typeof window === "undefined") return
  localStorage.removeItem(statsKey(studentId, kind))
}

export function loadSettings(studentId: string, kind: QuizKind, grade = 2): QuizSettings {
  const defaults = defaultSettingsForGrade(kind, grade)
  if (typeof window === "undefined") return defaults
  try {
    const raw = localStorage.getItem(settingsKey(studentId, kind))
    if (!raw) return defaults
    // Merge over defaults so settings saved by an older version stay valid.
    return { ...defaults, ...(JSON.parse(raw) as Partial<QuizSettings>) }
  } catch {
    return defaults
  }
}

export function saveSettings(studentId: string, kind: QuizKind, settings: QuizSettings) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(settingsKey(studentId, kind), JSON.stringify(settings))
  } catch {
    // ignore
  }
}

// ─── Weak facts ───────────────────────────────────────────────────────────────

/** True if a fact is still reachable under the current settings. */
export function factMatchesSettings(
  factKey: string,
  kind: QuizKind,
  settings: QuizSettings,
): boolean {
  const parsed = parseFactKey(factKey)
  if (!parsed) return false
  const { a, op, b } = parsed

  if (kind === "mental-math") {
    if (op !== "+" && op !== "-") return false
    if (!settings.operations.includes(op)) return false
    // For subtraction `a` is the larger of the two terms, so both still sit
    // inside the configured range — lowering the max must retire old facts.
    if (op === "-") {
      return (
        a >= settings.minTerm && a <= settings.maxTerm &&
        b >= settings.minTerm && b <= settings.maxTerm &&
        a - b >= 0
      )
    }
    return a >= settings.minTerm && a <= settings.maxTerm && b >= settings.minTerm && b <= settings.maxTerm
  }

  if (kind === "multiplication") {
    return op === "×" && settings.tables.includes(a) && b >= 1 && b <= settings.maxFactor
  }

  // division: a ÷ b, b is the divisor (the "table"), quotient a/b is the answer
  return op === "÷" && settings.tables.includes(b) && a % b === 0 && a / b >= 1 && a / b <= settings.maxFactor
}

/**
 * Facts this student has missed, worst first. A fact ranks by how often it was
 * missed relative to how often it was seen, so a 2-of-3 miss outranks 2-of-20.
 */
export function getWeakFacts(
  stats: FactStats,
  kind: QuizKind,
  settings: QuizSettings,
): string[] {
  return Object.entries(stats)
    .filter(([key, s]) => s.missed > 0 && factMatchesSettings(key, kind, settings))
    .sort((x, y) => {
      const rateX = x[1].missed / Math.max(1, x[1].seen)
      const rateY = y[1].missed / Math.max(1, y[1].seen)
      if (rateY !== rateX) return rateY - rateX
      return y[1].missed - x[1].missed
    })
    .map(([key]) => key)
}

// ─── Generation ───────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomFact(kind: QuizKind, settings: QuizSettings): { a: number; op: Operation; b: number } {
  if (kind === "mental-math") {
    const ops = settings.operations.length > 0 ? settings.operations : (["+"] as ("+" | "-")[])
    const op = pick(ops)
    const x = randInt(settings.minTerm, settings.maxTerm)
    const y = randInt(settings.minTerm, settings.maxTerm)
    // Grade 2 stays in whole numbers, so subtraction always takes the larger
    // term first.
    if (op === "-") return { a: Math.max(x, y), op, b: Math.min(x, y) }
    return { a: x, op, b: y }
  }

  const tables = settings.tables.length > 0 ? settings.tables : [2]

  if (kind === "multiplication") {
    return { a: pick(tables), op: "×", b: randInt(1, settings.maxFactor) }
  }

  // division — build from a known product so it always divides evenly
  const divisor = pick(tables)
  const quotient = randInt(1, settings.maxFactor)
  return { a: divisor * quotient, op: "÷", b: divisor }
}

/**
 * Build a quiz. When `focusOnMissed` is on, up to 40% of the questions are
 * pulled from facts this student has previously got wrong; the rest are random
 * within the configured ranges.
 */
export function generateQuiz(
  kind: QuizKind,
  settings: QuizSettings,
  stats: FactStats,
): QuizQuestion[] {
  const count = Math.max(1, settings.questionCount)
  const facts: { a: number; op: Operation; b: number }[] = []

  if (settings.focusOnMissed) {
    const weak = getWeakFacts(stats, kind, settings)
    const reviewCount = Math.min(weak.length, Math.floor(count * MAX_REVIEW_SHARE))
    for (let i = 0; i < reviewCount; i++) {
      const parsed = parseFactKey(weak[i])
      if (parsed) facts.push(parsed)
    }
  }

  while (facts.length < count) {
    facts.push(randomFact(kind, settings))
  }

  // Shuffle so review questions aren't all bunched at the front.
  for (let i = facts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[facts[i], facts[j]] = [facts[j], facts[i]]
  }

  return facts.slice(0, count).map((f, i) => buildQuestion(i, f.a, f.op, f.b))
}
