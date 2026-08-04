"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getSkillsForTopics, getItemsForSkill, MATH_ITEMS } from "@/lib/mock-data"
import { getStudentAction, updateMasteryAction, getMasteryAction } from "@/lib/actions"
import type { MathItem, Grade } from "@/lib/types"

export default function DiagnosticPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [studentGrade, setStudentGrade] = useState<number>(1)
  const [items, setItems] = useState<MathItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())

  useEffect(() => {
    async function init() {
      const id = localStorage.getItem("currentStudentId")
      if (!id) {
        router.push("/onboarding")
        return
      }
      setStudentId(id)

      const student = await getStudentAction(id)
      if (!student) {
        router.push("/onboarding")
        return
      }

      const grade = student.grade as Grade
      setStudentGrade(grade)

      const selectedTopicsStr = localStorage.getItem("selectedTopics")
      const selectedTopics = selectedTopicsStr ? JSON.parse(selectedTopicsStr) : []

      const skills = getSkillsForTopics(grade, selectedTopics)
      const diagnosticItems: MathItem[] = []

      const skillsWithItems = skills.filter((skill) => {
        const skillItems = getItemsForSkill(skill.id)
        return skillItems.length > 0
      })

      skillsWithItems.slice(0, 4).forEach((skill) => {
        const skillItems = getItemsForSkill(skill.id)
        const easyItem = skillItems.find((i) => i.difficulty === 1)
        const mediumItem = skillItems.find((i) => i.difficulty === 2)
        if (easyItem) diagnosticItems.push(easyItem)
        if (mediumItem) diagnosticItems.push(mediumItem)
      })

      if (diagnosticItems.length === 0) {
        const gradeItems = MATH_ITEMS.filter((item) => {
          const skill = skills.find((s) => s.id === item.skillId)
          return skill !== undefined
        })
        diagnosticItems.push(...gradeItems.slice(0, 8))
      }

      if (diagnosticItems.length === 0) {
        diagnosticItems.push(...MATH_ITEMS.slice(0, 8))
      }

      setItems(diagnosticItems)
    }
    init()
  }, [router])

  const currentItem = items[currentIndex]
  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0

  const handleAnswer = async (answer: string | number) => {
    setSelectedAnswer(answer)
    const correct = String(answer) === String(currentItem.answer)
    setIsCorrect(correct)
    setShowFeedback(true)

    if (studentId) {
      try {
        const mastery = await getMasteryAction(studentId)
        const existing = mastery.find(
          (m: Record<string, unknown>) => m.skill_id === currentItem.skillId,
        )
        await updateMasteryAction(
          studentId,
          currentItem.skillId,
          correct,
          existing?.attempts_count ?? 0,
          existing?.correct_count ?? 0,
        )
      } catch {
        // DB not available — gracefully degrade
      }
    }
  }

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
      setStartTime(Date.now())
    } else {
      if (studentGrade === 1) {
        router.push("/grade1-mode-select")
      } else if (studentGrade === 4) {
        router.push("/grade4-mode-select")
      } else {
        router.push("/practice")
      }
    }
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <p className="text-xl text-slate-600">Loading diagnostic...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto pt-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Quick Assessment</h1>
          <p className="text-slate-600">Help us understand your current level</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>
              Question {currentIndex + 1} of {items.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 bg-white/90 backdrop-blur shadow-xl rounded-3xl">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-800 mb-4">{currentItem.question}</p>
            </div>

            {!showFeedback && currentItem.choices && (
              <div className="grid grid-cols-2 gap-4">
                {currentItem.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(choice)}
                    className="p-6 text-2xl font-bold rounded-2xl border-3 border-slate-200 bg-white hover:border-indigo-400 hover:shadow-lg transition-all hover:scale-105"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {showFeedback && (
              <div
                className={`p-6 rounded-2xl animate-bounce-in ${
                  isCorrect ? "bg-green-100 border-2 border-green-400" : "bg-red-100 border-2 border-red-400"
                }`}
              >
                <div className="text-center space-y-3">
                  <div className="text-5xl">{isCorrect ? "🎉" : "💭"}</div>
                  <p className="text-xl font-bold text-slate-800">{isCorrect ? "Great job!" : "Not quite!"}</p>
                  {!isCorrect && (
                    <p className="text-slate-700">
                      The answer is <span className="font-bold">{currentItem.answer}</span>
                    </p>
                  )}
                  {currentItem.explanation && <p className="text-sm text-slate-600 mt-2">{currentItem.explanation}</p>}
                  <Button
                    onClick={handleNext}
                    className="mt-4 px-8 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                    size="lg"
                  >
                    {currentIndex < items.length - 1 ? "Next Question" : "Start Practicing!"}
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
