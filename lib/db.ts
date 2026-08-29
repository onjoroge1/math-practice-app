import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

let _sql: NeonQueryFunction<false, false> | null = null

/** Lazy-initialized neon client. Defers the `neon()` call until first query. */
function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set. Please configure it in .env.local",
      )
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql(strings, ...values)
}

// ─── Parent operations ────────────────────────────────────────────────────────

/** Create a new parent account. */
export async function createParent(email: string, passwordHash: string, fullName: string) {
  const result = await sql`
    INSERT INTO parents (email, password_hash, full_name)
    VALUES (${email}, ${passwordHash}, ${fullName})
    RETURNING id, email, full_name, created_at
  `
  return result[0]
}

/** Look up a parent by email (for login). */
export async function getParentByEmail(email: string) {
  const result = await sql`
    SELECT id, email, password_hash, full_name, created_at, subscription_tier
    FROM parents
    WHERE email = ${email} AND is_active = true
  `
  return result[0]
}

/** Look up a parent by ID. */
export async function getParentById(parentId: string) {
  const result = await sql`
    SELECT id, email, full_name, phone, created_at, subscription_tier
    FROM parents
    WHERE id = ${parentId} AND is_active = true
  `
  return result[0]
}

// ─── Student operations ───────────────────────────────────────────────────────

/** Create a student. `parentId` is nullable until auth is wired. */
export async function createStudent(
  name: string,
  grade: number,
  avatar: string,
  parentId?: string,
) {
  const result = await sql`
    INSERT INTO students (parent_id, name, grade, avatar)
    VALUES (${parentId ?? null}, ${name}, ${grade}, ${avatar})
    RETURNING *
  `
  return result[0]
}

export async function getStudentById(studentId: string) {
  const result = await sql`
    SELECT * FROM students
    WHERE id = ${studentId} AND is_active = true
  `
  return result[0]
}

/** Look up a student by name (case-insensitive). Used by the fixed kid profiles. */
export async function getStudentByName(name: string) {
  const result = await sql`
    SELECT * FROM students
    WHERE LOWER(name) = LOWER(${name}) AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1
  `
  return result[0]
}

export async function getStudentsByParentId(parentId: string) {
  const result = await sql`
    SELECT * FROM students
    WHERE parent_id = ${parentId} AND is_active = true
    ORDER BY created_at DESC
  `
  return result
}

/** Get all students (for parent-less browsing during Phase 1). */
export async function getAllStudents() {
  const result = await sql`
    SELECT * FROM students
    WHERE is_active = true
    ORDER BY created_at DESC
  `
  return result
}

export async function updateStudentStats(
  studentId: string,
  updates: {
    totalCoins?: number
    currentStreak?: number
    longestStreak?: number
    lastPracticeDate?: string
  },
) {
  const result = await sql`
    UPDATE students
    SET
      total_coins = COALESCE(${updates.totalCoins ?? null}, total_coins),
      current_streak = COALESCE(${updates.currentStreak ?? null}, current_streak),
      longest_streak = COALESCE(${updates.longestStreak ?? null}, longest_streak),
      last_practice_date = COALESCE(${updates.lastPracticeDate ?? null}, last_practice_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${studentId}
    RETURNING *
  `
  return result[0]
}

// ─── Mastery tracking ─────────────────────────────────────────────────────────

export async function getMasteryForStudent(studentId: string) {
  const result = await sql`
    SELECT skill_id, mastery_level, attempts_count, correct_count, incorrect_count, last_practiced_at
    FROM mastery_tracking
    WHERE student_id = ${studentId}
  `
  return result
}

export async function updateMastery(
  studentId: string,
  skillId: string,
  masteryLevel: number,
  isCorrect: boolean,
) {
  const result = await sql`
    INSERT INTO mastery_tracking (student_id, skill_id, mastery_level, attempts_count, correct_count, incorrect_count, last_practiced_at)
    VALUES (
      ${studentId},
      ${skillId},
      ${masteryLevel},
      1,
      ${isCorrect ? 1 : 0},
      ${isCorrect ? 0 : 1},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (student_id, skill_id)
    DO UPDATE SET
      mastery_level = ${masteryLevel},
      attempts_count = mastery_tracking.attempts_count + 1,
      correct_count = mastery_tracking.correct_count + ${isCorrect ? 1 : 0},
      incorrect_count = mastery_tracking.incorrect_count + ${isCorrect ? 0 : 1},
      last_practiced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `
  return result[0]
}

// ─── Practice sessions ────────────────────────────────────────────────────────

export async function createPracticeSession(
  studentId: string,
  sessionType: string,
  grade: number,
) {
  const result = await sql`
    INSERT INTO practice_sessions (student_id, session_type, grade)
    VALUES (${studentId}, ${sessionType}, ${grade})
    RETURNING *
  `
  return result[0]
}

export async function completePracticeSession(
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
  const accuracy =
    stats.totalQuestions > 0
      ? ((stats.correctAnswers / stats.totalQuestions) * 100).toFixed(2)
      : "0"

  const result = await sql`
    UPDATE practice_sessions
    SET
      completed_at = CURRENT_TIMESTAMP,
      duration_seconds = ${stats.durationSeconds},
      total_questions = ${stats.totalQuestions},
      correct_answers = ${stats.correctAnswers},
      incorrect_answers = ${stats.incorrectAnswers},
      hints_used = ${stats.hintsUsed},
      coins_earned = ${stats.coinsEarned},
      accuracy_percentage = ${accuracy},
      topics_covered = ${stats.topicsCovered},
      skills_practiced = ${stats.skillsPracticed},
      is_completed = true
    WHERE id = ${sessionId}
    RETURNING *
  `
  return result[0]
}

export async function getRecentSessions(studentId: string, limit = 10) {
  const result = await sql`
    SELECT * FROM practice_sessions
    WHERE student_id = ${studentId} AND is_completed = true
    ORDER BY completed_at DESC
    LIMIT ${limit}
  `
  return result
}

// ─── Practice attempts ────────────────────────────────────────────────────────

export async function recordPracticeAttempt(
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
  const result = await sql`
    INSERT INTO practice_attempts (
      session_id, student_id, skill_id, question_text, correct_answer,
      student_answer, is_correct, difficulty_level, time_spent_seconds,
      hint_used, vedic_trick_shown
    )
    VALUES (
      ${sessionId}, ${studentId}, ${skillId}, ${questionText}, ${correctAnswer},
      ${studentAnswer}, ${isCorrect}, ${difficultyLevel}, ${timeSpentSeconds},
      ${hintUsed}, ${vedicTrick ?? null}
    )
    RETURNING *
  `
  return result[0]
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getStudentProgressSummary(studentId: string) {
  const result = await sql`
    SELECT * FROM student_progress_summary
    WHERE student_id = ${studentId}
  `
  return result[0]
}

export async function getParentDashboard(parentId: string) {
  const result = await sql`
    SELECT * FROM student_progress_summary
    WHERE parent_id = ${parentId}
    ORDER BY name
  `
  return result
}

/** Get all students' progress (for parent-less browsing during Phase 1). */
export async function getAllStudentProgress() {
  const result = await sql`
    SELECT * FROM student_progress_summary
    ORDER BY name
  `
  return result
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export async function getSkillsByGrade(grade: number) {
  const result = await sql`
    SELECT * FROM skills
    WHERE grade = ${grade} AND is_active = true
    ORDER BY category, name
  `
  return result
}
