"use server"

import {
  createStudent as dbCreateStudent,
  getStudentById as dbGetStudentById,
  getStudentByName as dbGetStudentByName,
  updateStudentProfile as dbUpdateStudentProfile,
  getAllStudents as dbGetAllStudents,
  getStudentsByParentId as dbGetStudentsByParentId,
  updateStudentStats as dbUpdateStudentStats,
  getMasteryForStudent as dbGetMasteryForStudent,
  updateMastery as dbUpdateMastery,
  createPracticeSession as dbCreatePracticeSession,
  completePracticeSession as dbCompletePracticeSession,
  getRecentSessions as dbGetRecentSessions,
  recordPracticeAttempt as dbRecordPracticeAttempt,
  getAllStudentProgress as dbGetAllStudentProgress,
  getParentDashboard as dbGetParentDashboard,
} from "./db"
import { auth } from "./auth"
import { getProfileByKey } from "./profiles"

/** Get the current authenticated parent ID, or null. */
async function getAuthParentId(): Promise<string | null> {
  try {
    const session = await auth()
    if (session?.user?.role === "admin") return null
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

// ─── Student actions ──────────────────────────────────────────────────────────

export async function getStudentAction(studentId: string) {
  if (!studentId) return null
  try {
    return await dbGetStudentById(studentId)
  } catch {
    return null
  }
}

/**
 * Resolve a fixed kid profile (Amir / Aden) to its `students` row, creating the
 * row on first use. This replaces the old onboarding flow: the same name always
 * maps to the same student, so progress accumulates under that name across
 * devices and shows up in the parent dashboard.
 *
 * Returns null if the database is unreachable so callers can show a retry
 * state without creating an id that cannot be resolved on the next page.
 */
export async function getOrCreateProfileStudentAction(profileKey: string) {
  const profile = getProfileByKey(profileKey)
  if (!profile) throw new Error("Unknown kid profile")

  try {
    const existing = await dbGetStudentByName(profile.name)
    const parentId = await getAuthParentId()

    if (existing) {
      return await dbUpdateStudentProfile(
        existing.id,
        profile.grade,
        profile.avatar,
        parentId ?? undefined,
      )
    }

    return await dbCreateStudent(
      profile.name,
      profile.grade,
      profile.avatar,
      parentId ?? undefined,
    )
  } catch {
    return null
  }
}

// ─── Mastery actions ──────────────────────────────────────────────────────────

export async function getMasteryAction(studentId: string) {
  if (!studentId) return []
  try {
    return await dbGetMasteryForStudent(studentId)
  } catch {
    return []
  }
}

export async function updateMasteryAction(
  studentId: string,
  skillId: string,
  isCorrect: boolean,
) {
  return await dbUpdateMastery(studentId, skillId, isCorrect)
}

// ─── Session actions ──────────────────────────────────────────────────────────

export async function createSessionAction(
  studentId: string,
  sessionType: string,
  grade: number,
) {
  return await dbCreatePracticeSession(studentId, sessionType, grade)
}

export async function completeSessionAction(
  sessionId: string,
  stats: {
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    hintsUsed: number
    coinsEarned: number
    durationSeconds: number
    topicsCovered: string[]
    skillsPracticed: string[]
  },
) {
  return await dbCompletePracticeSession(sessionId, stats)
}

export async function getRecentSessionsAction(studentId: string) {
  if (!studentId) return []
  try {
    const session = await auth()
    if (!session?.user?.id) return []
    if (session.user.role !== "admin") {
      const students = await dbGetStudentsByParentId(session.user.id)
      if (!students.some((student) => student.id === studentId)) return []
    }
    return await dbGetRecentSessions(studentId)
  } catch {
    return []
  }
}

// ─── Attempt actions ──────────────────────────────────────────────────────────

export async function recordAttemptAction(
  sessionId: string,
  studentId: string,
  skillId: string,
  questionText: string,
  correctAnswer: string,
  studentAnswer: string,
  isCorrect: boolean,
  difficultyLevel: number,
  timeSpentSeconds: number,
  hintUsed: boolean,
  vedicTrick?: string,
) {
  return await dbRecordPracticeAttempt(
    sessionId,
    studentId,
    skillId,
    questionText,
    correctAnswer,
    studentAnswer,
    isCorrect,
    difficultyLevel,
    timeSpentSeconds,
    hintUsed,
    vedicTrick,
  )
}

// ─── Dashboard actions ────────────────────────────────────────────────────────

export async function getDashboardDataAction() {
  try {
    const session = await auth()
    if (!session?.user?.id) return []
    if (session.user.role === "admin") return await dbGetAllStudentProgress()
    return await dbGetParentDashboard(session.user.id)
  } catch {
    return []
  }
}

export async function getStudentsForParentAction() {
  try {
    const session = await auth()
    if (!session?.user?.id) return []
    if (session.user.role === "admin") return await dbGetAllStudents()
    return await dbGetStudentsByParentId(session.user.id)
  } catch {
    return []
  }
}

// ─── Stats actions ────────────────────────────────────────────────────────────

export async function updateStudentStatsAction(
  studentId: string,
  coinsEarned: number,
) {
  const student = await dbGetStudentById(studentId)
  if (!student) return null

  const today = new Date().toISOString().split("T")[0]
  const lastPractice = student.last_practice_date
    ? new Date(student.last_practice_date).toISOString().split("T")[0]
    : null

  let newStreak = student.current_streak ?? 0
  if (lastPractice !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]
    newStreak = lastPractice === yesterdayStr ? newStreak + 1 : 1
  }

  const longestStreak = Math.max(newStreak, student.longest_streak ?? 0)

  return await dbUpdateStudentStats(studentId, {
    totalCoins: (student.total_coins ?? 0) + coinsEarned,
    currentStreak: newStreak,
    longestStreak,
    lastPracticeDate: today,
  })
}
