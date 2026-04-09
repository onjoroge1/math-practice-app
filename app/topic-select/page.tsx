"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getStudentAction } from "@/lib/actions"
import { trackTopicsSelected, trackPracticeStarted } from "@/lib/analytics"
import type { Grade, SkillCategory } from "@/lib/types"
import { CheckCircle2, Circle, Clock, Sparkles } from "lucide-react"

interface Topic {
  id: string
  name: string
  description: string
  icon: string
  category: SkillCategory
}

const TOPICS_BY_GRADE: Record<Grade, Topic[]> = {
  1: [
    { id: "addition-subtraction", name: "Addition & Subtraction", description: "Add and subtract within 20", icon: "➕", category: "operations-algebraic" },
    { id: "number-sense", name: "Number Sense & Place Value", description: "Count to 120, understand tens and ones", icon: "🔢", category: "place-value" },
    { id: "measurement", name: "Measurement", description: "Length, weight, and capacity", icon: "📏", category: "measurement" },
    { id: "time", name: "Time", description: "Tell time to hour and half hour", icon: "🕐", category: "time" },
    { id: "money", name: "Money", description: "Identify coins and their values", icon: "💰", category: "money" },
    { id: "geometry", name: "Geometry", description: "2D and 3D shapes", icon: "🔷", category: "geometry" },
    { id: "numerical-reasoning", name: "Numerical Reasoning", description: "Numbers, operations, place value, and comparisons", icon: "🧮", category: "operations-algebraic" },
    { id: "patterning-algebraic", name: "Patterning & Algebraic Reasoning", description: "Number patterns, skip counting, and sequences", icon: "🔄", category: "operations-algebraic" },
    { id: "measurement-data", name: "Measurement & Data Reasoning", description: "Time, money, length, weight, and graphs", icon: "📊", category: "measurement" },
    { id: "geometric-spatial", name: "Geometric & Spatial Reasoning", description: "Shapes, sides, corners, and spatial relationships", icon: "🔶", category: "geometry" },
    { id: "word-problems", name: "Word Problems", description: "Story problems with addition, subtraction, and mixed operations", icon: "📖", category: "operations-algebraic" },
  ],
  2: [
    { id: "add-sub-100", name: "Addition & Subtraction to 100", description: "Add and subtract within 100 with strategies", icon: "➕", category: "addition" },
    { id: "place-value-1000", name: "Place Value to 1000", description: "Understand hundreds, tens, and ones", icon: "🔢", category: "place-value" },
    { id: "skip-counting", name: "Skip Counting & Multiplication Intro", description: "Count by 2s, 5s, and 10s", icon: "🔄", category: "multiplication" },
    { id: "measurement", name: "Measurement", description: "Measure using standard units", icon: "📏", category: "measurement" },
    { id: "time", name: "Time to 5 Minutes", description: "Tell time to the nearest 5 minutes", icon: "🕐", category: "time" },
    { id: "money", name: "Money & Making Change", description: "Count money and make change", icon: "💵", category: "money" },
  ],
  3: [
    { id: "multiplication", name: "Multiplication", description: "Master multiplication facts and strategies", icon: "✖️", category: "multiplication" },
    { id: "division", name: "Division", description: "Understand division and fact families", icon: "➗", category: "division" },
    { id: "fractions", name: "Fractions", description: "Understand unit fractions and equivalence", icon: "🍕", category: "fractions" },
    { id: "place-value", name: "Place Value & Rounding", description: "Work with numbers to 1000 and rounding", icon: "🔢", category: "place-value" },
    { id: "measurement", name: "Measurement & Data", description: "Solve problems with measurement", icon: "📊", category: "measurement" },
    { id: "geometry", name: "Geometry & Perimeter", description: "Explore shapes and perimeter", icon: "🔷", category: "geometry" },
  ],
  4: [
    { id: "multiplication", name: "Multiplication", description: "Master multiplication facts and multi-digit multiplication", icon: "✖️", category: "multiplication" },
    { id: "division", name: "Division", description: "Master division facts and multi-digit division", icon: "➗", category: "division" },
    { id: "multi-digit", name: "Multi-Digit Operations", description: "Advanced operations with large numbers", icon: "🔢", category: "multiplication" },
    { id: "fractions-decimals", name: "Fractions & Decimals", description: "Compare fractions, add/subtract, understand decimals", icon: "🍰", category: "fractions" },
    { id: "place-value", name: "Place Value to Millions", description: "Understand large numbers and rounding", icon: "💯", category: "place-value" },
    { id: "measurement", name: "Measurement & Conversion", description: "Convert units and solve measurement problems", icon: "📐", category: "measurement" },
    { id: "geometry", name: "Geometry & Angles", description: "Classify shapes, measure angles", icon: "📐", category: "geometry" },
    { id: "grade4-numerical-reasoning", name: "Numerical Reasoning", description: "Multi-digit operations, fractions, and number sense", icon: "🧮", category: "operations-algebraic" },
    { id: "grade4-patterning", name: "Patterning & Algebraic Reasoning", description: "Number rules, expressions, and solving equations", icon: "🔄", category: "operations-algebraic" },
    { id: "grade4-measurement-data", name: "Measurement & Data Reasoning", description: "Units, conversions, perimeter, area, and data", icon: "📊", category: "measurement" },
    { id: "grade4-geometric-spatial", name: "Geometric & Spatial Reasoning", description: "Properties of shapes, angles, and symmetry", icon: "🔶", category: "geometry" },
  ],
}

