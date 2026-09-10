import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildDailyPractice, readDailyPractice, saveDailyPractice, answerDailyQuestion, dailyScore, getPracticeQuestion, isPracticeCorrect } from "@/lib/todays-practice"
import { saveArithmeticLesson } from "@/lib/arithmetic-teaching"
import { writeIowaAttempts } from "@/lib/iowa-attempts"
import { IOWA_UNITS } from "@/lib/iowa-grade5"

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })
describe("Today's practice", () => {
  it("starts from missed and skipped arithmetic, with different valid retry problems", () => {
    saveArithmeticLesson("amir", { topic: "Addition", savedAt: 1, questions: [{ id: 0, question: "8 + 5", answer: 13 }, { id: 1, question: "12 − 7", answer: 5 }, { id: 2, question: "2 + 2", answer: 4 }], answers: { 0: "12", 1: "", 2: "4" } })
    const plan = buildDailyPractice("amir", 2, "2026-09-10")
    expect(plan.items).toHaveLength(5)
    expect(plan.items[0].reason).toContain("missed")
    expect(plan.items[1].reason).toContain("not reach")
    for (const item of plan.items) {
      expect(getPracticeQuestion(item.source).stem).not.toBe(getPracticeQuestion(item.retry).stem)
      const q = getPracticeQuestion(item.retry)
      expect(Number(q.answer)).toBeGreaterThanOrEqual(0)
      expect(Number(q.answer)).toBeLessThanOrEqual(100)
    }
  })
  it("does not revive an older error after a newer correct arithmetic answer", () => {
    const questions = [{ id: 0, question: "8 + 5", answer: 13 }]
    saveArithmeticLesson("amir", { topic: "Old", savedAt: 1, questions, answers: { 0: "12" } })
    saveArithmeticLesson("amir", { topic: "New", savedAt: 2, questions, answers: { 0: "13" } })
    expect(buildDailyPractice("amir", 2).items.every((item) => item.reason.includes("Warm up"))).toBe(true)
  })
  it("freezes plans, restores first answers, separates children and days", () => {
    const plan = buildDailyPractice("amir", 2, "2026-09-10")
    const graded = answerDailyQuestion({ ...plan, phase: "try" }, "999")
    expect(graded.phase).toBe("feedback")
    expect(answerDailyQuestion(graded, getPracticeQuestion(plan.items[0].retry).answer)).toEqual(graded)
    expect(dailyScore(graded)).toBe(0)
    expect(saveDailyPractice(graded)).toBe(true)
    expect(readDailyPractice("amir", "2026-09-10")).toEqual(graded)
    expect(readDailyPractice("aden", "2026-09-10")).toBeNull()
    expect(readDailyPractice("amir", "2026-09-11")).toBeNull()
  })
  it("rejects blank and invalid submissions and corrupted progress", () => {
    const plan = { ...buildDailyPractice("amir", 2), phase: "try" as const }
    for (const answer of ["", " ", "cat", "1e2", "-1"]) expect(answerDailyQuestion(plan, answer)).toEqual(plan)
    expect(saveDailyPractice({ ...plan, index: 9 })).toBe(false)
    expect(saveDailyPractice({ ...plan, phase: "complete" })).toBe(false)
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("full") })
    expect(saveDailyPractice(plan)).toBe(false)
  })
  it("uses the most recent Iowa answer and targets another question with the same skill", () => {
    const unit = IOWA_UNITS.find((u) => u.id === "mathematics")!
    const source = unit.questions.find((q) => q.number === 23)!
    const corrected = unit.questions.find((q) => q.number === 24)!
    writeIowaAttempts("aden", [
      { id: "11111111-1111-4111-8111-111111111111", unitId: unit.id, questionNumbers: [23,24], answers: { 23: "A",24:"A" }, completedAt: 1789000000000, durationSeconds: 20 },
      { id: "22222222-2222-4222-8222-222222222222", unitId: unit.id, questionNumbers: [24], answers: { 24: corrected.answer }, completedAt: 1789000100000, durationSeconds: 20 },
    ])
    const plan = buildDailyPractice("aden", 5)
    expect(plan.items[0].source).toEqual({ kind: "iowa", unitId: unit.id, number: source.number })
    const retry = plan.items[0].retry
    expect(retry.kind).toBe("iowa")
    if (retry.kind === "iowa") {
      const q = unit.questions.find((q) => q.number === retry.number)!
      expect(q.number).not.toBe(source.number)
      expect(q.explanation!.skill).toBe(source.explanation!.skill)
    }
    expect(plan.items.filter((i) => i.reason.includes("missed"))).toHaveLength(1)
    expect(isPracticeCorrect(plan.items[0].retry, getPracticeQuestion(plan.items[0].retry).answer)).toBe(true)
  })
})

it("gives a successfully checked source a short break on the next day", () => {
  saveArithmeticLesson("amir", { topic: "Addition", savedAt: 1, questions: [{ id: 0, question: "8 + 5", answer: 13 }], answers: { 0: "12" } })
  const dayOne = buildDailyPractice("amir", 2, "2026-09-10")
  saveDailyPractice(answerDailyQuestion({ ...dayOne, phase: "try" }, getPracticeQuestion(dayOne.items[0].retry).answer))
  expect(buildDailyPractice("amir", 2, "2026-09-11").items.some((item) => item.reason.includes("missed"))).toBe(false)
  expect(buildDailyPractice("amir", 2, "2026-09-14").items[0].reason).toContain("missed")
})
