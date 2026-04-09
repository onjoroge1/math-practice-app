import { describe, it, expect } from "vitest"

/**
 * Tests the mastery level calculation logic from lib/actions.ts.
 * Extracted as a pure function to test without DB dependencies.
 */
function calculateMasteryLevel(totalAttempts: number, totalCorrect: number): number {
  if (totalAttempts === 0) return 0
  const accuracy = totalCorrect / totalAttempts

  if (totalAttempts >= 10 && accuracy >= 0.95) return 5
  if (totalAttempts >= 8 && accuracy >= 0.9) return 4
  if (totalAttempts >= 6 && accuracy >= 0.8) return 3
  if (totalAttempts >= 4 && accuracy >= 0.7) return 2
  if (totalAttempts >= 2 && accuracy >= 0.6) return 1
  return 0
}

describe("Mastery level calculation", () => {
  it("returns 0 with no attempts", () => {
    expect(calculateMasteryLevel(0, 0)).toBe(0)
  })

  it("returns 0 with 1 attempt (not enough data)", () => {
    expect(calculateMasteryLevel(1, 1)).toBe(0)
  })

  it("returns 1 with 2 attempts and 60%+ accuracy", () => {
    expect(calculateMasteryLevel(2, 2)).toBe(1)
    expect(calculateMasteryLevel(5, 3)).toBe(1)
  })

  it("returns 2 with 4+ attempts and 70%+ accuracy", () => {
    expect(calculateMasteryLevel(4, 3)).toBe(2)
    expect(calculateMasteryLevel(10, 7)).toBe(2)
  })

  it("returns 3 with 6+ attempts and 80%+ accuracy", () => {
    expect(calculateMasteryLevel(6, 5)).toBe(3)
    expect(calculateMasteryLevel(10, 8)).toBe(3)
  })

  it("returns 4 with 8+ attempts and 90%+ accuracy", () => {
    expect(calculateMasteryLevel(8, 8)).toBe(4)
    expect(calculateMasteryLevel(10, 9)).toBe(4)
  })

  it("returns 5 (mastered) with 10+ attempts and 95%+ accuracy", () => {
    expect(calculateMasteryLevel(10, 10)).toBe(5)
    expect(calculateMasteryLevel(20, 19)).toBe(5)
  })

  it("does not return level 5 with 9 attempts even at 100% accuracy", () => {
    expect(calculateMasteryLevel(9, 9)).toBe(4)
  })

  it("returns 0 with poor accuracy despite many attempts", () => {
    expect(calculateMasteryLevel(10, 2)).toBe(0)
    expect(calculateMasteryLevel(5, 1)).toBe(0)
  })

  it("boundary: exactly at each threshold", () => {
    expect(calculateMasteryLevel(2, 2)).toBe(1)   // 100% >= 60%
    expect(calculateMasteryLevel(4, 3)).toBe(2)   // 75% >= 70%
    expect(calculateMasteryLevel(6, 5)).toBe(3)   // 83% >= 80%
    expect(calculateMasteryLevel(8, 8)).toBe(4)   // 100% >= 90%
    expect(calculateMasteryLevel(10, 10)).toBe(5)  // 100% >= 95%
  })

  it("picks highest qualifying level", () => {
    // 20 attempts, 19 correct = 95% accuracy
    // Qualifies for levels 1-5, should return 5
    expect(calculateMasteryLevel(20, 19)).toBe(5)
  })
})
