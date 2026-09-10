"use server"

import { z } from "zod"
import { getStudentById, getStudentByName, syncIowaAttempts } from "./db"
import { iowaAttemptSchema, type IowaAttempt } from "./iowa-attempts"

/** Uses the app's existing single-family profile picker; only Aden's canonical row. */
export async function syncIowaAttemptsAction(studentId: string, pending: IowaAttempt[]) {
  try {
    if (!z.string().uuid().safeParse(studentId).success) return { ok: false as const }
    const attempts = z.array(iowaAttemptSchema).max(100).parse(pending)
    if (attempts.some((attempt) => attempt.completedAt > Date.now() + 300000)) return { ok: false as const }
    const [student, aden] = await Promise.all([getStudentById(studentId), getStudentByName("Aden")])
    if (!student || student.grade !== 5 || student.id !== aden?.id) return { ok: false as const }
    const rows = await syncIowaAttempts(studentId, attempts)
    return { ok: true as const, attempts: rows.map((row) => iowaAttemptSchema.parse(row.payload)) }
  } catch {
    return { ok: false as const }
  }
}
