"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AVATARS } from "@/lib/mock-data"
import { AdaptiveEngine, type MasterySnapshot } from "@/lib/adaptive-engine"
import {
  getMasteryAction,
  getStudentAction,
  updateMasteryAction,
  updateStudentStatsAction,
} from "@/lib/actions"
import type { Grade, MathItem } from "@/lib/types"
import { ArithmeticReview } from "@/components/arithmetic-review"

interface PracticeStudent {
  id: string
  name: string
  grade: Grade
  avatar: string | null
  total_coins: number | null
  current_streak: number | null
}

interface MasteryRow {
  skill_id: string
  mastery_level: number
  attempts_count: number
  correct_count: number
  last_practiced_at?: string | null
}

export default function PracticePage() {
  const router = useRouter()
  const [student, setStudent] = useState<PracticeStudent | null>(null)
  const [items, setItems] = useState<MathItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime, setStartTime] = useState(Date.now())
  const [sessionCoins, setSessionCoins] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [reviewAnswers, setReviewAnswers] = useState<Record<number, string>>({})
  const reviewQuestions = useMemo(() => items.map((item, index) => ({ id: index, question: item.question, answer: item.answer })), [items])

  useEffect(() => {
    let cancelled = false

    async function loadPractice() {
      setLoadError("")
      const id = localStorage.getItem("currentStudentId")
      if (!id) {
        router.replace("/")
        return
      }

      const [studentData, masteryData] = await Promise.all([
        getStudentAction(id),
        getMasteryAction(id),
      ])
      if (cancelled) return

      if (!studentData) {
        setLoadError("We couldn't load this profile. Please check the connection and try again.")
        return
      }

      const resolvedStudent = studentData as PracticeStudent
      const snapshots: MasterySnapshot[] = ((masteryData as MasteryRow[]) ?? []).map((row) => ({
        skillId: row.skill_id,
        level: row.mastery_level,
        attempts: row.attempts_count,
        correctCount: row.correct_count,
        lastPracticed: row.last_practiced_at,
      }))
      const practiceItems = AdaptiveEngine.generatePracticeSession(
        resolvedStudent.grade,
        10,
        snapshots,
      )

      if (practiceItems.length === 0) {
        setLoadError("No questions are available for these topics yet. Choose another topic and try again.")
        return
      }

      setStudent(resolvedStudent)
      setItems(practiceItems)
    }

    void loadPractice()
    return () => {
      cancelled = true
    }
  }, [router, reloadToken])

  const currentItem = items[currentIndex]
  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0
  const avatar = AVATARS.find((a) => a.id === student?.avatar)

  const handleAnswer = (answer: string | number) => {
    if (!student || !currentItem) return

    setSelectedAnswer(answer)
    setReviewAnswers((previous) => ({ ...previous, [currentIndex]: String(answer) }))
    const correct = String(answer) === String(currentItem.answer)
    setIsCorrect(correct)
    setShowFeedback(true)

    // Calculate time spent
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    // Persist mastery without blocking the next question.
    void updateMasteryAction(student.id, currentItem.skillId, correct).catch(() => undefined)

    // Calculate coins earned
    const coinsEarned = AdaptiveEngine.calculateCoins(correct, hintsUsed, timeSpent)
    setSessionCoins((coins) => coins + coinsEarned)

    if (correct) {
      setSessionCorrect((count) => count + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
      setShowHint(false)
      setHintsUsed(0)
      setStartTime(Date.now())
    } else {
      // Session complete
      setShowCelebration(true)
    }
  }

  const handleFinish = async () => {
    if (!student) return
    setFinishing(true)
    setSaveError("")
    try {
      await updateStudentStatsAction(student.id, sessionCoins)
      router.push("/practice/summary")
    } catch {
      setSaveError("We couldn't save this session yet. Please try again.")
      setFinishing(false)
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md space-y-4 rounded-3xl p-8 text-center shadow-xl">
          <div className="text-5xl">🔌</div>
          <h1 className="text-2xl font-bold text-slate-800">Practice unavailable</h1>
          <p role="alert" className="text-slate-600">{loadError}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => setReloadToken((value) => value + 1)}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push("/topic-select")}>Choose Topics</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!currentItem || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <p className="text-xl text-slate-600">Loading practice session...</p>
        </div>
      </div>
    )
  }

  // Celebration screen
  if (showCelebration) {
    const accuracy = Math.round((sessionCorrect / items.length) * 100)
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 bg-white/90 backdrop-blur shadow-2xl rounded-3xl text-center space-y-6 animate-bounce-in">
          <div className="text-8xl animate-bounce">🎉</div>
          <h2 className="text-4xl font-bold text-slate-800">Amazing Work!</h2>
          <p className="text-xl text-slate-600">You completed today's practice session!</p>

          <div className="grid grid-cols-3 gap-4 py-6">
            <div className="space-y-2">
              <div className="text-4xl">✅</div>
              <div className="text-3xl font-bold text-indigo-600">{sessionCorrect}</div>
              <div className="text-sm text-slate-600">Correct</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">🎯</div>
              <div className="text-3xl font-bold text-indigo-600">{accuracy}%</div>
              <div className="text-sm text-slate-600">Accuracy</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">🪙</div>
              <div className="text-3xl font-bold text-pink-600">{sessionCoins}</div>
              <div className="text-sm text-slate-600">Coins Earned</div>
            </div>
          </div>

          <div className="text-left"><ArithmeticReview topic="Adaptive math practice" questions={reviewQuestions} answers={reviewAnswers} /></div>
          <Button
            onClick={handleFinish}
            disabled={finishing}
            className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            size="lg"
          >
            {finishing ? "Saving…" : "Continue"}
          </Button>
          {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto pt-4 space-y-4">
        {/* Header with student info */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{avatar?.emoji}</div>
            <div>
              <p className="font-bold text-slate-800">{student.name}</p>
              <p className="text-sm text-slate-600">Grade {student.grade}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-pink-100 px-4 py-2 rounded-xl">
              <span className="text-2xl">🪙</span>
              <span className="font-bold text-pink-600">{(student.total_coins ?? 0) + sessionCoins}</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-xl">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-orange-600">{student.current_streak ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>
              Question {currentIndex + 1} of {items.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Question Card */}
        <Card className="p-8 bg-white/90 backdrop-blur shadow-xl rounded-3xl">
          <div className="space-y-6">
            {/* Question */}
            <div className="text-center space-y-4">
              <p className="text-4xl font-bold text-slate-800">{currentItem.question}</p>
              {currentItem.imageUrl && (
                <img
                  src={currentItem.imageUrl || "/placeholder.svg"}
                  alt="Question illustration"
                  className="mx-auto max-w-md rounded-xl"
                />
              )}
            </div>

            {/* Hint button */}
            {!showFeedback && currentItem.hint && (
              <div className="text-center">
                {!showHint ? (
                  <Button
                    onClick={() => {
                      setShowHint(true)
                      setHintsUsed(hintsUsed + 1)
                    }}
                    variant="outline"
                    className="border-2 border-amber-400 text-amber-600 hover:bg-amber-50"
                  >
                    💡 Need a hint?
                  </Button>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 animate-bounce-in">
                    <p className="text-amber-800">
                      <span className="font-bold">Hint:</span> {currentItem.hint}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Answer Choices */}
            {!showFeedback && currentItem.choices && (
              <div className="grid grid-cols-2 gap-4">
                {currentItem.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(choice)}
                    className="p-8 text-3xl font-bold rounded-2xl border-3 border-slate-200 bg-white hover:border-indigo-400 hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {/* Feedback */}
            {showFeedback && (
              <div
                className={`p-6 rounded-2xl animate-bounce-in ${
                  isCorrect ? "bg-green-100 border-3 border-green-400" : "bg-red-100 border-3 border-red-400"
                }`}
              >
                <div className="text-center space-y-4">
                  <div className="text-6xl">{isCorrect ? "🎉" : "💭"}</div>
                  <p className="text-2xl font-bold text-slate-800">{isCorrect ? "Excellent!" : "Keep trying!"}</p>
                  {!isCorrect && (
                    <p className="text-lg text-slate-700">
                      The correct answer is <span className="font-bold text-2xl">{currentItem.answer}</span>
                    </p>
                  )}

                  {currentItem.vedicTrick && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl p-5 text-left mt-4 shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">✨</span>
                        <h4 className="font-bold text-lg text-amber-800">
                          Vedic Math Trick: {currentItem.vedicTrick.name}
                        </h4>
                      </div>
                      <ol className="space-y-2">
                        {currentItem.vedicTrick.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400 text-white text-sm font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-slate-700">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Fallback to regular explanation if no Vedic trick */}
                  {!currentItem.vedicTrick && currentItem.explanation && (
                    <div className="bg-white/50 rounded-xl p-4">
                      <p className="text-slate-700">{currentItem.explanation}</p>
                    </div>
                  )}

                  {isCorrect && (
                    <div className="flex items-center justify-center gap-2 text-pink-600 font-bold text-xl">
                      <span className="text-3xl">🪙</span>
                      <span>
                        +
                        {AdaptiveEngine.calculateCoins(
                          isCorrect,
                          hintsUsed,
                          Math.floor((Date.now() - startTime) / 1000),
                        )}{" "}
                        coins!
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={handleNext}
                    className="mt-4 px-8 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    size="lg"
                  >
                    {currentIndex < items.length - 1 ? "Next Question →" : "Finish Session 🎉"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
