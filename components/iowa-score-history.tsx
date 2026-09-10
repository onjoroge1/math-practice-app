import { getIowaUnit } from "@/lib/iowa-grade5"
import { scoreSavedIowaAttempt, type IowaAttempt } from "@/lib/iowa-attempts"

export function IowaScoreHistory({ attempts }: { attempts: IowaAttempt[] }) {
  if (!attempts.length) return null
  return <section className="rounded-2xl border border-indigo-200 bg-white p-4 sm:p-6 space-y-3">
    <h2 className="text-xl font-bold text-slate-800">Your recent scores</h2>
    <p className="text-sm text-slate-500">Percent correct on each practice. Different question sets may vary in difficulty.</p>
    <ol className="space-y-3">
      {attempts.slice(0, 10).map((attempt) => {
        const score = scoreSavedIowaAttempt(attempt)
        return <li key={attempt.id} className="rounded-xl bg-slate-50 p-3">
          <div className="flex justify-between gap-3">
            <div><p className="font-bold text-slate-800">{getIowaUnit(attempt.unitId)?.name}</p><p className="text-xs text-slate-500">{new Date(attempt.completedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p></div>
            <div className="text-right"><p className="text-xl font-black text-indigo-700">{score.percent}%</p><p className="text-xs text-slate-500">{score.correct}/{score.total} correct</p></div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-indigo-100" aria-hidden="true"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${score.percent}%` }} /></div>
        </li>
      })}
    </ol>
  </section>
}
