import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import HomePage from "@/app/page"
import TopicSelectPage from "@/app/topic-select/page"
import IowaHubPage from "@/app/iowa/page"
import IowaUnitPage from "@/app/iowa/[unitId]/page"
import { getAttemptDraft, getUnitProgress, recordAttempt } from "@/lib/iowa-progress"

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  getOrCreateProfileStudentAction: vi.fn(),
  getStudentAction: vi.fn(),
  saveDrillResult: vi.fn(),
  trackDrillStarted: vi.fn(),
  trackDrillCompleted: vi.fn(),
}))

const router = { push: mocks.push, replace: mocks.replace }

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useParams: () => ({ unitId: "mathematics" }),
}))
vi.mock("@/lib/actions", () => ({
  getOrCreateProfileStudentAction: mocks.getOrCreateProfileStudentAction,
  getStudentAction: mocks.getStudentAction,
}))
vi.mock("@/lib/drill-results", () => ({ saveDrillResult: mocks.saveDrillResult }))
vi.mock("@/lib/analytics", () => ({
  trackTopicsSelected: vi.fn(),
  trackPracticeStarted: vi.fn(),
  trackDrillStarted: mocks.trackDrillStarted,
  trackDrillCompleted: mocks.trackDrillCompleted,
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  mocks.getOrCreateProfileStudentAction.mockResolvedValue({ id: "aden-row", name: "Aden", grade: 5 })
  mocks.getStudentAction.mockResolvedValue({ id: "aden-row", name: "Aden", grade: 5 })
})

afterEach(() => {
  cleanup()
})

function setAden() {
  localStorage.setItem("currentStudentId", "aden-row")
  localStorage.setItem("currentStudentGrade", "5")
  localStorage.setItem("currentStudentName", "Aden")
}

function chooseFirstAnswer() {
  const choice = document.querySelector<HTMLButtonElement>('button[aria-pressed="false"]')
  expect(choice).not.toBeNull()
  fireEvent.click(choice!)
}

describe("Aden's Grade 5 journey", () => {
  it("selects Aden and exposes the Grade 5 Iowa battery", async () => {
    const home = render(<HomePage />)
    fireEvent.click(screen.getByRole("button", { name: "Practice as Aden, Grade 5" }))

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/topic-select"))
    expect(localStorage.getItem("currentStudentId")).toBe("aden-row")
    expect(localStorage.getItem("currentStudentGrade")).toBe("5")
    home.unmount()

    render(<TopicSelectPage />)
    expect(await screen.findByRole("link", { name: /Iowa Practice Battery/i })).toHaveAttribute("href", "/iowa")
    expect(screen.getByText("Place Value & Powers of 10")).toBeInTheDocument()
  })

  it("saves the current question and answers across a reload", async () => {
    setAden()
    const firstRender = render(<IowaUnitPage />)
    expect(await screen.findByText(/Question 1 of 25/)).toBeInTheDocument()

    chooseFirstAnswer()
    fireEvent.click(screen.getByRole("button", { name: /Next/i }))
    expect(screen.getByText(/Question 2 of 25/)).toBeInTheDocument()
    expect(getAttemptDraft("aden-row", "mathematics")).toMatchObject({ index: 1 })
    firstRender.unmount()

    render(<IowaUnitPage />)
    expect(await screen.findByText(/Continuing where you left off/i)).toBeInTheDocument()
    expect(screen.getByText(/Question 2 of 25/)).toBeInTheDocument()
  })

  it("shows Aden's best, latest, and attempt count for each completed unit", async () => {
    setAden()
    recordAttempt("aden-row", "mathematics", 88, [1, 2, 3])
    recordAttempt("aden-row", "mathematics", 72, [4, 5, 6])
    render(<IowaHubPage />)

    expect(await screen.findByText("Best 88%")).toBeInTheDocument()
    expect(within(screen.getByText("Best score").parentElement!).getByText("88%")).toBeInTheDocument()
    expect(within(screen.getByText("Latest score").parentElement!).getByText("72%")).toBeInTheDocument()
    expect(within(screen.getByText("Attempts").parentElement!).getByText("2")).toBeInTheDocument()
  })

  it("requires every answer, records one result, and clears the draft", async () => {
    setAden()
    render(<IowaUnitPage />)
    expect(await screen.findByText(/Question 1 of 25/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Choose an answer" })).toBeDisabled()

    for (let index = 0; index < 25; index += 1) {
      chooseFirstAnswer()
      fireEvent.click(screen.getByRole("button", { name: index === 24 ? "Finish" : "Next" }))
    }

    expect(await screen.findByText("Mathematics results")).toBeInTheDocument()
    expect(getUnitProgress("aden-row", "mathematics")).toMatchObject({ attempts: 1 })
    expect(getAttemptDraft("aden-row", "mathematics")).toBeNull()
    expect(mocks.saveDrillResult).toHaveBeenCalledTimes(1)
    expect(mocks.saveDrillResult).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "Iowa Mathematics", subject: "Grade 5 • Iowa Practice", total: 25, answered: 25 }),
      expect.any(Number),
    )
    expect(mocks.trackDrillCompleted).toHaveBeenCalledTimes(1)
  })

  it("redirects a non-Grade 5 profile away from the Iowa unit", async () => {
    localStorage.setItem("currentStudentId", "amir-row")
    localStorage.setItem("currentStudentGrade", "2")
    render(<IowaUnitPage />)

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/topic-select"))
    expect(screen.queryByText(/Question 1 of/)).not.toBeInTheDocument()
  })
})
