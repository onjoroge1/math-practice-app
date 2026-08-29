// Shared persistence for timed drill / quiz results. Writes a local backup
// first, then mirrors the session to the database when a real student row and
// connection are available.

import { createSessionAction, completeSessionAction, updateStudentStatsAction } from "@/lib/actions"

export interface DrillResult {
  topic: string
  subject: string
  correct: number
  total: number
  answered: number
  accuracy: number
  completedAt: string
}

export function saveDrillResultLocal(result: DrillResult) {
  if (typeof window === "undefined") return
  const studentId = localStorage.getItem("currentStudentId") || "guest"
  const key = `drillResults_${studentId}`
  const existing: DrillResult[] = JSON.parse(localStorage.getItem(key) || "[]")
  existing.unshift(result)
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)))
}

export async function saveDrillResultToDB(result: DrillResult, startTime: number) {
  if (typeof window === "undefined") return
  const studentId = localStorage.getItem("currentStudentId")
  // `local-*` ids are the offline fallback from the profile picker — nothing to
  // sync them to.
  if (!studentId || studentId === "guest" || studentId.startsWith("local-")) return

  const gradeStr = localStorage.getItem("currentStudentGrade")
  const grade = gradeStr ? parseInt(gradeStr, 10) : 1

  try {
    const session = await createSessionAction(studentId, "speed-drill", grade)
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000)

    await completeSessionAction(session.id, {
      totalQuestions: result.total,
      correctAnswers: result.correct,
      incorrectAnswers: result.answered - result.correct,
      hintsUsed: 0,
      coinsEarned: Math.floor(result.correct * 0.5),
      durationSeconds,
      topicsCovered: [result.topic],
      skillsPracticed: [],
    })

    await updateStudentStatsAction(studentId, Math.floor(result.correct * 0.5))
  } catch {
    // DB save failed — local backup above is the fallback
  }
}

/** Save a finished drill/quiz both locally and (best effort) to the database. */
export function saveDrillResult(result: DrillResult, startTime: number) {
  saveDrillResultLocal(result)
  void saveDrillResultToDB(result, startTime)
}
