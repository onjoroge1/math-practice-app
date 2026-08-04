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

const key = (studentId: string) => `iowa:v1:${studentId}`

export function currentStudentId(): string {
  if (typeof window === "undefined") return "guest"
  return localStorage.getItem("currentStudentId") || "guest"
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

export function getAllProgress(studentId: string): ProgressStore {
  return read(studentId)
}

export function getUnitProgress(studentId: string, unitId: string): UnitProgress | null {
  return read(studentId)[unitId] ?? null
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
