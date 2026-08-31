export interface SocialStudiesTestProgress {
  best: number
  last: number
  attempts: number
  lastAt: number
}

export type SocialStudiesProgressStore = Record<string, SocialStudiesTestProgress>

const storageKey = (studentId: string) => `social-studies:v1:${studentId}`

function read(studentId: string): SocialStudiesProgressStore {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(storageKey(studentId)) || "{}") as SocialStudiesProgressStore
  } catch {
    return {}
  }
}

export function getAllSocialStudiesProgress(studentId: string): SocialStudiesProgressStore {
  return read(studentId)
}

export function recordSocialStudiesAttempt(studentId: string, testId: string, percent: number) {
  const store = read(studentId)
  const previous = store[testId]
  const next: SocialStudiesTestProgress = {
    best: Math.max(previous?.best ?? 0, percent),
    last: percent,
    attempts: (previous?.attempts ?? 0) + 1,
    lastAt: Date.now(),
  }
  store[testId] = next
  try {
    localStorage.setItem(storageKey(studentId), JSON.stringify(store))
  } catch {
    // A database session is also attempted by the quiz runner; storage failure is non-fatal.
  }
  return next
}
