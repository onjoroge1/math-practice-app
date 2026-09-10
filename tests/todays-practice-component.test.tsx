import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import Page from "@/app/todays-practice/page"
import { readDailyPractice, getPracticeQuestion } from "@/lib/todays-practice"
vi.mock("@/lib/iowa-sync", () => ({ syncIowaProgress: vi.fn(async () => ({ status: "local", attempts: [] })) }))
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem("currentStudentId", "amir")
  localStorage.setItem("currentStudentGrade", "2")
  localStorage.setItem("currentStudentName", "Amir")
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(cleanup)
it("teaches before trying, hides steps during the independent check, and resumes after grading", async () => {
  const view = render(<Page />)
  await screen.findByText("I’ve read the steps — let me try")
  expect(screen.getByRole("region", { name: "Learn how to solve it" })).toBeInTheDocument()
  fireEvent.click(screen.getByText("I’ve read the steps — let me try"))
  expect(screen.queryByRole("region", { name: "Learn how to solve it" })).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText("Your answer"), { target: { value: "999" } })
  fireEvent.click(screen.getByText("Check my answer"))
  await screen.findByText("Let’s look at the steps together.")
  expect(readDailyPractice("amir")?.answers[0]).toBe("999")
  view.unmount()
  render(<Page />)
  await screen.findByText("Let’s look at the steps together.")
  fireEvent.click(screen.getByText("Next small step"))
  await screen.findByText("Step 2 of 5")
  for (let i = 1; i < 5; i++) {
    fireEvent.click(screen.getByText("I’ve read the steps — let me try"))
    const saved = readDailyPractice("amir")!
    fireEvent.change(screen.getByLabelText("Your answer"), { target: { value: getPracticeQuestion(saved.items[i].retry).answer } })
    fireEvent.click(screen.getByText("Check my answer"))
    fireEvent.click(screen.getByText(i === 4 ? "Finish today’s practice" : "Next small step"))
  }
  await waitFor(() => expect(screen.getByText("4 of 5 independent checks correct")).toBeInTheDocument())
  expect(readDailyPractice("amir")?.phase).toBe("complete")
})
