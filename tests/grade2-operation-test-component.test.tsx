import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Grade2OperationTest from "@/components/grade2-operation-test"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  saveDrillResult: vi.fn(),
  trackDrillStarted: vi.fn(),
  trackDrillCompleted: vi.fn(),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock("@/lib/drill-results", () => ({ saveDrillResult: mocks.saveDrillResult }))
vi.mock("@/lib/analytics", () => ({
  trackDrillStarted: mocks.trackDrillStarted,
  trackDrillCompleted: mocks.trackDrillCompleted,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Grade2OperationTest", () => {
  it("runs the supplied 50-question worksheet flow and records the result", () => {
    render(<Grade2OperationTest kind="addition" />)

    expect(screen.queryAllByRole("textbox")).toHaveLength(0)
    fireEvent.click(screen.getByRole("button", { name: /start test/i }))

    const inputs = screen.getAllByRole("textbox")
    expect(inputs).toHaveLength(50)

    const label = inputs[0].getAttribute("aria-label") ?? ""
    const fact = /Answer for (\d+) \+ (\d+)/.exec(label)
    expect(fact).not.toBeNull()
    fireEvent.change(inputs[0], { target: { value: String(Number(fact?.[1]) + Number(fact?.[2])) } })
    fireEvent.click(screen.getByRole("button", { name: /submit answers/i }))

    expect(screen.getByText("1 / 50")).toBeInTheDocument()
    expect(screen.getAllByText("Show steps")).toHaveLength(50)
    expect(screen.getByRole("region", { name: "Learn how to solve it" })).toBeInTheDocument()
    expect(screen.getByText("1 answered • 2% accuracy")).toBeInTheDocument()
    expect(mocks.saveDrillResult).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "Grade 2 Addition Test", correct: 1, total: 50, answered: 1, accuracy: 2 }),
      expect.any(Number),
    )
    expect(mocks.trackDrillCompleted).toHaveBeenCalledWith("Addition Test", 2, 2, 1, 50)
  })
})
