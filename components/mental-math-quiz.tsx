"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  MAX_LEVEL,
  applyLevel,
  clearFactStats,
  defaultSettingsForGrade,
  generateQuiz,
  getWeakFacts,
  loadFactStats,
  loadLevel,
  loadSettings,
  nextLevel,
  parseFactKey,
  recordResults,
  saveLevel,
  saveSettings,
  type FactStats,
  type QuizKind,
  type QuizQuestion,
  type QuizSettings,
} from "@/lib/adaptive-quiz"
import { saveDrillResult, type DrillResult } from "@/lib/drill-results"
import { trackDrillCompleted } from "@/lib/analytics"

export interface QuizPageConfig {
  kind: QuizKind
  title: string
  subject: string
  description: string
  /** Key into COLORS below. */
  accentColor: "green" | "purple" | "orange" | "blue" | "pink"
  icon: string
}

const COLORS = {
  green:  { bg: "bg-green-600",  ring: "ring-green-300",  border: "border-green-300",  text: "text-green-600",  soft: "bg-green-50"  },
  purple: { bg: "bg-purple-600", ring: "ring-purple-300", border: "border-purple-300", text: "text-purple-600", soft: "bg-purple-50" },
  orange: { bg: "bg-orange-500", ring: "ring-orange-300", border: "border-orange-300", text: "text-orange-500", soft: "bg-orange-50" },
  blue:   { bg: "bg-blue-600",   ring: "ring-blue-300",   border: "border-blue-300",   text: "text-blue-600",   soft: "bg-blue-50"   },
  pink:   { bg: "bg-pink-600",   ring: "ring-pink-300",   border: "border-pink-300",   text: "text-pink-600",   soft: "bg-pink-50"   },
}

const TABLE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const TABLE_PRESETS = [
  { label: "Easy (2, 5, 10)", tables: [2, 5, 10] },
  { label: "Middle (3, 4, 6)", tables: [3, 4, 6] },
  { label: "Tricky (7, 8, 9)", tables: [7, 8, 9] },
  { label: "Mix (2–9)", tables: [2, 3, 4, 5, 6, 7, 8, 9] },
  { label: "All (1–12)", tables: TABLE_OPTIONS },
]
const COUNT_OPTIONS = [10, 20, 30, 50]
const TIME_OPTIONS = [
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
]

function factLabel(factKey: string): string {
  const parsed = parseFactKey(factKey)
  return parsed ? `${parsed.a} ${parsed.op} ${parsed.b}` : factKey
}

