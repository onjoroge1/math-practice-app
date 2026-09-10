import { beforeEach, describe, expect, it, vi } from "vitest"
import { syncIowaAttemptsAction } from "@/lib/iowa-actions"
import { getIowaUnit } from "@/lib/iowa-grade5"

const db = vi.hoisted(() => ({ getStudentById: vi.fn(), getStudentByName: vi.fn(), syncIowaAttempts: vi.fn() }))
vi.mock("@/lib/db", () => db)
const studentId = "00000000-0000-4000-8000-000000000010"
const question = getIowaUnit("mathematics")!.questions[0]
const attempt = { id: "00000000-0000-4000-8000-000000000001", unitId: "mathematics", questionNumbers: [question.number], answers: { [question.number]: question.answer }, completedAt: 1789000000000, durationSeconds: 20 }
beforeEach(() => {
  vi.resetAllMocks()
  db.getStudentById.mockResolvedValue({ id: studentId, grade: 5 })
  db.getStudentByName.mockResolvedValue({ id: studentId })
  db.syncIowaAttempts.mockResolvedValue([{ payload: attempt }])
})

describe("Iowa server boundary", () => {
  it("accepts the canonical Grade 5 profile and returns validated attempts", async () => {
    expect(await syncIowaAttemptsAction(studentId, [attempt])).toEqual({ ok: true, attempts: [attempt] })
    expect(db.syncIowaAttempts).toHaveBeenCalledWith(studentId, [attempt])
  })
  it("rejects malformed IDs before querying the database", async () => {
    expect(await syncIowaAttemptsAction("guest", [])).toEqual({ ok: false })
    expect(db.getStudentById).not.toHaveBeenCalled()
  })
  it.each([{ id: studentId, grade: 2 }, { id: "a-different-profile", grade: 5 }, null])("does not read or write another profile: %s", async (student) => {
    db.getStudentById.mockResolvedValue(student)
    expect(await syncIowaAttemptsAction(studentId, [attempt])).toEqual({ ok: false })
    expect(db.syncIowaAttempts).not.toHaveBeenCalled()
  })
  it("rejects incomplete answers and handles database outages", async () => {
    expect(await syncIowaAttemptsAction(studentId, [{ ...attempt, answers: {} }])).toEqual({ ok: false })
    expect(db.syncIowaAttempts).not.toHaveBeenCalled()
    db.syncIowaAttempts.mockRejectedValue(new Error("unavailable"))
    expect(await syncIowaAttemptsAction(studentId, [attempt])).toEqual({ ok: false })
  })
})
