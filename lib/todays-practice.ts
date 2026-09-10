import { z } from "zod"
import { explainArithmetic, getArithmeticLessons, type TeachingQuestion } from "./arithmetic-teaching"
import { IOWA_UNITS, getIowaUnit } from "./iowa-grade5"
import { readIowaAttempts } from "./iowa-attempts"

const questionSchema = z.object({ id: z.number().int(), question: z.string(), answer: z.union([z.number(), z.string()]) })
const refSchema = z.union([
  z.object({ kind: z.literal("arithmetic"), question: questionSchema }).refine((value) => !!explainArithmetic(value.question.question, value.question.answer)),
  z.object({ kind: z.literal("iowa"), unitId: z.string(), number: z.number().int() }).refine((value) => !!getIowaUnit(value.unitId)?.questions.some((q) => q.number === value.number && !q.retired)),
])
export type PracticeRef = z.infer<typeof refSchema>
const itemSchema = z.object({ source: refSchema, retry: refSchema, reason: z.string(), sourceAnswer: z.string() })
const stateSchema = z.object({
  version: z.literal(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), studentId: z.string(),
  items: z.array(itemSchema).min(1).max(5), index: z.number().int().min(0),
  phase: z.enum(["learn", "try", "feedback", "complete"]), answers: z.record(z.string(), z.string()),
}).superRefine((state, ctx) => {
  const invalid = state.index >= state.items.length || Object.keys(state.answers).some((key) => !/^\d+$/.test(key) || Number(key) >= state.items.length)
    || (state.phase === "feedback" && state.answers[state.index] === undefined)
    || (state.phase === "complete" && state.items.some((_, i) => state.answers[i] === undefined))
    || state.items.slice(0, state.index).some((_, i) => state.answers[i] === undefined)
  if (invalid) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid daily progress" })
})
export type DailyPractice = z.infer<typeof stateSchema>
export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}
const key = (studentId: string, date: string) => `daily:practice:v1:${studentId}:${date}`
export function readDailyPractice(studentId: string, date = localDate()): DailyPractice | null {
  try {
    const result = stateSchema.safeParse(JSON.parse(localStorage.getItem(key(studentId, date)) || "null"))
    return result.success && result.data.studentId === studentId && result.data.date === date ? result.data : null
  } catch { return null }
}
export function saveDailyPractice(state: DailyPractice): boolean {
  try {
    localStorage.setItem(key(state.studentId, state.date), JSON.stringify(stateSchema.parse(state)))
    return true
  } catch { return false }
}
export function getPracticeQuestion(ref: PracticeRef) {
  if (ref.kind === "arithmetic") return { stem: ref.question.question, answer: String(ref.question.answer), choices: null }
  const q = getIowaUnit(ref.unitId)!.questions.find((q) => q.number === ref.number)!
  return { stem: q.stem, answer: q.answer, choices: q.choices }
}
export function isPracticeCorrect(ref: PracticeRef, answer: string) {
  return !!answer.trim() && (ref.kind === "arithmetic" ? Number(answer) === Number(ref.question.answer) : answer === getPracticeQuestion(ref).answer)
}
function arithmeticRef(a: number, b: number, adding: boolean): PracticeRef {
  return { kind: "arithmetic", question: { id: 0, question: `${a} ${adding ? "+" : "−"} ${b} =`, answer: adding ? a + b : a - b } }
}
function retryArithmetic(question: TeachingQuestion): PracticeRef {
  const ex = explainArithmetic(question.question, question.answer)!
  // Keep the strategy (including crossing a ten) when possible, inside the learner's range.
  const max = Math.max(ex.a, ex.b, ex.answer) <= 20 ? 20 : 100
  const candidates = [ex.a + 1, ex.a - 1, ex.a + 10, ex.a - 10].filter((a) => a >= 0 && a <= max)
  const sameStrategy = candidates.find((a) => {
    const ref = arithmeticRef(a, ex.b, ex.operation === "+")
    if (ref.kind !== "arithmetic" || Number(ref.question.answer) > max) return false
    return explainArithmetic(ref.question.question, ref.question.answer)?.strategy === ex.strategy
  })
  if (sameStrategy !== undefined) return arithmeticRef(sameStrategy, ex.b, ex.operation === "+")
  return arithmeticRef(ex.operation === "+" ? 8 : 13, ex.operation === "+" ? 5 : 6, ex.operation === "+")
}
export function buildDailyPractice(studentId: string, grade: number, date = localDate()): DailyPractice {
  const items: DailyPractice["items"] = []
  const refKey = (ref: PracticeRef) => ref.kind === "iowa" ? `${ref.unitId}:${ref.number}` : (() => {
    const ex = explainArithmetic(ref.question.question, ref.question.answer)!
    return `${ex.a}:${ex.operation}:${ex.b}`
  })()
  // Give a successfully checked source a short break, not a permanent mastery label.
  const recentChecks = new Map<string, boolean>()
  for (let daysAgo = 1; daysAgo <= 3; daysAgo++) {
    const previous = new Date(`${date}T12:00:00`)
    previous.setDate(previous.getDate() - daysAgo)
    const prior = readDailyPractice(studentId, localDate(previous))
    prior?.items.forEach((item, i) => {
      if (prior.answers[i] === undefined) return
      const id = refKey(item.source)
      if (!recentChecks.has(id)) recentChecks.set(id, isPracticeCorrect(item.retry, prior.answers[i]))
    })
  }
  if (grade === 5) {
    const attempts = readIowaAttempts(studentId).sort((a, b) => b.completedAt - a.completedAt)
    const seen = new Set<string>()
    const used = new Set<string>()
    const add = (unitId: string, number: number, sourceAnswer: string, reason: string) => {
      const unit = getIowaUnit(unitId)!
      const source = unit.questions.find((q) => q.number === number)!
      if (source.retired || used.has(`${unitId}:${number}`) || recentChecks.get(`${unitId}:${number}`) === true) return
      const next = unit.questions.find((q) => !q.retired && q.number !== number && !used.has(`${unitId}:${q.number}`)
        && !attempts.some((a) => a.unitId === unitId && a.questionNumbers.includes(q.number))
        && q.explanation?.skill === source.explanation?.skill)
      const retry = next ?? source
      used.add(`${unitId}:${number}`); used.add(`${unitId}:${retry.number}`)
      items.push({ source: { kind: "iowa", unitId, number }, retry: { kind: "iowa", unitId, number: retry.number }, sourceAnswer, reason })
    }
    for (const attempt of attempts) {
      for (const number of attempt.questionNumbers) {
        const id = `${attempt.unitId}:${number}`
        if (seen.has(id)) continue
        seen.add(id)
        const q = getIowaUnit(attempt.unitId)?.questions.find((q) => q.number === number)
        if (q && attempt.answers[number] !== q.answer) add(attempt.unitId, number, attempt.answers[number] || "", "Revisit a missed Iowa question")
        if (items.length === 5) break
      }
      if (items.length === 5) break
    }
    const offset = Number(date.replaceAll("-", "")) % IOWA_UNITS.length
    for (let i = 0; items.length < 5 && i < IOWA_UNITS.length; i++) {
      const unit = IOWA_UNITS[(i + offset) % IOWA_UNITS.length]
      const available = unit.questions.filter((q) => !q.retired && !used.has(`${unit.id}:${q.number}`) && recentChecks.get(`${unit.id}:${q.number}`) !== true)
      const q = available[Number(date.slice(-2)) % available.length]
      if (q) add(unit.id, q.number, "", "Explore a worked Iowa example")
    }
  } else {
    const seen = new Set<string>()
    for (const lesson of getArithmeticLessons(studentId).sort((a, b) => b.savedAt - a.savedAt)) {
      for (const question of lesson.questions) {
        const ex = explainArithmetic(question.question, question.answer)!
        const id = `${ex.a}:${ex.operation}:${ex.b}`
        if (seen.has(id)) continue
        seen.add(id)
        const answer = lesson.answers[question.id] ?? ""
        if (recentChecks.get(id) !== true && (!answer.trim() || Number(answer) !== Number(question.answer))) {
          items.push({ source: { kind: "arithmetic", question }, retry: retryArithmetic(question), sourceAnswer: answer, reason: answer.trim() ? "Learn from a missed answer" : "Try a question you did not reach" })
        }
        if (items.length === 5) break
      }
      if (items.length === 5) break
    }
    for (let i = 0; items.length < 5; i++) {
      const dayShift = Number(date.slice(-2)) % 3
      const source = arithmeticRef(i % 2 === 0 ? 7 + i + dayShift : 14 + i + dayShift, 5 + i % 3, i % 2 === 0)
      if (source.kind !== "arithmetic") continue
      items.push({ source, retry: retryArithmetic(source.question), sourceAnswer: "", reason: "Warm up with a worked example" })
    }
  }
  return { version: 1, date, studentId, items, index: 0, phase: "learn", answers: {} }
}
export function answerDailyQuestion(state: DailyPractice, answer: string): DailyPractice {
  if (state.phase !== "try" || !answer.trim() || state.answers[state.index] !== undefined) return state
  const question = getPracticeQuestion(state.items[state.index].retry)
  if (question.choices ? !question.choices.some((c) => c.label === answer) : !/^\d+$/.test(answer.trim())) return state
  return { ...state, answers: { ...state.answers, [state.index]: answer.trim() }, phase: "feedback" }
}
export function dailyScore(state: DailyPractice) {
  return state.items.reduce((sum, item, i) => sum + Number(isPracticeCorrect(item.retry, state.answers[i] ?? "")), 0)
}
