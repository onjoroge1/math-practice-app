import { beforeEach, describe, expect, it } from "vitest"
import {
  SOCIAL_STUDIES_QUESTIONS,
  SOCIAL_STUDIES_TESTS,
  getSocialStudiesTestQuestions,
  prepareSocialStudiesTestQuestions,
  scoreSocialStudiesTest,
} from "@/lib/grade5-social-studies"
import { getAllSocialStudiesProgress, recordSocialStudiesAttempt } from "@/lib/social-studies-progress"

describe("Aden's Grade 5 Social Studies exam prep", () => {
  beforeEach(() => localStorage.clear())

  it("has a valid, unique, fully referenced question bank", () => {
    expect(SOCIAL_STUDIES_QUESTIONS).toHaveLength(55)
    expect(new Set(SOCIAL_STUDIES_QUESTIONS.map((question) => question.id)).size).toBe(55)

    for (const question of SOCIAL_STUDIES_QUESTIONS) {
      expect(question.choices).toHaveLength(4)
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
