import { beforeEach, describe, expect, it, vi } from "vitest"
import { getIowaUnit } from "@/lib/iowa-grade5"
import { getUnitProgress, recordAttempt } from "@/lib/iowa-progress"
import { iowaAttemptSchema, readIowaAttempts, type IowaAttempt } from "@/lib/iowa-attempts"
import { syncIowaProgress } from "@/lib/iowa-sync"

const { sync } = vi.hoisted(() => ({ sync: vi.fn() }))
vi.mock("@/lib/iowa-actions", () => ({ syncIowaAttemptsAction: sync }))

const question = getIowaUnit("mathematics")!.questions[0]
function attempt(id = "00000000-0000-4000-8000-000000000001", correct = true, completedAt = Date.now()): IowaAttempt {
  return { id, unitId: "mathematics", questionNumbers: [question.number], answers: { [question.number]: correct ? question.answer : question.choices.find((choice) => choice.label !== question.answer)!.label }, completedAt, durationSeconds: 60 }
}

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); sync.mockReset(); sync.mockResolvedValue({ ok: false }) })

describe("Iowa score persistence", () => {
  it("saves synchronously, survives reloads, and retries an ID without counting it twice", async () => {
    const result = attempt()
    const saving = syncIowaProgress("aden", result)
    expect(getUnitProgress("aden", "mathematics")).toMatchObject({ best: 100, attempts: 1 })
    expect((await saving).status).toBe("local")
    sync.mockResolvedValue({ ok: true, attempts: [result] })
    const retried = await syncIowaProgress("aden", result)
    expect(retried.status).toBe("synced")
    expect(retried.progress.mathematics.attempts).toBe(1)
    expect(readIowaAttempts("aden")).toHaveLength(1)
    expect(getUnitProgress("amir", "mathematics")).toBeNull()
  })

  it("restores results from another device and preserves best independently of latest", async () => {
    const best = attempt(undefined, true, Date.now() - 1000)
    const latest = attempt("00000000-0000-4000-8000-000000000002", false)
    sync.mockResolvedValue({ ok: true, attempts: [latest, best] })
    const restored = await syncIowaProgress("aden")
    expect(restored.progress.mathematics).toMatchObject({ best: 100, last: 0, attempts: 2 })
    expect(getUnitProgress("aden", "mathematics")).toMatchObject({ best: 100, last: 0, attempts: 2 })
    expect(restored.attempts[0].id).toBe(latest.id)
  })

  it("keeps legacy best scores and counts them only once", async () => {
    recordAttempt("aden", "mathematics", 92, [question.number])
    const result = attempt(undefined, false)
    sync.mockResolvedValue({ ok: true, attempts: [result] })
    await syncIowaProgress("aden", result)
    expect((await syncIowaProgress("aden")).progress.mathematics).toMatchObject({ best: 92, last: 0, attempts: 2 })
  })

  it("still saves remotely when browser storage is full", async () => {
    const result = attempt()
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("quota") })
    sync.mockResolvedValue({ ok: true, attempts: [result] })
    expect((await syncIowaProgress("aden", result)).status).toBe("synced")
    expect(sync).toHaveBeenCalledWith("aden", [result])
  })

  it("reports total save failure instead of claiming persistence", async () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("quota") })
    expect((await syncIowaProgress("aden", attempt())).status).toBe("unavailable")
  })

  it("does not lose a completion when an earlier page sync finishes late", async () => {
    let resolve!: (value: { ok: boolean; attempts: IowaAttempt[] }) => void
    sync.mockReturnValueOnce(new Promise((done) => { resolve = done }))
    const first = syncIowaProgress("aden")
    await Promise.resolve(); await Promise.resolve()
    const result = attempt()
    const second = syncIowaProgress("aden", result)
    resolve({ ok: true, attempts: [] })
    await first
    expect((await second).progress.mathematics.attempts).toBe(1)
    expect(readIowaAttempts("aden")).toHaveLength(1)
  })

  it("rejects unknown, duplicate, incomplete, and invalid-choice attempts", () => {
    const result = attempt()
    expect(iowaAttemptSchema.safeParse(result).success).toBe(true)
    for (const invalid of [
      { ...result, unitId: "unknown" }, { ...result, questionNumbers: [question.number, question.number] },
      { ...result, answers: {} }, { ...result, questionNumbers: [999999] },
      { ...result, answers: { [question.number]: "Z" } },
    ]) expect(iowaAttemptSchema.safeParse(invalid).success).toBe(false)
  })

  it("ignores corrupt summaries and attempt caches", () => {
    localStorage.setItem("iowa:v1:aden", '{"mathematics":{"best":"bad"}}')
    localStorage.setItem("iowa:attempts:v2:aden", '[null,{"bad":true}]')
    expect(getUnitProgress("aden", "mathematics")).toBeNull()
    expect(readIowaAttempts("aden")).toEqual([])
  })
})
