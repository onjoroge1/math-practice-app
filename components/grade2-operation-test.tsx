"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Clock3, Play, RotateCcw, XCircle } from "lucide-react"
import { trackDrillCompleted, trackDrillStarted } from "@/lib/analytics"
import { saveDrillResult } from "@/lib/drill-results"
import {
  GRADE2_OPERATION_CONFIG,
  GRADE2_TEST_QUESTION_COUNT,
  GRADE2_TEST_SECONDS,
  generateGrade2Test,
  scoreGrade2Test,
  type Grade2Operation,
} from "@/lib/grade2-operation-test"
import type { QuizQuestion } from "@/lib/adaptive-quiz"

type Phase = "ready" | "running" | "results"

const ACCENTS = {
  blue: {
    header: "bg-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
    border: "focus-within:border-blue-500",
    timer: "text-blue-600",
  },
  green: {
    header: "bg-green-600",
    button: "bg-green-600 hover:bg-green-700",
    border: "focus-within:border-green-500",
    timer: "text-green-600",
  },
  purple: {
    header: "bg-purple-600",
    button: "bg-purple-600 hover:bg-purple-700",
    border: "focus-within:border-purple-500",
    timer: "text-purple-600",
  },
  orange: {
    header: "bg-orange-500",
    button: "bg-orange-500 hover:bg-orange-600",
    border: "focus-within:border-orange-500",
    timer: "text-orange-600",
  },
}

interface TestResult {
  correct: number
  answered: number
  accuracy: number
  rubric: 1 | 2 | 3
}

function blankAnswers() {
  return Array<string>(GRADE2_TEST_QUESTION_COUNT).fill("")
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
}

