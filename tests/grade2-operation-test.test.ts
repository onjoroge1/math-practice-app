import { describe, expect, it } from "vitest"
import {
  GRADE2_TEST_QUESTION_COUNT,
  generateGrade2Test,
  getGrade2Rubric,
  scoreGrade2Test,
  type Grade2Operation,
} from "@/lib/grade2-operation-test"

const operations: Grade2Operation[] = ["addition", "subtraction", "multiplication", "division"]

describe("generateGrade2Test", () => {
  it.each(operations)("builds a 50-question %s worksheet with stable ids", (operation) => {
    const questions = generateGrade2Test(operation)

    expect(questions).toHaveLength(GRADE2_TEST_QUESTION_COUNT)
    expect(questions.map((question) => question.id)).toEqual(
      Array.from({ length: GRADE2_TEST_QUESTION_COUNT }, (_, index) => index),
    )
  })

  it("keeps addition facts at 20 or below", () => {
    for (const question of generateGrade2Test("addition")) {
      expect(question.op).toBe("+")
      expect(question.answer).toBeLessThanOrEqual(20)
      expect(question.a).toBeGreaterThan(0)
      expect(question.b).toBeGreaterThan(0)
    }
  })

  it("never creates a negative subtraction fact", () => {
    for (const question of generateGrade2Test("subtraction")) {
      expect(question.op).toBe("-")
      expect(question.a).toBeLessThanOrEqual(20)
      expect(question.answer).toBeGreaterThanOrEqual(0)
    }
  })

  it("limits multiplication to the 2, 5, and 10 tables", () => {
    for (const question of generateGrade2Test("multiplication")) {
      expect(question.op).toBe("×")
      expect([2, 5, 10]).toContain(question.a)
      expect(question.b).toBeGreaterThanOrEqual(1)
      expect(question.b).toBeLessThanOrEqual(10)
    }
  })

  it("creates exact division facts using divisors 2, 5, and 10", () => {
    for (const question of generateGrade2Test("division")) {
      expect(question.op).toBe("÷")
      expect([2, 5, 10]).toContain(question.b)
      expect(Number.isInteger(question.answer)).toBe(true)
      expect(question.a % question.b).toBe(0)
    }
  })
})

describe("getGrade2Rubric", () => {
  it.each([
    [50, 3],
    [40, 3],
    [39, 2],
    [35, 2],
    [34, 1],
    [0, 1],
  ])("maps %i correct to rubric level %i", (score, level) => {
    expect(getGrade2Rubric(score)).toBe(level)
  })

  it("does not count a blank as a correct zero", () => {
    const questions = generateGrade2Test("subtraction", 1, () => 0)
    questions[0] = { ...questions[0], answer: 0 }

    expect(scoreGrade2Test(questions, [""])).toMatchObject({ correct: 0, answered: 0 })
    expect(scoreGrade2Test(questions, ["0"])).toMatchObject({ correct: 1, answered: 1 })
  })
})
