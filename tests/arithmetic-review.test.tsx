import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ArithmeticReview } from "@/components/arithmetic-review"
import LearningNotebookPage from "@/app/learning-notebook/page"
import DrillPage from "@/components/drill-page"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/lib/drill-results", () => ({ saveDrillResult: vi.fn() }))
vi.mock("@/lib/analytics", () => ({ trackDrillCompleted: vi.fn() }))
beforeEach(() => { localStorage.clear(); localStorage.setItem("currentStudentId", "amir"); localStorage.setItem("currentStudentName", "Amir") })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })
const questions = [{ id: 0, question: "8 + 7 =", answer: 15 }, { id: 1, question: "52 - 28 =", answer: 24 }]

describe("teaching review", () => {
  it("starts with mistakes, includes correct answers, and reopens after a page reload", () => {
    const first = render(<ArithmeticReview topic="Math" questions={questions} answers={{ 0: "15", 1: "34" }} />)
    expect(screen.getByText("52 − 28 = 24")).toBeInTheDocument()
    expect(screen.getByLabelText("32 − 2 equals 30")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "All examples (2)" }))
    expect(screen.getByText("8 + 7 = 15")).toBeInTheDocument()
    expect(screen.getByText("Your answer was correct.")).toBeInTheDocument()
    first.unmount()
    render(<LearningNotebookPage />)
    expect(screen.getByRole("heading", { name: /Amir’s learning notebook/ })).toBeInTheDocument()
    expect(screen.getByText("52 − 28 = 24")).toBeInTheDocument()
  })

  it("teaches skipped questions and doesn't leak answers during a grid drill", () => {
    render(<DrillPage config={{ title: "Math", description: "Test", subject: "Addition", accentColor: "blue", mode: "grid", generateQuestions: () => questions }} />)
    expect(screen.queryByRole("region", { name: "Learn how to solve it" })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Submit Answers" }))
    const review = screen.getByRole("region", { name: "Learn how to solve it" })
    expect(within(review).getByText("8 + 7 = 15")).toBeInTheDocument()
    expect(within(review).getByText(/You didn’t reach this one/)).toBeInTheDocument()
  })

  it("opens the teaching review after a sequential drill expires", () => {
    vi.useFakeTimers()
    render(<DrillPage config={{ title: "Math", description: "Test", subject: "Subtraction", accentColor: "blue", mode: "sequential", totalTime: 1, generateQuestions: () => questions }} />)
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "14" } })
    fireEvent.click(screen.getByRole("button", { name: "Submit" }))
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByRole("region", { name: "Learn how to solve it" })).toBeInTheDocument()
  })
})
