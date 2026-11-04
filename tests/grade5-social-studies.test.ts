import { beforeEach, describe, expect, it } from "vitest"
import {
  SOCIAL_STUDIES_QUESTIONS,
  SOCIAL_STUDIES_TESTS,
  drawSocialStudiesTestQuestions,
  getSocialStudiesTest,
  getSocialStudiesTestQuestions,
  prepareSocialStudiesQuestionsByIds,
  prepareSocialStudiesTestQuestions,
  scoreSocialStudiesTest,
} from "@/lib/grade5-social-studies"
import { getAllSocialStudiesProgress, recordSocialStudiesAttempt } from "@/lib/social-studies-progress"

describe("Aden's Grade 5 Social Studies exam prep", () => {
  beforeEach(() => localStorage.clear())

  it("has a valid, unique, fully referenced question bank", () => {
    const byUnit = (unit: string) => SOCIAL_STUDIES_QUESTIONS.filter((question) => question.unit === unit).length
    expect(byUnit("chapter-7")).toBe(25)
    expect(byUnit("chapter-8")).toBe(30)
    expect(byUnit("chapter-9")).toBeGreaterThanOrEqual(150)
    expect(new Set(SOCIAL_STUDIES_QUESTIONS.map((question) => question.id)).size).toBe(SOCIAL_STUDIES_QUESTIONS.length)

    for (const question of SOCIAL_STUDIES_QUESTIONS) {
      expect(question.choices).toHaveLength(4)
      expect(new Set(question.choices).size).toBe(4)
      expect(question.answer).toBeGreaterThanOrEqual(0)
      expect(question.answer).toBeLessThan(4)
      expect(question.explanation.length).toBeGreaterThan(20)
    }

    for (const test of SOCIAL_STUDIES_TESTS) {
      expect(getSocialStudiesTestQuestions(test.id)).toHaveLength(test.questionIds.length)
      expect(new Set(test.questionIds).size).toBe(test.questionIds.length)
    }
  })

  it("mixes answer positions without changing the correct facts", () => {
    const original = getSocialStudiesTestQuestions("chapter-8")
    const prepared = prepareSocialStudiesTestQuestions("chapter-8")
    const answerPositions = new Set(prepared.map((question) => question.answer))

    expect(answerPositions.size).toBeGreaterThan(2)
    prepared.forEach((question, index) => {
      expect(question.choices[question.answer]).toBe(original[index].choices[original[index].answer])
    })
  })

  it("draws 25 unique random Chapter 9 questions per attempt from the full bank", () => {
    const test = getSocialStudiesTest("chapter-9")!
    expect(test.drawCount).toBe(25)
    expect(test.questionIds.length).toBeGreaterThanOrEqual(150)

    const first = drawSocialStudiesTestQuestions("chapter-9")
    const second = drawSocialStudiesTestQuestions("chapter-9")
    expect(first).toHaveLength(25)
    expect(new Set(first.map((question) => question.id)).size).toBe(25)
    expect(first.every((question) => question.unit === "chapter-9")).toBe(true)
    expect(first.map((question) => question.id)).not.toEqual(second.map((question) => question.id))

    // Over many attempts, every question in the bank gets a turn.
    const seen = new Set<string>()
    for (let attempt = 0; attempt < 200; attempt += 1) drawSocialStudiesTestQuestions("chapter-9").forEach((question) => seen.add(question.id))
    expect(seen.size).toBe(test.questionIds.length)
  })

  it("varies answer letters per attempt but restores a saved attempt exactly", () => {
    const ids = getSocialStudiesTest("chapter-9")!.questionIds.slice(0, 40)
    const original = getSocialStudiesTestQuestions("chapter-9").slice(0, 40)
    const a = prepareSocialStudiesQuestionsByIds("chapter-9", ids, "seed-a")
    const b = prepareSocialStudiesQuestionsByIds("chapter-9", ids, "seed-b")

    expect(new Set(a.map((question) => question.answer)).size).toBe(4)
    expect(a.map((question) => question.answer)).not.toEqual(b.map((question) => question.answer))
    a.forEach((question, index) => expect(question.choices[question.answer]).toBe(original[index].choices[original[index].answer]))
    expect(prepareSocialStudiesQuestionsByIds("chapter-9", ids, "seed-a")).toEqual(a)
  })

  it("scores a complete attempt", () => {
    const questions = prepareSocialStudiesTestQuestions("wednesday-review")
    const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer]))
    expect(scoreSocialStudiesTest(questions, answers)).toEqual({ correct: 30, answered: 30, percent: 100 })
  })

  it("keeps best, latest, and attempt count separate for each student", () => {
    recordSocialStudiesAttempt("aden-row", "chapter-7", 92)
    recordSocialStudiesAttempt("aden-row", "chapter-7", 76)
    recordSocialStudiesAttempt("another-student", "chapter-7", 44)

    expect(getAllSocialStudiesProgress("aden-row")["chapter-7"]).toMatchObject({ best: 92, last: 76, attempts: 2 })
    expect(getAllSocialStudiesProgress("another-student")["chapter-7"]).toMatchObject({ best: 44, last: 44, attempts: 1 })
  })
})