export default function TopicSelectPage() {
  const router = useRouter()
  const [grade, setGrade] = useState<Grade | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [practiceMode, setPracticeMode] = useState<"adaptive" | "speed-drill">("adaptive")

  useEffect(() => {
    async function loadStudent() {
      const studentId = localStorage.getItem("currentStudentId")
      if (!studentId) {
        router.push("/")
        return
      }
      const student = await getStudentAction(studentId)
      if (student) {
        setGrade(student.grade as Grade)
        localStorage.setItem("currentStudentGrade", String(student.grade))
      } else {
        router.push("/onboarding")
      }
    }
    loadStudent()
  }, [router])

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]))
  }

  const handleContinue = () => {
    localStorage.setItem("selectedTopics", JSON.stringify(selectedTopics))
    if (grade) {
      trackTopicsSelected(selectedTopics, grade)
      trackPracticeStarted(grade, practiceMode)
    }

    if (practiceMode === "speed-drill") {
      if (grade === 1) {
        if (selectedTopics.includes("word-problems")) router.push("/word-problems-drill")
        else if (selectedTopics.includes("addition-subtraction")) router.push("/grade1-mode-select")
        else if (selectedTopics.includes("numerical-reasoning")) router.push("/numerical-reasoning-drill")
        else if (selectedTopics.includes("patterning-algebraic")) router.push("/patterning-drill")
        else if (selectedTopics.includes("measurement-data")) router.push("/measurement-data-drill")
        else if (selectedTopics.includes("geometric-spatial")) router.push("/geometric-spatial-drill")
        else router.push("/grade1-mode-select")
      } else if (grade === 2) {
        if (selectedTopics.includes("add-sub-100")) router.push("/grade2-addition-drill")
        else if (selectedTopics.includes("skip-counting")) router.push("/grade2-addition-drill")
        else router.push("/grade2-addition-drill")
      } else if (grade === 3) {
        if (selectedTopics.includes("multiplication")) router.push("/grade3-multiplication-drill")
        else if (selectedTopics.includes("division")) router.push("/grade3-division-drill")
        else router.push("/grade3-multiplication-drill")
      } else if (grade === 4) {
        if (selectedTopics.includes("grade4-numerical-reasoning")) router.push("/grade4-numerical-reasoning-drill")
        else if (selectedTopics.includes("grade4-patterning")) router.push("/grade4-patterning-drill")
        else if (selectedTopics.includes("grade4-measurement-data")) router.push("/grade4-measurement-data-drill")
        else if (selectedTopics.includes("grade4-geometric-spatial")) router.push("/grade4-geometric-spatial-drill")
        else if (selectedTopics.includes("multiplication")) router.push("/multiplication-drill")
        else if (selectedTopics.includes("division")) router.push("/division-drill")
        else router.push("/multiplication-drill")
      }
    } else {
      router.push("/practice")
    }
  }

  const handleSelectAll = () => {
    if (!grade) return
    const allTopicIds = TOPICS_BY_GRADE[grade].map((t) => t.id)
    setSelectedTopics(allTopicIds)
  }

  if (!grade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl text-slate-600">Loading...</div>
      </div>
    )
  }

  const topics = TOPICS_BY_GRADE[grade]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-slate-800">Choose Your Practice Topics</h1>
          <p className="text-lg text-slate-600">
            Select the math topics you&apos;d like to focus on. You can choose as many as you want!
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              className="px-6 py-2 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 bg-transparent"
            >
              Select All
            </Button>
            {selectedTopics.length > 0 && (
              <Button onClick={() => setSelectedTopics([])} variant="outline" className="px-6 py-2 rounded-xl border-2">
                Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id)
            return (
              <Card
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                    : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{topic.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-bold text-lg ${isSelected ? "text-white" : "text-slate-800"}`}>
                        {topic.name}
                      </h3>
                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-white" />
                      ) : (
                        <Circle className="w-6 h-6 flex-shrink-0 text-slate-300" />
                      )}
                    </div>
                    <p className={`text-sm ${isSelected ? "text-indigo-100" : "text-slate-600"}`}>
                      {topic.description}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4 pt-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Choose Your Practice Mode</h2>
            <p className="text-slate-600">Pick how you want to practice today!</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card
              onClick={() => setPracticeMode("adaptive")}
              className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                practiceMode === "adaptive"
                  ? "bg-purple-600 text-white border-purple-600 shadow-lg"
                  : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-md"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${practiceMode === "adaptive" ? "bg-purple-500" : "bg-purple-100"}`}>
                    <Sparkles className={`w-6 h-6 ${practiceMode === "adaptive" ? "text-white" : "text-purple-600"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${practiceMode === "adaptive" ? "text-white" : "text-slate-800"}`}>
                      Adaptive Practice
                    </h3>
                  </div>
                  {practiceMode === "adaptive" ? <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-white" /> : <Circle className="w-6 h-6 flex-shrink-0 text-slate-300" />}
                </div>
                <p className={`text-sm ${practiceMode === "adaptive" ? "text-purple-100" : "text-slate-600"}`}>
                  10 questions with hints, Vedic tricks, and instant feedback
                </p>
              </div>
            </Card>

            <Card
              onClick={() => setPracticeMode("speed-drill")}
              className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                practiceMode === "speed-drill"
                  ? "bg-orange-600 text-white border-orange-600 shadow-lg"
                  : "bg-white border-slate-200 hover:border-orange-300 hover:shadow-md"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${practiceMode === "speed-drill" ? "bg-orange-500" : "bg-orange-100"}`}>
                    <Clock className={`w-6 h-6 ${practiceMode === "speed-drill" ? "text-white" : "text-orange-600"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${practiceMode === "speed-drill" ? "text-white" : "text-slate-800"}`}>
                      5-Minute Speed Drill
                    </h3>
                  </div>
                  {practiceMode === "speed-drill" ? <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-white" /> : <Circle className="w-6 h-6 flex-shrink-0 text-slate-300" />}
                </div>
                <p className={`text-sm ${practiceMode === "speed-drill" ? "text-orange-100" : "text-slate-600"}`}>
                  50 rapid-fire problems in 5 minutes - build speed and fluency!
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <Button
            onClick={handleContinue}
            disabled={selectedTopics.length === 0}
            size="lg"
            className="px-12 py-6 text-xl rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedTopics.length === 0 ? "Select Topics to Continue" : "Start Practice! 🚀"}
          </Button>
        </div>
      </div>
    </div>
  )
}