export default function Grade2OperationTest({ kind }: { kind: Grade2Operation }) {
  const router = useRouter()
  const config = GRADE2_OPERATION_CONFIG[kind]
  const accent = ACCENTS[config.accent]
  const [phase, setPhase] = useState<Phase>("ready")
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => generateGrade2Test(kind))
  const [answers, setAnswers] = useState<string[]>(blankAnswers)
  const [timeLeft, setTimeLeft] = useState(GRADE2_TEST_SECONDS)
  const [result, setResult] = useState<TestResult | null>(null)
  const answersRef = useRef(answers)
  const startTimeRef = useRef(0)
  const submittedRef = useRef(false)
  const firstInputRef = useRef<HTMLInputElement>(null)
  answersRef.current = answers

  const finishTest = useCallback((submittedAnswers: string[]) => {
    if (submittedRef.current) return
    submittedRef.current = true

    const { correct, answered, accuracy, rubric } = scoreGrade2Test(questions, submittedAnswers)
    const completedAt = new Date().toISOString()

    saveDrillResult(
      {
        topic: `Grade 2 ${config.title}`,
        subject: config.subject,
        correct,
        total: questions.length,
        answered,
        accuracy,
        completedAt,
      },
      startTimeRef.current || Date.now(),
    )
    trackDrillCompleted(config.title, 2, accuracy, correct, questions.length)
    setResult({ correct, answered, accuracy, rubric })
    setPhase("results")
  }, [config.subject, config.title, questions])

  useEffect(() => {
    if (phase !== "running") return

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [finishTest, phase])

  useEffect(() => {
    if (phase === "running" && timeLeft === 0) finishTest(answersRef.current)
  }, [finishTest, phase, timeLeft])

  useEffect(() => {
    if (phase === "running") firstInputRef.current?.focus()
  }, [phase])

  function startTest() {
    submittedRef.current = false
    startTimeRef.current = Date.now()
    trackDrillStarted(config.title, 2)
    setPhase("running")
  }

  function restartTest() {
    setQuestions(generateGrade2Test(kind))
    setAnswers(blankAnswers())
    setTimeLeft(GRADE2_TEST_SECONDS)
    setResult(null)
    submittedRef.current = false
    startTimeRef.current = 0
    setPhase("ready")
  }

  function updateAnswer(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    setAnswers((current) => current.map((answer, answerIndex) => (answerIndex === index ? value : answer)))
  }

  const isUrgent = phase === "running" && timeLeft <= 30

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <header className={`${accent.header} px-5 py-5 text-white sm:px-8`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Grade 2 • Three-minute pre-test</p>
              <h1 className="mt-1 text-3xl font-black sm:text-4xl">{config.icon} {config.title}</h1>
              <p className="mt-1 text-sm font-medium text-white/90">{config.subject}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/topic-select")}
              className="self-start rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20 sm:self-auto"
            >
              Back to topics
            </button>
          </div>
        </header>

        <section className="border-b border-slate-200 px-5 py-6 sm:px-8">
          <p className="text-slate-700">
            <strong className="text-slate-950">Directions:</strong> {config.directions}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Scoring rubric">
            <RubricCard level={3} range="40–50 correct" color="green" />
            <RubricCard level={2} range="35–39 correct" color="yellow" />
            <RubricCard level={1} range="34 or fewer" color="red" />
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={`flex items-center gap-3 ${isUrgent ? "text-red-600 motion-safe:animate-pulse" : accent.timer}`}
              role="timer"
              aria-label={`${formatTime(timeLeft)} remaining`}
            >
              <Clock3 className="h-8 w-8" aria-hidden="true" />
              <span className="font-mono text-3xl font-black tabular-nums">{formatTime(timeLeft)}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {phase === "ready" && (
                <button
                  type="button"
                  onClick={startTest}
                  className={`inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-bold text-white shadow-sm ${accent.button}`}
                >
                  <Play className="mr-2 h-5 w-5" aria-hidden="true" /> Start test
                </button>
              )}
              {phase === "running" && (
                <button
                  type="button"
                  onClick={() => finishTest(answersRef.current)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden="true" /> Submit answers
                </button>
              )}
              {phase === "results" && (
                <button
                  type="button"
                  onClick={restartTest}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-700 px-6 py-3 font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  <RotateCcw className="mr-2 h-5 w-5" aria-hidden="true" /> Try a fresh test
                </button>
              )}
            </div>
          </div>
        </section>

        {phase === "ready" ? (
          <section className="flex min-h-80 flex-col items-center justify-center bg-slate-50 px-6 py-16 text-center">
            <AlertTriangle className="mb-4 h-14 w-14 text-amber-500" aria-hidden="true" />
            <h2 className="text-2xl font-black text-slate-900">Ready for your math sprint?</h2>
            <p className="mt-2 max-w-lg text-slate-600">
              You will have exactly 3 minutes to answer 50 problems. The questions appear when you press Start test.
            </p>
          </section>
        ) : (
          <>
            {result && (
              <section className="border-b border-blue-100 bg-blue-50 px-6 py-6" aria-live="polite">
                <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-5 text-center sm:flex-row sm:gap-10">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Score</p>
                    <p className="text-4xl font-black text-blue-900">{result.correct} / {questions.length}</p>
                    <p className="text-sm text-blue-700">{result.answered} answered • {result.accuracy}% accuracy</p>
                  </div>
                  <div className="h-px w-24 bg-blue-200 sm:h-16 sm:w-px" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Rubric level</p>
                    <div className="mx-auto mt-1 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl font-black text-white">
                      {result.rubric}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-slate-50 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {questions.map((question, index) => {
                  const showResult = phase === "results"
                  const isCorrect = showResult && answers[index] !== "" && Number(answers[index]) === question.answer

                  return (
                    <div
                      key={question.id}
                      className={`rounded-xl border-2 bg-white p-3 transition-colors ${
                        showResult
                          ? isCorrect
                            ? "border-green-300 bg-green-50"
                            : "border-red-300 bg-red-50"
                          : `border-slate-200 ${accent.border}`
                      }`}
                    >
                      <label className="flex min-h-11 items-center justify-between gap-1">
                        <span className="whitespace-nowrap text-base font-bold text-slate-700">
                          {question.question} =
                        </span>
                        <input
                          ref={index === 0 ? firstInputRef : undefined}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={answers[index]}
                          onChange={(event) => updateAnswer(index, event.target.value)}
                          disabled={showResult}
                          aria-label={`Answer for ${question.question}`}
                          className="w-14 border-b-2 border-slate-300 bg-transparent p-1 text-center text-lg font-black text-slate-950 outline-none disabled:border-transparent disabled:opacity-100"
                        />
                      </label>

                      {showResult && (
                        <div className={`mt-2 flex items-center justify-center gap-1 text-xs font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                          {isCorrect ? (
                            <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Correct</>
                          ) : (
                            <><XCircle className="h-4 w-4" aria-hidden="true" /> Answer: {question.answer}</>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function RubricCard({ level, range, color }: { level: number; range: string; color: "green" | "yellow" | "red" }) {
  const styles = {
    green: "border-green-200 bg-green-50 text-green-800",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
    red: "border-red-200 bg-red-50 text-red-800",
  }

  return (
    <div className={`rounded-xl border p-3 text-center ${styles[color]}`}>
      <p className="text-3xl font-black">{level}</p>
      <p className="text-sm font-semibold">{range} in 3 minutes</p>
    </div>
  )
}
