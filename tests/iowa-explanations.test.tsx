import { describe, it, expect } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { IOWA_ACTIVE_COUNT, IOWA_UNITS, sampleUnit } from "@/lib/iowa-grade5"
import { IowaExplanation } from "@/components/iowa-explanation"
import original from "@/lib/data/iowa-grade5.json"

describe("Iowa worked explanations and expansion", () => {
  it("preserves historical IDs and answer keys and adds five questions per unit", () => {
    expect(IOWA_ACTIVE_COUNT).toBe(408)
    for (const unit of IOWA_UNITS) {
      const before = original.units.find((u) => u.id === unit.id)!
      expect(unit.questions.length).toBe(before.questions.length + 5)
      for (const q of before.questions) expect(unit.questions.find((item) => item.number === q.number)?.answer).toBe(q.answer)
      for (const q of unit.questions) {
        expect(q.explanation?.steps.length).toBeGreaterThanOrEqual(2)
        expect(q.explanation?.steps.every((step) => step.trim().length > 0)).toBe(true)
        expect(q.explanation?.skill).toBeTruthy()
        expect(new Set(q.choices.map((c) => c.text)).size).toBe(q.choices.length)
      }
    }
  })
  it("never samples retired ambiguous items", () => {
    for (const unit of IOWA_UNITS) {
      const all = sampleUnit(unit, 1000)
      expect(all.some((q) => q.retired)).toBe(false)
      expect(all.length).toBe(unit.questions.filter((q) => !q.retired).length)
    }
  })
  it("includes the passage and actual reasoning in reading review", () => {
    const unit = IOWA_UNITS.find((u) => u.id === "reading")!
    const q = unit.questions.find((q) => q.number === 44)!
    render(<IowaExplanation unit={unit} question={q} showPrompt />)
    expect(screen.getByText("The Rainy-Day Delivery")).toBeInTheDocument()
    expect(screen.getByText(/She returns inside to protect the books/)).toBeInTheDocument()
    expect(screen.getByText(/Nora promised to deliver books/)).toBeInTheDocument()
    cleanup()
  })
})

