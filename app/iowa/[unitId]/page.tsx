"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  getIowaUnit,
  sampleUnit,
  stimulusFor,
  bandFor,
  IOWA_TARGET,
  type IowaQuestion,
  type IowaUnit,
} from "@/lib/iowa-grade5"
import { currentStudentId, getUnitProgress, recordAttempt } from "@/lib/iowa-progress"
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, RotateCcw } from "lucide-react"

const TONE_TEXT: Record<string, string> = {
  emerald: "text-emerald-600",
  sky: "text-sky-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
}
const TONE_CHIP: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  sky: "bg-sky-100 text-sky-700 border-sky-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
}
const TONE_BAR: Record<string, string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
}

function Stimulus({ unit, q }: { unit: IowaUnit; q: IowaQuestion }) {
  const s = stimulusFor(unit, q)
  if (!s) return null
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 max-h-64 overflow-y-auto">
      {s.title && <div className="font-bold text-slate-800 mb-1">{s.title}</div>}
      <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{s.body}</div>
    </div>
  )
}

export default function IowaUnitPage() {
  const router = useRouter()
  const params = useParams<{ unitId: string }>()
  const unit = getIowaUnit(params.unitId)

  const [questions, setQuestions] = useState<IowaQuestion[]>([])
  const [loaded, setLoaded] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [finished, setFinished] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [attemptKey, setAttemptKey] = useState(0)

  const startAttempt = useCallback(() => {
    if (!unit) return
    const prev = getUnitProgress(currentStudentId(), unit.id)
    const seen = new Set<number>(prev?.seen ?? [])
    setQuestions(sampleUnit(unit, IOWA_TARGET, seen))
    setIndex(0)
    setAnswers({})
    setFinished(false)
    setShowReview(false)
    setLoaded(true)
  }, [unit])

  useEffect(() => {
    startAttempt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.unitId, attemptKey])

  const result = useMemo(() => {
    if (!finished || !unit) return null
    const total = questions.length
    const correct = questions.filter((q) => answers[q.number] === q.answer).length
    const percent = total ? Math.round((correct / total) * 100) : 0
    return { total, correct, percent, band: bandFor(percent) }
  }, [finished, questions, answers, unit])

  useEffect(() => {
    if (finished && result && unit) {
      recordAttempt(
        currentStudentId(),
        unit.id,
        result.percent,
        questions.map((q) => q.number),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  if (!unit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <Card className="p-8 text-center space-y-4">
          <div className="text-2xl font-bold text-slate-800">Unit not found</div>
          <Button onClick={() => router.push("/iowa")}>Back to units</Button>
        </Card>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl text-slate-600">Preparing your {unit.name} quiz…</div>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (finished && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-8 text-center space-y-4 bg-white">
            <div className="text-lg font-semibold text-slate-500">{unit.name} results</div>
            <div className={`text-6xl font-extrabold ${TONE_TEXT[result.band.tone]}`}>
              {result.percent}%
            </div>
            <div
              className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border ${TONE_CHIP[result.band.tone]}`}
            >
              {result.band.label}
            </div>
            <div className="text-slate-600">
              {result.correct} of {result.total} correct
            </div>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{result.band.guidance}</p>
            <div className="flex gap-3 justify-center pt-2 flex-wrap">
              <Button variant="outline" onClick={() => setShowReview((v) => !v)}>
                {showReview ? "Hide review" : "Review answers"}
              </Button>
              <Button
                onClick={() => setAttemptKey((k) => k + 1)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Practice again
              </Button>
              <Button variant="outline" onClick={() => router.push("/iowa")}>
                All units
              </Button>
            </div>
          </Card>

          {showReview && (
            <div className="space-y-3">
              {questions.map((q, i) => {
                const chosen = answers[q.number]
                const correct = chosen === q.answer
                return (
                  <Card key={q.number} className="p-4 bg-white">
                    <div className="flex items-start gap-2">
                      {correct ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800">
                          {i + 1}. {q.stem}
                        </div>
                        <div className="text-sm mt-1 space-y-0.5">
                          <div className={correct ? "text-emerald-700" : "text-rose-700"}>
                            Your answer:{" "}
                            {chosen
                              ? `${chosen}. ${q.choices.find((c) => c.label === chosen)?.text ?? ""}`
                              : "— (skipped)"}
                          </div>
                          {!correct && (
                            <div className="text-emerald-700">
                              Correct: {q.answer}.{" "}
                              {q.choices.find((c) => c.label === q.answer)?.text ?? ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  const q = questions[index]
  const chosen = answers[q.number]
  const answeredCount = Object.keys(answers).length
  const pct = Math.round(((index + 1) / questions.length) * 100)
  const isLast = index === questions.length - 1

  const select = (label: string) => setAnswers((a) => ({ ...a, [q.number]: label }))
  const goNext = () => (isLast ? setFinished(true) : setIndex((i) => i + 1))
  const goPrev = () => setIndex((i) => Math.max(0, i - 1))

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/iowa")}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit
          </Button>
          <div className="text-sm text-slate-600">
            {unit.name} · {answeredCount}/{questions.length} answered
          </div>
        </div>

        {/* progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <Card className="p-6 bg-white">
          <Stimulus unit={unit} q={q} />
          <div className="text-lg font-semibold text-slate-800 mb-4">{q.stem}</div>
          <div className="space-y-2">
            {q.choices.map((c) => {
              const selected = chosen === c.label
              return (
                <button
                  key={c.label}
                  onClick={() => select(c.label)}
                  aria-pressed={selected}
                  className={`w-full text-left flex items-start gap-3 rounded-xl border-2 p-3 transition-all ${
                    selected
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {c.label}
                  </span>
                  <span className="text-slate-800 pt-0.5">{c.text}</span>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={goPrev} disabled={index === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          <Button
            onClick={goNext}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            {isLast ? "Finish" : "Next"}
            {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
