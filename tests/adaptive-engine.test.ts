import { describe, it, expect } from "vitest"
import { AdaptiveEngine } from "@/lib/adaptive-engine"

describe("AdaptiveEngine.calculateCoins", () => {
  it("returns 0 for incorrect answer", () => {
    expect(AdaptiveEngine.calculateCoins(false, 0, 10)).toBe(0)
  })

  it("returns base 10 coins for correct answer with hints and slow time", () => {
    expect(AdaptiveEngine.calculateCoins(true, 2, 60)).toBe(10)
  })

  it("adds 5 bonus coins when no hints are used", () => {
    expect(AdaptiveEngine.calculateCoins(true, 0, 60)).toBe(15)
  })

  it("adds 3 bonus coins for speed under 30 seconds", () => {
    expect(AdaptiveEngine.calculateCoins(true, 1, 20)).toBe(13)
  })

  it("returns maximum 18 coins for perfect answer (no hints, fast)", () => {
    expect(AdaptiveEngine.calculateCoins(true, 0, 10)).toBe(18)
  })
})

describe("AdaptiveEngine.getDifficultyForSkill", () => {
  it("returns 1 for a student with no mastery data", () => {
    const difficulty = AdaptiveEngine.getDifficultyForSkill("nonexistent-student", "add-sub-within-10")
    expect(difficulty).toBe(1)
  })
})

describe("AdaptiveEngine.selectSkillsForPractice", () => {
  it("returns skills for a given grade", () => {
    localStorage.removeItem("selectedTopics")
    const skills = AdaptiveEngine.selectSkillsForPractice("test-student", 1, 3)
    expect(skills.length).toBeLessThanOrEqual(3)
    expect(skills.length).toBeGreaterThan(0)
    skills.forEach((skill) => {
      expect(skill.grade).toBe(1)
    })
  })

  it("respects topic selection from localStorage", () => {
    localStorage.setItem("selectedTopics", JSON.stringify(["addition-subtraction"]))
    const skills = AdaptiveEngine.selectSkillsForPractice("test-student", 1, 5)
    expect(skills.length).toBeGreaterThan(0)
    skills.forEach((skill) => {
      expect(skill.grade).toBe(1)
    })
    localStorage.removeItem("selectedTopics")
  })

  it("returns requested count or fewer", () => {
    localStorage.removeItem("selectedTopics")
    const skills = AdaptiveEngine.selectSkillsForPractice("test-student", 2, 2)
    expect(skills.length).toBeLessThanOrEqual(2)
  })
})

describe("AdaptiveEngine.generatePracticeSession", () => {
  it("generates the requested number of items", () => {
    localStorage.removeItem("selectedTopics")
    const items = AdaptiveEngine.generatePracticeSession("test-student", 1, 5)
    expect(items.length).toBeLessThanOrEqual(5)
    expect(items.length).toBeGreaterThan(0)
  })

  it("each item has required properties", () => {
    localStorage.removeItem("selectedTopics")
    const items = AdaptiveEngine.generatePracticeSession("test-student", 2, 3)
    items.forEach((item) => {
      expect(item).toHaveProperty("id")
      expect(item).toHaveProperty("skillId")
      expect(item).toHaveProperty("difficulty")
      expect(item).toHaveProperty("question")
      expect(item).toHaveProperty("answer")
    })
  })
})
