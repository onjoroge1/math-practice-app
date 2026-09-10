"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { saveDrillResult, type DrillResult } from "@/lib/drill-results"
import { trackDrillCompleted } from "@/lib/analytics"
import { ArithmeticReview } from "@/components/arithmetic-review"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrillQuestion {
  id: number
  question: string
  answer: number | string
}

export interface DrillConfig {
  title: string
  description: string
  subject: string
  accentColor: string
  mode: "grid" | "sequential"
  generateQuestions: () => DrillQuestion[]
  totalTime?: number
  questionCount?: number
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string; timer: string }> = {
  indigo:  { bg: "bg-indigo-600",  text: "text-indigo-600",  border: "border-indigo-300", light: "bg-indigo-50",  timer: "bg-indigo-600"  },
  green:   { bg: "bg-green-600",   text: "text-green-600",   border: "border-green-300",  light: "bg-green-50",   timer: "bg-green-600"   },
  purple:  { bg: "bg-purple-600",  text: "text-purple-600",  border: "border-purple-300", light: "bg-purple-50",  timer: "bg-purple-600"  },
  pink:    { bg: "bg-pink-600",    text: "text-pink-600",    border: "border-pink-300",   light: "bg-pink-50",    timer: "bg-pink-600"    },
  orange:  { bg: "bg-orange-500",  text: "text-orange-500",  border: "border-orange-300", light: "bg-orange-50",  timer: "bg-orange-500"  },
  cyan:    { bg: "bg-cyan-600",    text: "text-cyan-600",    border: "border-cyan-300",   light: "bg-cyan-50",    timer: "bg-cyan-600"    },
  blue:    { bg: "bg-blue-600",    text: "text-blue-600",    border: "border-blue-300",   light: "bg-blue-50",    timer: "bg-blue-600"    },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-300",light: "bg-emerald-50", timer: "bg-emerald-600" },
}

// ─── Grid Mode ────────────────────────────────────────────────────────────────

