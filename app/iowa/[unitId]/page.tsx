"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  getIowaUnit,
  sampleUnit,
  stimulusFor,
  scoreIowaAttempt,
  IOWA_TARGET,
  type IowaQuestion,
  type IowaUnit,
} from "@/lib/iowa-grade5"
import {
  clearAttemptDraft,
  currentStudentContext,
  getAttemptDraft,
  getUnitProgress,
  recordAttempt,
  saveAttemptDraft,
} from "@/lib/iowa-progress"
import { saveDrillResult } from "@/lib/drill-results"
import { trackDrillCompleted, trackDrillStarted } from "@/lib/analytics"
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, RotateCcw, Save } from "lucide-react"

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
  const [resumed, setResumed] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof scoreIowaAttempt> | null>(null)
  const studentIdRef = useRef("")
  const startedAtRef = useRef(0)
  const elapsedMsRef = useRef(0)
  const activeSinceRef = useRef(0)
  const completedRef = useRef(false)
  const launchKeyRef = useRef("")

  const startAttempt = useCallback(() => {
    if (!unit) return
    const student = currentStudentContext()
    if (!student || student.grade !== 5) {
      router.replace("/topic-select")
      return
    }

    studentIdRef.current = student.id
    completedRef.current = false
    const prev = getUnitProgress(student.id, unit.id)
    const seen = new Set<number>(prev?.seen ?? [])
    const draft = getAttemptDraft(student.id, unit.id)
    const byNumber = new Map(unit.questions.map((question) => [question.number, question]))
    const savedQuestions = draft?.questionNumbers.map((number) => byNumber.get(number)) ?? []
    const canResume = Boolean(
      draft &&
      draft.questionNumbers.length > 0 &&
      savedQuestions.every((question): question is IowaQuestion => Boolean(question)),
    )

    if (draft && canResume) {
      const restored = savedQuestions as IowaQuestion[]
      setQuestions(restored)
      setIndex(Math.min(Math.max(0, draft.index), restored.length - 1))
      setAnswers(draft.answers)
      startedAtRef.current = draft.startedAt
      elapsedMsRef.current = draft.elapsedMs
      activeSinceRef.current = Date.now()
      setResumed(true)
    } else {
      const freshQuestions = sampleUnit(unit, IOWA_TARGET, seen)
      const startedAt = Date.now()
      setQuestions(freshQuestions)
      setIndex(0)
      setAnswers({})
      startedAtRef.current = startedAt
      elapsedMsRef.current = 0
      activeSinceRef.current = startedAt
      setResumed(false)
      saveAttemptDraft(student.id, {
        unitId: unit.id,
        questionNumbers: freshQuestions.map((question) => question.number),
        answers: {},
        index: 0,
        startedAt,
        elapsedMs: 0,
      })
      trackDrillStarted(`Iowa ${unit.name}`, 5)
    }

    setFinished(false)
    setShowReview(false)
    setResult(null)
    setLoaded(true)
  }, [router, unit])

  useEffect(() => {
    const launchKey = `${params.unitId}:${attemptKey}`
    if (launchKeyRef.current === launchKey) return
    launchKeyRef.current = launchKey
    startAttempt()
  }, [attemptKey, params.unitId, startAttempt])

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

  const persistDraft = (nextAnswers: Record<number, string>, nextIndex: number) => {
    const now = Date.now()
    elapsedMsRef.current += Math.max(0, now - activeSinceRef.current)
    activeSinceRef.current = now
    saveAttemptDraft(studentIdRef.current, {
      unitId: unit.id,
      questionNumbers: questions.map((question) => question.number),
      answers: nextAnswers,
      index: nextIndex,
      startedAt: startedAtRef.current,
      elapsedMs: elapsedMsRef.current,
    })
  }

  const select = (label: string) => {
    const next = { ...answers, [q.number]: label }
    setAnswers(next)
    persistDraft(next, index)
  }

  const finishAttempt = () => {
    if (!chosen || completedRef.current) return
    completedRef.current = true
    const completedAt = Date.now()
    const totalElapsedMs = elapsedMsRef.current + Math.max(0, completedAt - activeSinceRef.current)
    const outcome = scoreIowaAttempt(questions, answers)
    recordAttempt(studentIdRef.current, unit.id, outcome.percent, questions.map((question) => question.number))
    clearAttemptDraft(studentIdRef.current, unit.id)
    saveDrillResult(
      {
        topic: `Iowa ${unit.name}`,
        subject: "Grade 5 • Iowa Practice",
        correct: outcome.correct,
        total: outcome.total,
        answered: outcome.answered,
        accuracy: outcome.percent,
        completedAt: new Date(completedAt).toISOString(),
      },
      completedAt - totalElapsedMs,
    )
    trackDrillCompleted(`Iowa ${unit.name}`, 5, outcome.percent, outcome.correct, outcome.total)
    setResult(outcome)
    setFinished(true)
  }

  const goNext = () => {
    if (!chosen) return
    if (isLast) {
      finishAttempt()
      return
    }
    const nextIndex = index + 1
    setIndex(nextIndex)
    persistDraft(answers, nextIndex)
  }
  const goPrev = () => {
    const nextIndex = Math.max(0, index - 1)
    setIndex(nextIndex)
    persistDraft(answers, nextIndex)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-5">
        {resumed && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
            <Save className="h-4 w-4" aria-hidden="true" /> Continuing where you left off — your answers were saved.
          </div>
        )}
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
            disabled={!chosen}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            {!chosen ? "Choose an answer" : isLast ? "Finish" : "Next"}
            {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