export default function MentalMathQuiz({ config }: { config: QuizPageConfig }) {
  const router = useRouter()
  const c = COLORS[config.accentColor]

  const [studentId, setStudentId] = useState<string | null>(null)
  const [studentName, setStudentName] = useState<string>("")
  const [grade, setGrade] = useState(2)
  const [level, setLevel] = useState(1)
  const [settings, setSettings] = useState<QuizSettings>(() => defaultSettingsForGrade(config.kind, 2))
  const [stats, setStats] = useState<FactStats>({})
  const [phase, setPhase] = useState<"settings" | "running" | "results">("settings")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [given, setGiven] = useState<Record<number, string>>({})

  // Load this student's saved settings and fact history on mount.
  useEffect(() => {
    const id = localStorage.getItem("currentStudentId") || "guest"
    const g = parseInt(localStorage.getItem("currentStudentGrade") ?? "2", 10) || 2
    setStudentId(id)
    setGrade(g)
    setStudentName(localStorage.getItem("currentStudentName") || "")
    setSettings(loadSettings(id, config.kind, g))
    setStats(loadFactStats(id, config.kind))
    setLevel(loadLevel(id, config.kind))
  }, [config.kind])

  const weakFacts = useMemo(
    () => getWeakFacts(stats, config.kind, settings),
    [stats, config.kind, settings],
  )

  const update = useCallback(<K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  /** The student's chosen settings, narrowed to their current level. */
  const effectiveSettings = useMemo(
    () => applyLevel(config.kind, settings, level),
    [config.kind, settings, level],
  )

  function startQuiz() {
    if (!studentId) return
    saveSettings(studentId, config.kind, settings)
    setQuestions(generateQuiz(config.kind, effectiveSettings, stats))
    setGiven({})
    setPhase("running")
  }

  const finish = useCallback((answers: Record<number, string>) => {
    setGiven(answers)
    setPhase("results")
  }, [])

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-slate-600">Loading…</p>
      </div>
    )
  }

  if (phase === "running") {
    return (
      <QuizRunner
        config={config}
        questions={questions}
        settings={effectiveSettings}
        onFinish={finish}
        onQuit={() => setPhase("settings")}
      />
    )
  }

  if (phase === "results") {
    return (
      <QuizResults
        config={config}
        questions={questions}
        given={given}
        studentId={studentId}
        level={level}
        onLevelChange={setLevel}
        onAgain={() => {
          const fresh = loadFactStats(studentId, config.kind)
          const nextLvl = loadLevel(studentId, config.kind)
          setStats(fresh)
          setLevel(nextLvl)
          setQuestions(generateQuiz(config.kind, applyLevel(config.kind, settings, nextLvl), fresh))
          setGiven({})
          setPhase("running")
        }}
        onSettings={() => {
          setStats(loadFactStats(studentId, config.kind))
          setLevel(loadLevel(studentId, config.kind))
          setPhase("settings")
        }}
      />
    )
  }

  // ─── Settings screen ────────────────────────────────────────────────────────

  const isFactQuiz = config.kind !== "mental-math"
  const levelBlurb = !settings.autoLevel
    ? "Full range"
    : isFactQuiz
      ? `${effectiveSettings.tables.join(", ")} × up to ${effectiveSettings.maxFactor}`
      : `up to ${effectiveSettings.maxTerm}`
  const tablesLabel = config.kind === "division" ? "Divide by" : "Times tables"
  const factorLabel = config.kind === "division" ? "Largest answer" : "Second number up to"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${c.bg} text-white px-4 py-4`}>
        <p className="text-xs opacity-80 font-medium uppercase tracking-wide">Grade {grade} • {config.subject}</p>
        <h1 className="text-2xl font-bold">
          {config.icon} {config.title}
        </h1>
        <p className="text-sm opacity-90 mt-1">
          {studentName ? `${studentName} — ` : ""}{config.description}
        </p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-10">
        {/* Difficulty ladder */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-800">Level {level} of {MAX_LEVEL}</h2>
            <span className="text-sm text-gray-500">{levelBlurb}</span>
          </div>

          <div className="flex gap-1.5 mb-3" role="img" aria-label={`Level ${level} of ${MAX_LEVEL}`}>
            {Array.from({ length: MAX_LEVEL }, (_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-full ${i < level ? c.bg : "bg-gray-200"}`}
              />
            ))}
          </div>

          <p className="text-sm text-gray-500 mb-3">
            Quizzes start easy and step up after a strong run (85%+), and step back down below 60%.
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoLevel}
              onChange={(e) => update("autoLevel", e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-gray-700 font-medium">Start easy and build up</span>
          </label>
          {!settings.autoLevel && (
            <p className="text-sm text-gray-400 mt-2">
              Off — every quiz uses the full range you set below.
            </p>
          )}
        </section>

        {/* Adaptive review */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-1">Tricky facts</h2>
          <p className="text-sm text-gray-500 mb-3">
            {weakFacts.length === 0
              ? "No missed facts yet — they'll show up here after a quiz."
              : `${weakFacts.length} fact${weakFacts.length === 1 ? "" : "s"} missed before. Turn this on and they'll come up more often.`}
          </p>

          {weakFacts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {weakFacts.slice(0, 12).map((f) => (
                <span key={f} className={`${c.soft} ${c.text} text-sm font-bold px-3 py-1 rounded-lg`}>
                  {factLabel(f)}
                </span>
              ))}
              {weakFacts.length > 12 && (
                <span className="text-sm text-gray-400 px-2 py-1">+{weakFacts.length - 12} more</span>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.focusOnMissed}
              onChange={(e) => update("focusOnMissed", e.target.checked)}
              className="w-5 h-5 accent-current"
            />
            <span className="text-gray-700 font-medium">Practice missed facts more often</span>
          </label>

          {weakFacts.length > 0 && (
            <button
              onClick={() => {
                clearFactStats(studentId, config.kind)
                setStats({})
              }}
              className="mt-3 text-sm text-gray-400 underline"
            >
              Reset tricky-fact history
            </button>
          )}
        </section>

        {/* Number ranges */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <h2 className="font-bold text-gray-800">Numbers</h2>

          {!isFactQuiz && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Operations</p>
                <div className="flex gap-2">
                  {([["+", "Adding"], ["-", "Subtracting"]] as const).map(([op, label]) => {
                    const on = settings.operations.includes(op)
                    return (
                      <button
                        key={op}
                        onClick={() => {
                          const next = on
                            ? settings.operations.filter((o) => o !== op)
                            : [...settings.operations, op]
                          // Never let the student start with no operation selected.
                          update("operations", next.length > 0 ? next : settings.operations)
                        }}
                        className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                          on ? `${c.bg} text-white border-transparent` : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {op} {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-600">Smallest number</span>
                  <input
                    type="number"
                    min={0}
                    max={settings.maxTerm}
                    value={settings.minTerm}
                    onChange={(e) => update("minTerm", Math.max(0, Number(e.target.value)))}
                    className={`mt-1 w-full text-center text-xl font-bold border-2 ${c.border} rounded-xl py-2`}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-600">Largest number</span>
                  <input
                    type="number"
                    min={settings.minTerm}
                    max={1000}
                    value={settings.maxTerm}
                    onChange={(e) => update("maxTerm", Math.min(1000, Number(e.target.value)))}
                    className={`mt-1 w-full text-center text-xl font-bold border-2 ${c.border} rounded-xl py-2`}
                  />
                </label>
              </div>
              {settings.minTerm > settings.maxTerm && (
                <p className="text-sm text-red-500 font-medium">
                  Smallest number must be less than or equal to the largest.
                </p>
              )}
            </>
          )}

          {isFactQuiz && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{tablesLabel}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TABLE_PRESETS.map((preset) => {
                    const active =
                      preset.tables.length === settings.tables.length &&
                      preset.tables.every((t) => settings.tables.includes(t))
                    return (
                      <button
                        key={preset.label}
                        onClick={() => update("tables", preset.tables)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${
                          active ? `${c.bg} text-white border-transparent` : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {TABLE_OPTIONS.map((t) => {
                    const on = settings.tables.includes(t)
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          const next = on
                            ? settings.tables.filter((x) => x !== t)
                            : [...settings.tables, t].sort((a, b) => a - b)
                          // At least one table must stay selected.
                          update("tables", next.length > 0 ? next : settings.tables)
                        }}
                        aria-pressed={on}
                        className={`py-3 rounded-xl font-bold border-2 transition-all ${
                          on ? `${c.bg} text-white border-transparent` : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-600">{factorLabel}</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.maxFactor}
                  onChange={(e) =>
                    update("maxFactor", Math.min(20, Math.max(1, Number(e.target.value))))
                  }
                  className={`mt-1 w-full text-center text-xl font-bold border-2 ${c.border} rounded-xl py-2`}
                />
              </label>
            </>
          )}
        </section>

        {/* Length + timer */}
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <h2 className="font-bold text-gray-800">Quiz length</h2>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Questions</p>
            <div className="grid grid-cols-4 gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => update("questionCount", n)}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${
                    settings.questionCount === n
                      ? `${c.bg} text-white border-transparent`
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.timed}
              onChange={(e) => update("timed", e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-gray-700 font-medium">Use a timer</span>
          </label>

          {settings.timed && (
            <div className="grid grid-cols-3 gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => update("totalSeconds", t.value)}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${
                    settings.totalSeconds === t.value
                      ? `${c.bg} text-white border-transparent`
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </section>

        <button
          onClick={startQuiz}
          disabled={!isFactQuiz && settings.minTerm > settings.maxTerm}
          className={`w-full ${c.bg} text-white font-bold py-4 rounded-2xl text-xl shadow-lg
            hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100`}
        >
          Start Quiz 🚀
        </button>

        <button
          onClick={() => router.push("/topic-select")}
          className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-2xl"
        >
          Back to Topics
        </button>
      </div>
    </div>
  )
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function QuizRunner({ config, questions, settings, onFinish, onQuit }: {
  config: QuizPageConfig
  questions: QuizQuestion[]
  settings: QuizSettings
  onFinish: (answers: Record<number, string>) => void
  onQuit: () => void
}) {
  const c = COLORS[config.accentColor]
  const [current, setCurrent] = useState(0)
  const [input, setInput] = useState("")
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [timeLeft, setTimeLeft] = useState(settings.totalSeconds)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep the timer's view of progress current without restarting the interval.
  const answersRef = useRef(answers)
  answersRef.current = answers
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish

  useEffect(() => {
    if (!settings.timed) return
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t)
          finishRef.current(answersRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [settings.timed])

  useEffect(() => {
    inputRef.current?.focus()
  }, [current])

  const q = questions[current]

  function submit() {
    if (!input.trim() || feedback !== null || !q) return
    const isCorrect = Number(input) === q.answer
    const next = { ...answers, [q.id]: input.trim() }
    setAnswers(next)
    setFeedback(isCorrect ? "correct" : "wrong")

    setTimeout(() => {
      setFeedback(null)
      setInput("")
      if (current + 1 >= questions.length) onFinish(next)
      else setCurrent((p) => p + 1)
    }, isCorrect ? 500 : 1400)
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0")
  const secs = String(timeLeft % 60).padStart(2, "0")
  const isUrgent = settings.timed && timeLeft < 60

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className={`${c.bg} text-white px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className="text-xs opacity-80 uppercase tracking-wide">{config.subject}</p>
          <h1 className="text-lg font-bold">{config.title}</h1>
        </div>
        {settings.timed && (
          <div className={`px-4 py-1 rounded-xl text-center ${isUrgent ? "bg-red-500 animate-pulse" : "bg-white/20"}`}>
            <p className="text-xs opacity-80">Time</p>
            <p className="text-2xl font-mono font-bold">{mins}:{secs}</p>
          </div>
        )}
        <div className="text-right">
          <p className="text-xs opacity-80">Progress</p>
          <p className="text-lg font-bold">{current}/{questions.length}</p>
        </div>
      </div>

      <div className="h-1.5 bg-gray-200">
        <div
          className={`h-full ${c.bg} transition-all duration-300`}
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div
          className={`w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center gap-6 border-4 transition-all ${
            feedback === "correct" ? "border-green-400 bg-green-50"
            : feedback === "wrong" ? "border-red-400 bg-red-50"
            : c.border
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Question {current + 1} of {questions.length}
          </p>
          <p className="text-5xl font-bold text-gray-800 text-center">{q?.question}</p>

          {feedback === "correct" && <p className="text-2xl font-bold text-green-600">Correct! 🎉</p>}
          {feedback === "wrong" && (
            <div className="text-center">
              <p className="text-lg font-bold text-red-500">Not quite</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {q?.question} = {q?.answer}
              </p>
            </div>
          )}

          {feedback === null && (
            <>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit() }}
                placeholder="Your answer"
                aria-label={`Answer for ${q?.question}`}
                className={`w-full text-center text-3xl font-bold border-2 ${c.border} rounded-2xl py-3 focus:outline-none focus:ring-2 ${c.ring}`}
              />
              <button
                onClick={submit}
                className={`w-full ${c.bg} text-white font-bold py-3 rounded-2xl text-lg shadow-md hover:opacity-90 active:scale-95 transition-all`}
              >
                Submit
              </button>
            </>
          )}
        </div>

        <button onClick={onQuit} className="mt-6 text-sm text-gray-400 underline">
          End quiz and change settings
        </button>
      </div>
    </div>
  )
}

// ─── Results ──────────────────────────────────────────────────────────────────

function QuizResults({ config, questions, given, studentId, level, onLevelChange, onAgain, onSettings }: {
  config: QuizPageConfig
  questions: QuizQuestion[]
  given: Record<number, string>
  studentId: string
  level: number
  onLevelChange: (level: number) => void
  onAgain: () => void
  onSettings: () => void
}) {
  const router = useRouter()
  const c = COLORS[config.accentColor]
  const savedRef = useRef(false)
  const [levelMove, setLevelMove] = useState<{ from: number; to: number } | null>(null)

  const answered = questions.filter((q) => given[q.id] !== undefined && given[q.id] !== "")
  const correctQs = answered.filter((q) => Number(given[q.id]) === q.answer)
  const missedQs = answered.filter((q) => Number(given[q.id]) !== q.answer)
  const accuracy = answered.length > 0 ? Math.round((correctQs.length / answered.length) * 100) : 0

  // Fold this run into the student's fact history and session records — once.
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    recordResults(
      studentId,
      config.kind,
      answered.map((q) => ({ factKey: q.factKey, correct: Number(given[q.id]) === q.answer })),
    )

    const result: DrillResult = {
      topic: config.title,
      subject: config.subject,
      correct: correctQs.length,
      total: questions.length,
      answered: answered.length,
      accuracy,
      completedAt: new Date().toISOString(),
    }
    saveDrillResult(result, Date.now())

    // Move the student up or down the ladder based on this run.
    const updated = nextLevel(level, accuracy, answered.length)
    if (updated !== level) {
      saveLevel(studentId, config.kind, updated)
      onLevelChange(updated)
    }
    setLevelMove(updated !== level ? { from: level, to: updated } : null)

    trackDrillCompleted(
      config.title,
      parseInt(localStorage.getItem("currentStudentGrade") ?? "2", 10),
      accuracy,
      correctQs.length,
      questions.length,
    )
  }, [studentId, config.kind, config.title, config.subject, questions, given, answered, correctQs.length, accuracy, level, onLevelChange])

  const grade = accuracy >= 90 ? "A" : accuracy >= 80 ? "B" : accuracy >= 70 ? "C" : accuracy >= 60 ? "D" : "F"
  const gradeColor = accuracy >= 90 ? "text-green-600" : accuracy >= 70 ? "text-blue-600" : "text-orange-500"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${c.bg} text-white px-6 py-4`}>
        <p className="text-sm opacity-80">{config.subject}</p>
        <h1 className="text-2xl font-bold">{config.title} — Results</h1>
      </div>

      <div className="max-w-lg mx-auto w-full p-6 flex flex-col gap-5 pb-10">
        <div className="bg-white rounded-3xl shadow-md p-8 flex flex-col items-center gap-3">
          <div className={`w-28 h-28 rounded-full border-8 ${c.border} flex items-center justify-center`}>
            <span className={`text-5xl font-black ${gradeColor}`}>{grade}</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{accuracy}% Accuracy</p>
          <p className="text-gray-500 text-sm text-center">
            {correctQs.length} of {answered.length} answered correctly
          </p>
        </div>

        {levelMove && levelMove.to > levelMove.from && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center">
            <p className="text-lg font-bold text-green-700">⬆️ Level up — now Level {levelMove.to}!</p>
            <p className="text-sm text-green-600">Bigger numbers next time.</p>
          </div>
        )}
        {levelMove && levelMove.to < levelMove.from && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-lg font-bold text-blue-700">Back to Level {levelMove.to} for a bit</p>
            <p className="text-sm text-blue-600">Let&apos;s lock these in before moving up again.</p>
          </div>
        )}

        {missedQs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-1">Practice these next time</h3>
            <p className="text-sm text-gray-500 mb-3">
              These are saved — they&apos;ll come up more often in your next quiz.
            </p>
            <div className="flex flex-wrap gap-2">
              {missedQs.map((q) => (
                <span key={q.id} className="bg-red-50 text-red-600 text-sm font-bold px-3 py-1.5 rounded-lg">
                  {q.question} = {q.answer}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3">All questions</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {questions.map((q) => {
              const ans = given[q.id]
              const wasAnswered = ans !== undefined && ans !== ""
              const isCorrect = wasAnswered && Number(ans) === q.answer
              return (
                <div
                  key={q.id}
                  className={`rounded-lg p-2 text-center text-xs ${
                    isCorrect ? "bg-green-100" : wasAnswered ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  <p className="font-medium text-gray-600">{q.question}</p>
                  <p className={`font-bold ${isCorrect ? "text-green-700" : "text-red-600"}`}>
                    {wasAnswered ? ans : "—"}
                  </p>
                  {!isCorrect && <p className="text-gray-500">{q.answer}</p>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onAgain}
            className={`${c.bg} text-white font-bold py-3 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-95 transition-all`}
          >
            Try Again
          </button>
          <button
            onClick={onSettings}
            className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-base hover:bg-gray-50"
          >
            Change Numbers
          </button>
          <button onClick={() => router.push("/topic-select")} className="text-gray-500 text-sm underline text-center">
            Choose Another Topic
          </button>
        </div>
      </div>
    </div>
  )
}
