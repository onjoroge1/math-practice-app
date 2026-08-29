import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  clearAttemptDraft,
  currentStudentContext,
  getAllAttemptDrafts,
  getAttemptDraft,
  getUnitProgress,
  recordAttempt,
  saveAttemptDraft,
} from "@/lib/iowa-progress"

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("Iowa student progress", () => {
  it("requires a real active student and reads Aden's Grade 5 context", () => {
    expect(currentStudentContext()).toBeNull()
    localStorage.setItem("currentStudentId", "aden-row")
    localStorage.setItem("currentStudentGrade", "5")
    expect(currentStudentContext()).toEqual({ id: "aden-row", grade: 5 })
  })

  it("keeps completed progress separate for each child", () => {
    recordAttempt("aden-row", "mathematics", 80, [1, 2, 3])

    expect(getUnitProgress("aden-row", "mathematics")).toMatchObject({ best: 80, last: 80, attempts: 1 })
    expect(getUnitProgress("amir-row", "mathematics")).toBeNull()
  })

  it("resumes and clears an in-progress unit", () => {
    vi.spyOn(Date, "now").mockReturnValue(2_000)
    saveAttemptDraft("aden-row", {
      unitId: "mathematics",
      questionNumbers: [11, 12, 13],
      answers: { 11: "B" },
      index: 1,
      startedAt: 1_000,
      elapsedMs: 500,
    })

    expect(getAttemptDraft("aden-row", "mathematics")).toEqual({
      unitId: "mathematics",
      questionNumbers: [11, 12, 13],
      answers: { 11: "B" },
      index: 1,
      startedAt: 1_000,
      elapsedMs: 500,
      updatedAt: 2_000,
    })
    expect(getAllAttemptDrafts("aden-row")).toHaveProperty("mathematics")

    clearAttemptDraft("aden-row", "mathematics")
    expect(getAttemptDraft("aden-row", "mathematics")).toBeNull()
  })

  it("ignores corrupted draft storage", () => {
    localStorage.setItem("iowa:drafts:v1:aden-row", "not-json")
    expect(getAllAttemptDrafts("aden-row")).toEqual({})
  })
})