function GridDrill({ config, questions, onComplete }: {
  config: DrillConfig
  questions: DrillQuestion[]
  onComplete: (answers: Record<number, string>) => void
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(config.totalTime ?? 300)
  const [submitted, setSubmitted] = useState(false)
  const colors = COLOR_MAP[config.accentColor] ?? COLOR_MAP.indigo

  useEffect(() => {
    if (submitted) return
    const t = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [submitted])

  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      setSubmitted(true)
      onComplete(answers)
    }
  }, [timeLeft, submitted, answers, onComplete])

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0")
  const secs = String(timeLeft % 60).padStart(2, "0")
  const isUrgent = timeLeft < 60

  function handleSubmit() {
    setSubmitted(true)
    onComplete(answers)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${colors.bg} text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10`}>
        <div>
          <p className="text-xs opacity-80 font-medium uppercase tracking-wide">{config.subject}</p>
          <h1 className="text-lg font-bold">{config.title}</h1>
        </div>
        <div className={`flex flex-col items-center px-4 py-1 rounded-xl ${isUrgent ? "bg-red-500 animate-pulse" : "bg-white/20"}`}>
          <span className="text-xs opacity-80">Time</span>
          <span className="text-2xl font-mono font-bold">{mins}:{secs}</span>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">Answered</p>
          <p className="text-lg font-bold">{Object.keys(answers).length}/{questions.length}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 text-center">{q.question}</span>
              <input
                type="number"
                inputMode="numeric"
                value={answers[q.id] ?? ""}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                className={`w-full text-center border-2 rounded-lg p-1 text-sm font-bold focus:outline-none focus:ring-2 ${
                  answers[q.id] ? `${colors.border} ${colors.text}` : "border-gray-200 text-gray-700"
                } focus:ring-offset-0 focus:${colors.border}`}
                placeholder="?"
                aria-label={`Answer for ${q.question}`}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center pb-8">
          <button
            onClick={handleSubmit}
            className={`${colors.bg} text-white font-bold py-3 px-12 rounded-2xl text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all`}
          >
            Submit Answers
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sequential Mode ──────────────────────────────────────────────────────────

function SequentialDrill({ config, questions, onComplete }: {
  config: DrillConfig
  questions: DrillQuestion[]
  onComplete: (answers: Record<number, string>) => void
}) {
  const [current, setCurrent] = useState(0)
  const [inputVal, setInputVal] = useState("")
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [timeLeft, setTimeLeft] = useState(config.totalTime ?? 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const colors = COLOR_MAP[config.accentColor] ?? COLOR_MAP.indigo

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => {
      clearInterval(t)
      if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (timeLeft === 0) onComplete(answers)
  }, [timeLeft, answers, onComplete])

  useEffect(() => { inputRef.current?.focus() }, [current])

  function handleSubmit() {
    if (!inputVal.trim() || feedback) return
    const q = questions[current]
    const correct = String(q.answer).trim().toLowerCase() === inputVal.trim().toLowerCase()
    setFeedback(correct ? "correct" : "wrong")
    setAnswers(prev => ({ ...prev, [q.id]: inputVal.trim() }))
    nextTimeoutRef.current = setTimeout(() => {
      setFeedback(null)
      setInputVal("")
      if (current + 1 >= questions.length) {
        onComplete({ ...answers, [q.id]: inputVal.trim() })
      } else {
        setCurrent(prev => prev + 1)
      }
    }, 600)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit()
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0")
  const secs = String(timeLeft % 60).padStart(2, "0")
  const isUrgent = timeLeft < 60
  const progress = (current / questions.length) * 100
  const q = questions[current]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className={`${colors.bg} text-white px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className="text-xs opacity-80 font-medium uppercase tracking-wide">{config.subject}</p>
          <h1 className="text-lg font-bold">{config.title}</h1>
        </div>
        <div className={`px-4 py-1 rounded-xl text-center ${isUrgent ? "bg-red-500 animate-pulse" : "bg-white/20"}`}>
          <p className="text-xs opacity-80">Time</p>
          <p className="text-2xl font-mono font-bold">{mins}:{secs}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">Progress</p>
          <p className="text-lg font-bold">{current}/{questions.length}</p>
        </div>
      </div>

      <div className="h-1.5 bg-gray-200">
        <div
          className={`h-full ${colors.bg} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className={`w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center gap-6 border-4 transition-all duration-200 ${
          feedback === "correct" ? "border-green-400 bg-green-50" :
          feedback === "wrong" ? "border-red-400 bg-red-50" :
          colors.border
        }`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Question {current + 1}</p>
          <p className="text-4xl font-bold text-gray-800 text-center">{q?.question}</p>

          {feedback === "correct" && (
            <p className="text-2xl font-bold text-green-600">Correct!</p>
          )}
          {feedback === "wrong" && (
            <p className="text-lg font-bold text-red-500">Answer: {q?.answer}</p>
          )}
          {!feedback && (
            <>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Your answer"
                aria-label={`Answer for ${q?.question}`}
                className={`w-full text-center text-2xl font-bold border-2 ${colors.border} rounded-2xl py-3 focus:outline-none focus:ring-2 ${colors.text}`}
              />
              <button
                onClick={handleSubmit}
                className={`w-full ${colors.bg} text-white font-bold py-3 rounded-2xl text-lg shadow-md hover:opacity-90 active:scale-95 transition-all`}
              >
                Submit
              </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-1 mt-6 max-w-sm">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < current ? colors.bg :
                i === current ? `${colors.bg} ring-2 ring-offset-1 ${colors.border}` :
                "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({ config, questions, answers }: {
  config: DrillConfig
  questions: DrillQuestion[]
  answers: Record<number, string>
}) {
  const router = useRouter()
  const colors = COLOR_MAP[config.accentColor] ?? COLOR_MAP.indigo
  const answered = Object.keys(answers).length
  const correct = questions.filter(q =>
    String(q.answer).trim().toLowerCase() === String(answers[q.id] ?? "").trim().toLowerCase()
  ).length
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0

  const grade = accuracy >= 90 ? "A" : accuracy >= 80 ? "B" : accuracy >= 70 ? "C" : accuracy >= 60 ? "D" : "F"
  const gradeColor = accuracy >= 90 ? "text-green-600" : accuracy >= 70 ? "text-blue-600" : "text-orange-500"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className={`${colors.bg} text-white px-6 py-4`}>
        <p className="text-sm opacity-80">{config.subject}</p>
        <h1 className="text-2xl font-bold">{config.title} — Results</h1>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full p-6 flex flex-col gap-5">
        <div className="bg-white rounded-3xl shadow-md p-8 flex flex-col items-center gap-3">
          <div className={`w-28 h-28 rounded-full border-8 ${colors.border} flex items-center justify-center`}>
            <span className={`text-5xl font-black ${gradeColor}`}>{grade}</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{accuracy}% Accuracy</p>
          <p className="text-gray-500 text-sm">{config.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Correct", value: correct, color: "text-green-600" },
            { label: "Answered", value: answered, color: "text-blue-600" },
            { label: "Total", value: questions.length, color: "text-gray-700" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {config.mode === "grid" && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-700 mb-3">Review Answers</h3>
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {questions.map(q => {
                const userAns = answers[q.id] ?? ""
                const isCorrect = String(q.answer).trim().toLowerCase() === userAns.trim().toLowerCase()
                return (
                  <div key={q.id} className={`rounded-lg p-2 text-center text-xs ${isCorrect ? "bg-green-100" : userAns ? "bg-red-100" : "bg-gray-100"}`}>
                    <p className="font-medium text-gray-600 truncate">{q.question}</p>
                    <p className={`font-bold ${isCorrect ? "text-green-700" : "text-red-600"}`}>{userAns || "—"}</p>
                    {!isCorrect && userAns && <p className="text-gray-500 text-xs">{String(q.answer)}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <ArithmeticReview topic={config.title} questions={questions} answers={answers} />
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className={`${colors.bg} text-white font-bold py-3 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-95 transition-all`}
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/topic-select")}
            className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-base hover:bg-gray-50 active:scale-95 transition-all"
          >
            Choose Another Topic
          </button>
          <button
            onClick={() => router.push("/practice/summary")}
            className="text-gray-500 text-sm underline text-center"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main DrillPage Export ────────────────────────────────────────────────────

export default function DrillPage({ config }: { config: DrillConfig }) {
  const [questions] = useState<DrillQuestion[]>(() => config.generateQuestions())
  const [answers, setAnswers] = useState<Record<number, string> | null>(null)
  const [drillStartTime] = useState(() => Date.now())
  const completedRef = useRef(false)

  const handleComplete = useCallback((ans: Record<number, string>) => {
    if (completedRef.current) return
    completedRef.current = true
    const answered = Object.keys(ans).length
    const correct = questions.filter(q =>
      String(q.answer).trim().toLowerCase() === String(ans[q.id] ?? "").trim().toLowerCase()
    ).length
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0

    const result: DrillResult = {
      topic: config.title,
      subject: config.subject,
      correct,
      total: questions.length,
      answered,
      accuracy,
      completedAt: new Date().toISOString(),
    }

    saveDrillResult(result, drillStartTime)
    trackDrillCompleted(
      config.title,
      parseInt(localStorage.getItem("currentStudentGrade") ?? "1", 10),
      accuracy,
      correct,
      questions.length,
    )
    setAnswers(ans)
  }, [questions, config.title, config.subject, drillStartTime])

  if (answers !== null) {
    return <ResultsScreen config={config} questions={questions} answers={answers} />
  }

  if (config.mode === "grid") {
    return <GridDrill config={config} questions={questions} onComplete={handleComplete} />
  }

  return <SequentialDrill config={config} questions={questions} onComplete={handleComplete} />
}
