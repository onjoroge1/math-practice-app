import { describe, expect, it } from "vitest"
import { IOWA_TARGET, IOWA_UNITS, sampleUnit, scoreIowaAttempt, stimulusFor } from "@/lib/iowa-grade5"

describe("Grade 5 Iowa question bank", () => {
  it("contains ten valid units with answerable questions", () => {
    expect(IOWA_UNITS).toHaveLength(10)

    for (const unit of IOWA_UNITS) {
      expect(unit.questions).toHaveLength(unit.poolSize)
      expect(new Set(unit.questions.map((question) => question.number)).size).toBe(unit.questions.length)
      for (const question of unit.questions) {
        expect(question.choices.some((choice) => choice.label === question.answer)).toBe(true)
        if (question.stimulusId) expect(stimulusFor(unit, question)).toBeDefined()
      }
    }
  })

  it("samples about 25 questions and keeps stimulus groups together", () => {
    for (const unit of IOWA_UNITS) {
      const sampled = sampleUnit(unit, IOWA_TARGET, new Set(), () => 0.42)
      expect(sampled.length).toBeGreaterThanOrEqual(Math.min(IOWA_TARGET, unit.questions.length))

      const sampledNumbers = new Set(sampled.map((question) => question.number))
      for (const question of sampled) {
        if (!question.stimulusId) continue
        const group = unit.questions.filter((candidate) => candidate.stimulusId === question.stimulusId)
        expect(group.every((candidate) => sampledNumbers.has(candidate.number))).toBe(true)
      }
    }
  })

  it("favors unseen questions on the next attempt", () => {
    const unit = IOWA_UNITS.find((candidate) => candidate.id === "mathematics")!
    const first = sampleUnit(unit, 25, new Set(), () => 0.25)
    const second = sampleUnit(unit, 25, new Set(first.map((question) => question.number)), () => 0.25)

    expect(second.filter((question) => !first.some((previous) => previous.number === question.number)).length).toBe(25)
  })

  it("scores answers against the full attempt", () => {
    const questions = IOWA_UNITS[0].questions.slice(0, 4)
    const answers = {
      [questions[0].number]: questions[0].answer,
      [questions[1].number]: questions[1].answer,
      [questions[2].number]: "not-correct",
    }

    expect(scoreIowaAttempt(questions, answers)).toMatchObject({
      total: 4,
      answered: 3,
      correct: 2,
      percent: 50,
    })
  })
})
