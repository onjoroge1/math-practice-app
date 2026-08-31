import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Grade5SocialStudiesTest from "@/components/grade5-social-studies-test"
import { prepareSocialStudiesTestQuestions } from "@/lib/grade5-social-studies"
import { getAllSocialStudiesProgress } from "@/lib/social-studies-progress"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  saveDrillResult: vi.fn(),
  trackDrillStarted: vi.fn(),
  trackDrillCompleted: vi.fn(),
}))

const router = { push: mocks.push, replace: mocks.replace }

vi.mock("next/navigation", () => ({ useRouter: () => router }))
vi.mock("@/lib/drill-results", () => ({ saveDrillResult: mocks.saveDrillResult }))
vi.mock("@/lib/analytics", () => ({
  trackDrillStarted: mocks.trackDrillStarted,
  trackDrillCompleted: mocks.trackDrillCompleted,
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.stubGlobal("scrollTo", vi.fn())
  localStorage.setItem("currentStudentId", "aden-row")
  localStorage.setItem("currentStudentGrade", "5")
  localStorage.setItem("currentStudentName", "Aden")
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("Grade 5 Social Studies test runner", () => {
  it("completes Chapter 7, saves the score, and displays answer review", async () => {
    const questions = prepareSocialStudiesTestQuestions("chapter-7")
    render(<Grade5SocialStudiesTest testId="chapter-7" />)

    fireEvent.click(await screen.findByRole("button", { name: /Start practice test/i }))

    for (let index = 0; index < questions.length; index += 1) {
      const answerButtons = screen.getAllByRole("button").filter((button) => button.hasAttribute("aria-pressed"))
      fireEvent.click(answerButtons[questions[index].answer])
      fireEvent.click(screen.getByRole("button", { name: index === questions.length - 1 ? "Submit test" : /Next/i }))
    }

    expect(await screen.findByText("100%")).toBeInTheDocument()
    expect(screen.getByText(/Perfect score/i)).toBeInTheDocument()
    expect(getAllSocialStudiesProgress("aden-row")["chapter-7"]).toMatchObject({ best: 100, last: 100, attempts: 1 })
    expect(mocks.saveDrillResult).toHaveBeenCalledTimes(1)
    expect(mocks.saveDrillResult).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "Social Studies: Chapter 7", correct: 25, total: 25, accuracy: 100 }),
      expect.any(Number),
    )
    expect(mocks.trackDrillCompleted).toHaveBeenCalledTimes(1)
  })

  it("redirects a Grade 2 profile away from Aden's exam prep", async () => {
    localStorage.setItem("currentStudentGrade", "2")
    render(<Grade5SocialStudiesTest testId="chapter-7" />)

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/topic-select"))
    expect(screen.queryByText(/Ready for 25 questions/i)).not.toBeInTheDocument()
  })
})
