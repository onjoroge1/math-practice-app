// Client-side progress tracking for the Iowa practice battery.
// Persists per-student, per-unit results (best/last score, attempts, and which questions have
// been seen so the sampler can favor fresh material) in localStorage — mirroring how the rest
// of the app stores streaks/coins client-side.

export interface UnitProgress {
  best: number // best percent
  last: number // most recent percent
  attempts: number
  seen: number[] // question numbers already answered
  lastAt: number // epoch ms
}

export type ProgressStore = Record<string, UnitProgress>

export interface AttemptDraft {
  unitId: string
  questionNumbers: number[]
  answers: Record<number, string>
  index: number
  startedAt: number
  elapsedMs: number
  updatedAt: number
}

export type DraftStore = Record<string, AttemptDraft>

const key = (studentId: string) => `iowa:v1:${studentId}`
const draftKey = (studentId: string) => `iowa:drafts:v1:${studentId}`

export interface CurrentStudentContext {
  id: string
  grade: number
}

export function currentStudentId(): string {
  if (typeof window === "undefined") return "guest"
  return localStorage.getItem("currentStudentId") || "guest"
}

export function currentStudentContext(): CurrentStudentContext | null {
  if (typeof window === "undefined") return null
  const id = localStorage.getItem("currentStudentId")
  const grade = Number(localStorage.getItem("currentStudentGrade"))
  if (!id || id === "guest" || !Number.isInteger(grade)) return null
  return { id, grade }
}

function read(studentId: string): ProgressStore {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(key(studentId)) || "{}") as ProgressStore
  } catch {
    return {}
  }
}

function write(studentId: string, store: ProgressStore): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key(studentId), JSON.stringify(store))
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

function isAttemptDraft(value: unknown): value is AttemptDraft {
  if (!value || typeof value !== "object") return false
  const draft = value as Partial<AttemptDraft>
  return (
    typeof draft.unitId === "string" &&
    Array.isArray(draft.questionNumbers) &&
    draft.questionNumbers.every(Number.isInteger) &&
    !!draft.answers &&
    typeof draft.answers === "object" &&
    Number.isInteger(draft.index) &&
    typeof draft.startedAt === "number" &&
    typeof draft.elapsedMs === "number" &&
    typeof draft.updatedAt === "number"
  )
}

function readDrafts(studentId: string): DraftStore {
  if (typeof window === "undefined") return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(draftKey(studentId)) || "{}") as Record<string, unknown>
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, AttemptDraft] => isAttemptDraft(entry[1])))
  } catch {
    return {}
  }
}

function writeDrafts(studentId: string, store: DraftStore): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(draftKey(studentId), JSON.stringify(store))
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

export function getAllProgress(studentId: string): ProgressStore {
  return read(studentId)
}

export function getUnitProgress(studentId: string, unitId: string): UnitProgress | null {
  return read(studentId)[unitId] ?? null
}

export function getAllAttemptDrafts(studentId: string): DraftStore {
  return readDrafts(studentId)
}

export function getAttemptDraft(studentId: string, unitId: string): AttemptDraft | null {
  return readDrafts(studentId)[unitId] ?? null
}

export function saveAttemptDraft(
  studentId: string,
  draft: Omit<AttemptDraft, "updatedAt">,
): AttemptDraft {
  const store = readDrafts(studentId)
  const next = { ...draft, updatedAt: Date.now() }
  store[draft.unitId] = next
  writeDrafts(studentId, store)
  return next
}

export function clearAttemptDraft(studentId: string, unitId: string): void {
  const store = readDrafts(studentId)
  if (!(unitId in store)) return
  delete store[unitId]
  writeDrafts(studentId, store)
}

export function recordAttempt(
  studentId: string,
  unitId: string,
  percent: number,
  answeredNumbers: number[],
): UnitProgress {
  const store = read(studentId)
  const prev = store[unitId]
  const seen = new Set<number>(prev?.seen ?? [])
  answeredNumbers.forEach((n) => seen.add(n))
  const next: UnitProgress = {
    best: Math.max(prev?.best ?? 0, percent),
    last: percent,
    attempts: (prev?.attempts ?? 0) + 1,
    seen: [...seen].sort((a, b) => a - b),
    lastAt: Date.now(),
  }
  store[unitId] = next
  write(studentId, store)
  return next
}
