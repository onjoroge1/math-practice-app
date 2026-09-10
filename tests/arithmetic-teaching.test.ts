import { beforeEach, describe, expect, it, vi } from "vitest"
import { explainArithmetic, getArithmeticLessons, saveArithmeticLesson } from "@/lib/arithmetic-teaching"

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

describe("worked arithmetic", () => {
  it.each([
    ["8 + 7 =", 15, [[8, 2, 10], [10, 5, 15]]],
    ["52 - 28", 24, [[52, 20, 32], [32, 2, 30], [30, 6, 24]]],
    ["13 − 8 = ?", 5, [[13, 3, 10], [10, 5, 5]]],
    ["100 - 37", 63, [[100, 30, 70], [70, 7, 63]]],
    ["0 + 0", 0, [[0, 0, 0]]],
    ["20 - 20", 0, [[20, 20, 0]]],
    ["95 + 18", 113, [[95, 10, 105], [105, 5, 110], [110, 3, 113]]],
  ])("explains %s correctly", (question, answer, expected) => {
    expect(explainArithmetic(question, answer)?.steps.map((s) => [s.from, s.amount, s.to])).toEqual(expected)
  })

  it("keeps every jump correct across all facts within 100", () => {
    for (let a = 0; a <= 100; a++) for (let b = 0; b <= 100; b++) {
      for (const operation of ["+", "-"] as const) {
        if (operation === "-" && b > a) continue
        const answer = operation === "+" ? a + b : a - b
        const explanation = explainArithmetic(`${a} ${operation} ${b}`, answer)!
        expect(explanation.steps.reduce((sum, step) => sum + step.amount, 0)).toBe(b)
        let from = a
        for (const step of explanation.steps) {
          expect(step.from).toBe(from)
          expect(step.to).toBe(operation === "+" ? from + step.amount : from - step.amount)
          from = step.to
        }
        expect(from).toBe(answer)
      }
    }
  })

  it.each(["2 × 4", "1.5 + 2", "4 + ? = 8", "5 - 8", "12 ÷ 3", "We have 3 apples and 2 pears."])("does not invent an explanation for %s", (question) => {
    expect(explainArithmetic(question, 4)).toBeNull()
  })

  it("rejects a mismatched answer key", () => expect(explainArithmetic("8 + 7", 14)).toBeNull())

  it("persists the latest lesson per topic and separates the children", () => {
    const lesson = { topic: "Addition", savedAt: 123, questions: [{ id: 0, question: "8 + 7", answer: 15 }], answers: { 0: "14" } }
    expect(saveArithmeticLesson("amir", lesson)).toBe(true)
    expect(saveArithmeticLesson("amir", { ...lesson, savedAt: 456 })).toBe(true)
    expect(getArithmeticLessons("amir")).toEqual([{ ...lesson, savedAt: 456 }])
    expect(getArithmeticLessons("aden")).toEqual([])
  })

  it("recovers from malformed storage and reports quota failures", () => {
    localStorage.setItem("arithmetic:lessons:v1:amir", '{"wrong":true}')
    expect(getArithmeticLessons("amir")).toEqual([])
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("Quota exceeded") })
    expect(saveArithmeticLesson("amir", { topic: "Addition", savedAt: 1, questions: [{ id: 0, question: "1 + 1", answer: 2 }], answers: {} })).toBe(false)
  })
})
