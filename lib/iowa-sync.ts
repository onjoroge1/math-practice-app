import { syncIowaAttemptsAction } from "./iowa-actions"
import { getLegacyIowaProgress } from "./iowa-progress"
import { mergeIowaAttempts, readIowaAttempts, summarizeIowaAttempts, writeIowaAttempts, type CachedIowaAttempt, type IowaAttempt } from "./iowa-attempts"

export type IowaSaveStatus = "syncing" | "synced" | "local" | "unavailable"

// Serialize syncs per child so an older response cannot erase a newer local attempt.
const inFlight = new Map<string, Promise<unknown>>()

export function syncIowaProgress(studentId: string, completed?: IowaAttempt) {
  const previous = inFlight.get(studentId) ?? Promise.resolve()
  // Save before the first await, even when another sync is running.
  let initial = readIowaAttempts(studentId)
  if (completed && !initial.some((attempt) => attempt.id === completed.id)) initial = [...initial, completed]
  const savedLocally = writeIowaAttempts(studentId, initial)
  const request = previous.catch(() => undefined).then(async () => {
    let attempts: CachedIowaAttempt[] = mergeIowaAttempts([...initial, ...readIowaAttempts(studentId)], [])
    let remoteOk = false
    try {
      const pending = attempts.filter((attempt) => !attempt.synced)
      // Bounded uploads, followed by the same read even on a device with no local history.
      for (let offset = 0; offset < Math.max(pending.length, 1); offset += 100) {
        const response = await syncIowaAttemptsAction(studentId, pending.slice(offset, offset + 100))
        if (!response.ok) break
        remoteOk = true
        attempts = mergeIowaAttempts([...attempts, ...readIowaAttempts(studentId)], response.attempts)
      }
    } catch { /* Show the local result and retry on the next visit. */ }
    const persisted = writeIowaAttempts(studentId, attempts)
    const allSynced = remoteOk && attempts.every((attempt) => attempt.synced)
    const status: IowaSaveStatus = allSynced ? "synced" : persisted || savedLocally ? "local" : "unavailable"
    return { attempts, progress: summarizeIowaAttempts(getLegacyIowaProgress(studentId), attempts), status }
  })
  inFlight.set(studentId, request)
  void request.finally(() => { if (inFlight.get(studentId) === request) inFlight.delete(studentId) }).catch(() => undefined)
  return request
}

export const IOWA_SAVE_MESSAGES: Record<IowaSaveStatus, string> = {
  syncing: "Saving scores…",
  synced: "Scores synced. Your new results are available when you choose Aden on another device.",
  local: "Scores saved on this device. Sync is unavailable; we’ll retry when you return here.",
  unavailable: "We couldn’t save your scores. Keep this page open and retry.",
}
