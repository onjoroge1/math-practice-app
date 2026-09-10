import { z } from "zod"
import { getIowaUnit, scoreIowaAttempt } from "./iowa-grade5"
import type { ProgressStore } from "./iowa-progress"

export const iowaAttemptSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().max(50),
  questionNumbers: z.array(z.number().int().positive()).min(1).max(100),
  answers: z.record(z.string().regex(/^\d+$/), z.string().regex(/^[A-E]$/)),
  completedAt: z.number().int().min(946684800000),
  durationSeconds: z.number().int().min(0).max(86400),
}).superRefine((attempt, ctx) => {
  const unit = getIowaUnit(attempt.unitId)
  const unique = new Set(attempt.questionNumbers)
  if (!unit || unique.size !== attempt.questionNumbers.length ||
    Object.keys(attempt.answers).length !== unique.size ||
    !attempt.questionNumbers.every((number) => {
      const question = unit.questions.find((q) => q.number === number)
      return question?.choices.some((choice) => choice.label === attempt.answers[number])
    })) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid or incomplete Iowa attempt" })
})

export type IowaAttempt = z.infer<typeof iowaAttemptSchema>
export type CachedIowaAttempt = IowaAttempt & { synced?: boolean }
const key = (studentId: string) => `iowa:attempts:v2:${studentId}`

export function readIowaAttempts(studentId: string): CachedIowaAttempt[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key(studentId)) || "[]")
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((value) => {
      const valid = iowaAttemptSchema.safeParse(value)
      return valid.success ? [{ ...valid.data, synced: value.synced === true }] : []
    })
  } catch { return [] }
}

export function mergeIowaAttempts(local: CachedIowaAttempt[], remote: IowaAttempt[]): CachedIowaAttempt[] {
  const byId = new Map(local.map((attempt) => [attempt.id, attempt]))
  remote.forEach((attempt) => byId.set(attempt.id, { ...attempt, synced: true }))
  return [...byId.values()].sort((a, b) => b.completedAt - a.completedAt || a.id.localeCompare(b.id))
}

export function writeIowaAttempts(studentId: string, attempts: CachedIowaAttempt[]): boolean {
  try {
    localStorage.setItem(key(studentId), JSON.stringify(attempts))
    return true
  } catch { return false }
}

export function scoreSavedIowaAttempt(attempt: IowaAttempt) {
  const unit = getIowaUnit(attempt.unitId)!
  const questions = attempt.questionNumbers.map((number) => unit.questions.find((q) => q.number === number)!)
  return scoreIowaAttempt(questions, attempt.answers)
}

/** Legacy browser summaries are a separate baseline; v2 IDs are counted once. */
export function summarizeIowaAttempts(legacy: ProgressStore, attempts: IowaAttempt[]): ProgressStore {
  const progress: ProgressStore = Object.fromEntries(Object.entries(legacy).map(([id, p]) => [id, { ...p, seen: [...p.seen] }]))
  const unique = new Map(attempts.map((attempt) => [attempt.id, attempt]))
  for (const attempt of unique.values()) {
    const outcome = scoreSavedIowaAttempt(attempt)
    const previous = progress[attempt.unitId]
    const newer = !previous || attempt.completedAt >= previous.lastAt
    progress[attempt.unitId] = {
      best: Math.max(previous?.best ?? 0, outcome.percent),
      last: newer ? outcome.percent : previous.last,
      attempts: (previous?.attempts ?? 0) + 1,
      seen: [...new Set([...(previous?.seen ?? []), ...attempt.questionNumbers])].sort((a, b) => a - b),
      lastAt: Math.max(previous?.lastAt ?? 0, attempt.completedAt),
    }
  }
  return progress
}
