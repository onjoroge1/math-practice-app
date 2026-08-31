"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Target, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { trackDrillCompleted, trackDrillStarted } from "@/lib/analytics"
import { saveDrillResult } from "@/lib/drill-results"
import {
  getSocialStudiesTest,
  prepareSocialStudiesTestQuestions,
  scoreSocialStudiesTest,
} from "@/lib/grade5-social-studies"
import { currentStudentContext } from "@/lib/iowa-progress"
import { recordSocialStudiesAttempt } from "@/lib/social-studies-progress"

type Phase = "ready" | "running" | "results"

interface SavedAttempt {
  questionIds: string[]
  answers: Record<string, number>
  index: number
  startedAt: number
}

const draftKey = (studentId: string, testId: string) => `social-studies:draft:v1:${studentId}:${testId}`

function readDraft(studentId: string, testId: string): SavedAttempt | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(draftKey(studentId, testId)) || "null") as SavedAttempt | null
    if (!parsed || !Array.isArray(parsed.questionIds) || !parsed.answers || !Number.isInteger(parsed.index)) return null
    return parsed
  } catch {
    return null
  }
}

export default function Grade5SocialStudiesTest({ testId }: { testId: string }) {
  const router = useRouter()
  const test = getSocialStudiesTest(testId)
  const questions = useMemo(() => prepareSocialStudiesTestQuestions(testId), [testId])
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<Phase>("ready")
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showAllReview, setShowAllReview] = useState(false)
  const [resumed, setResumed] = useState(false)
  const studentIdRef = useRef("")
  const startedAtRef = useRef(0)
  const submittedRef = useRef(false)

  useEffect(() => {
    const student = currentStudentContext()
    if (!student || student.grade !== 5) {
      router.replace("/topic-select")
      return
    }

    studentIdRef.current = student.id
    const draft = readDraft(student.id, testId)
    const questionIds = questions.map((question) => question.id)
    const canResume = Boolean(
      draft &&
      draft.questionIds.length === questionIds.length &&
      draft.questionIds.every((questionId, questionIndex) => questionId === questionIds[questionIndex]),
    )

    if (draft && canResume) {
      setAnswers(draft.answers)
      setIndex(Math.min(Math.max(0, draft.index), Math.max(0, questions.length - 1)))
      startedAtRef.current = draft.startedAt
      setPhase("running")
      setResumed(true)
    }
    setReady(true)
  }, [questions, router, testId])

  useEffect(() => {
    if (phase !== "running" || !studentIdRef.current) return
    const draft: SavedAttempt = {
      questionIds: questions.map((question) => question.id),
      answers,
      index,
      startedAt: startedAtRef.current,
    }
    try {
      localStorage.setItem(draftKey(studentIdRef.current, testId), JSON.stringify(draft))
    } catch {
      // The final result is also mirrored to the database; storage failure is non-fatal.
    }
  }, [answers, index, phase, questions, testId])

  if (!test) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-amber-50 p-6">
        <Card className="max-w-md space-y-4 p-8 text-center">
          <h1 className="text-2xl font-black text-slate-900">Practice test not found</h1>
          <Button onClick={() => router.push("/grade5-social-studies")}>Back to exam prep</Button>
        </Card>
      </main>
    )
  }

  if (!ready) {
    return <main className="flex min-h-screen items-center justify-center bg-amber-50 text-xl font-semibold text-slate-600">Loading Aden&apos;s test…</main>
  }

  const currentQuestion = questions[index]
  const result = scoreSocialStudiesTest(questions, answers)
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const missedQuestions = questions.filter((question) => answers[question.id] !== question.answer)
  const reviewQuestions = showAllReview ? questions : missedQuestions

  function startTest() {
    startedAtRef.current = Date.now()
    submittedRef.current = false
    setAnswers({})
    setIndex(0)
    setResumed(false)
    setShowAllReview(false)
    setPhase("running")
    trackDrillStarted(test!.title, 5)
  }

  function finishTest() {
    if (submittedRef.current || result.answered !== questions.length) return
    submittedRef.current = true
    const completedAt = new Date().toISOString()
    recordSocialStudiesAttempt(studentIdRef.current, testId, result.percent)
    saveDrillResult(
      {
        topic: `Social Studies: ${test!.shortTitle}`,
        subject: "Grade 5 • Wednesday Exam Prep",
        correct: result.correct,
        total: questions.length,
        answered: result.answered,
        accuracy: result.percent,
        completedAt,
      },
      startedAtRef.current || Date.now(),
    )
    trackDrillCompleted(test!.title, 5, result.percent, result.correct, questions.length)
    localStorage.removeItem(draftKey(studentIdRef.current, testId))
    setPhase("results")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function restartTest() {
    setPhase("ready")
    setAnswers({})
    setIndex(0)
    setShowAllReview(false)
    submittedRef.current = false
    localStorage.removeItem(draftKey(studentIdRef.current, testId))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scoreMessage = result.percent >= 90
    ? "Excellent—Aden is ready to explain these ideas."
    : result.percent >= 75
      ? "Good progress—review the missed explanations once more."
      : "Keep practicing—the review below shows exactly what to study next."

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">Aden • Grade 5 • Wednesday exam prep</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{test.icon} {test.title}</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-orange-50">{test.description}</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/grade5-social-studies")} className="self-start border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              Back to tests
            </Button>
          </div>
        </header>

        {phase === "ready" && (
          <Card className="rounded-3xl border-amber-200 bg-white p-8 text-center shadow-xl sm:p-12">
            <Target className="mx-auto h-16 w-16 text-orange-500" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-black text-slate-900">Ready for {questions.length} questions?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Answer every question without notes first. After submitting, Aden will get a clear explanation for every missed answer.
            </p>
            <Button onClick={startTest} size="lg" className="mt-7 min-h-14 rounded-2xl bg-orange-500 px-8 text-lg font-black text-white hover:bg-orange-600">
              Start practice test <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        )}

        {phase === "running" && currentQuestion && (
          <>
            {resumed && (
              <div role="status" className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-center font-semibold text-indigo-700">
                Continuing where you left off—your answers were saved.
              </div>
            )}
            <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between gap-4 text-sm font-bold text-slate-600">
                <span>Question {index + 1} of {questions.length}</span>
                <span>{result.answered} answered</span>
              </div>
              <Progress value={((index + 1) / questions.length) * 100} className="mt-3 h-2" />
              <div className="mt-8">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-800">{currentQuestion.skill}</span>
                <h2 className="mt-4 text-2xl font-black leading-snug text-slate-900">{currentQuestion.prompt}</h2>
                <fieldset className="mt-6 space-y-3">
                  <legend className="sr-only">Choose one answer</legend>
                  {currentQuestion.choices.map((choice, choiceIndex) => {
                    const selected = selectedAnswer === choiceIndex
                    return (
                      <button
                        key={choice}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: choiceIndex }))}
                        className={`flex min-h-14 w-full items-center gap-4 rounded-2xl border-2 p-4 text-left font-semibold transition-colors ${selected ? "border-orange-500 bg-orange-50 text-orange-950" : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/50"}`}
                      >
                        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-black ${selected ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {String.fromCharCode(65 + choiceIndex)}
                        </span>
                        {choice}
                      </button>
                    )
                  })}
                </fieldset>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <Button type="button" variant="outline" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                {index === questions.length - 1 ? (
                  <Button type="button" disabled={result.answered !== questions.length} onClick={finishTest} className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {result.answered === questions.length ? "Submit test" : `${questions.length - result.answered} unanswered`}
                  </Button>
                ) : (
                  <Button type="button" disabled={!Number.isInteger(selectedAnswer)} onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))} className="bg-orange-500 text-white hover:bg-orange-600">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </>
        )}

        {phase === "results" && (
          <>
            <Card className="rounded-3xl border-emerald-200 bg-white p-8 text-center shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Completed</p>
              <p className="mt-2 text-7xl font-black text-emerald-700">{result.percent}%</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{result.correct} of {questions.length} correct</p>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">{scoreMessage}</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={restartTest} className="bg-orange-500 text-white hover:bg-orange-600"><RotateCcw className="mr-2 h-4 w-4" /> Try again</Button>
                <Button variant="outline" onClick={() => router.push("/grade5-social-studies")}>Choose another test</Button>
              </div>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-lg sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Answer review</h2>
                  <p className="mt-1 text-sm text-slate-600">Start with missed questions, then check every explanation if needed.</p>
                </div>
                <Button variant="outline" onClick={() => setShowAllReview((current) => !current)}>
                  {showAllReview ? "Show missed only" : "Show all answers"}
                </Button>
              </div>

              {reviewQuestions.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center font-bold text-emerald-800">Perfect score—nothing was missed!</div>
              ) : (
                <div className="mt-6 space-y-4">
                  {reviewQuestions.map((question) => {
                    const correct = answers[question.id] === question.answer
                    return (
                      <article key={question.id} className={`rounded-2xl border p-5 ${correct ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"}`}>
                        <div className="flex items-start gap-3">
                          {correct ? <CheckCircle2 className="mt-0.5 h-6 w-6 flex-none text-emerald-600" /> : <XCircle className="mt-0.5 h-6 w-6 flex-none text-rose-600" />}
                          <div>
                            <h3 className="font-black text-slate-900">{question.prompt}</h3>
                            {!correct && <p className="mt-2 text-sm text-rose-800"><strong>Aden chose:</strong> {question.choices[answers[question.id]]}</p>}
                            <p className="mt-1 text-sm text-emerald-800"><strong>Correct answer:</strong> {question.choices[question.answer]}</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-700">{question.explanation}</p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
