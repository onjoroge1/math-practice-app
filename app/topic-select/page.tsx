"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getStudentAction } from "@/lib/actions"
import { trackTopicsSelected, trackPracticeStarted } from "@/lib/analytics"
import type { Grade, SkillCategory } from "@/lib/types"
import { CheckCircle2, Circle, Clock, Sparkles, ArrowRight } from "lucide-react"

interface Topic {
  id: string
  name: string
  description: string
  icon: string
  category: SkillCategory
}

/** Adaptive quizzes for students in Grades 3–5. */
const ADAPTIVE_QUIZZES: Topic[] = [
  { id: "mental-math-quiz", name: "Mental Math Quiz", description: "Adding and subtracting in your head — you pick the numbers", icon: "🧠", category: "addition" },
  { id: "multiplication-quiz", name: "Times Tables Quiz", description: "Choose your tables or mix them — starts easy and levels up", icon: "✖️", category: "multiplication" },
  { id: "division-quiz", name: "Division Quiz", description: "Sharing into equal groups — starts easy and levels up", icon: "➗", category: "division" },
]

const QUIZ_ROUTES: Record<string, string> = {
  "g2-addition-test": "/grade2-addition-test",
  "g2-subtraction-test": "/grade2-subtraction-test",
  "g2-multiplication-test": "/grade2-multiplication-test",
  "g2-division-test": "/grade2-division-test",
  "mental-math-quiz": "/mental-math-quiz",
  "multiplication-quiz": "/times-tables-quiz",
  "division-quiz": "/division-quiz",
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
    { id: "g2-addition-test", name: "Addition Test", description: "50 facts to 20 in a 3-minute worksheet", icon: "➕", category: "addition" },
    { id: "g2-subtraction-test", name: "Subtraction Test", description: "50 facts to 20 in a 3-minute worksheet", icon: "➖", category: "subtraction" },
    { id: "g2-multiplication-test", name: "Multiplication Test", description: "50 facts from the 2, 5, and 10 times tables", icon: "✖️", category: "multiplication" },
    { id: "g2-division-test", name: "Division Test", description: "50 exact division facts using 2, 5, and 10", icon: "➗", category: "division" },
    { id: "add-sub-100", name: "Addition & Subtraction to 100", description: "Add and subtract within 100 with strategies", icon: "➕", category: "addition" },
    { id: "place-value-1000", name: "Place Value to 1000", description: "Understand hundreds, tens, and ones", icon: "🔢", category: "place-value" },
    { id: "skip-counting", name: "Skip Counting & Multiplication Intro", description: "Count by 2s, 5s, and 10s", icon: "🔄", category: "multiplication" },
    { id: "measurement", name: "Measurement", description: "Measure using standard units", icon: "📏", category: "measurement" },
    { id: "time", name: "Time to 5 Minutes", description: "Tell time to the nearest 5 minutes", icon: "🕐", category: "time" },
    { id: "money", name: "Money & Making Change", description: "Count money and make change", icon: "💵", category: "money" },
  ],
  3: [
    ...ADAPTIVE_QUIZZES,
    { id: "multiplication", name: "Multiplication", description: "Master multiplication facts and strategies", icon: "✖️", category: "multiplication" },
    { id: "division", name: "Division", description: "Understand division and fact families", icon: "➗", category: "division" },
    { id: "fractions", name: "Fractions", description: "Understand unit fractions and equivalence", icon: "🍕", category: "fractions" },
    { id: "place-value", name: "Place Value & Rounding", description: "Work with numbers to 1000 and rounding", icon: "🔢", category: "place-value" },
    { id: "measurement", name: "Measurement & Data", description: "Solve problems with measurement", icon: "📊", category: "measurement" },
    { id: "geometry", name: "Geometry & Perimeter", description: "Explore shapes and perimeter", icon: "🔷", category: "geometry" },
  ],
  4: [
    ...ADAPTIVE_QUIZZES,
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
  5: [
    ...ADAPTIVE_QUIZZES,
    { id: "g5-place-value", name: "Place Value & Powers of 10", description: "Read, round, and scale large numbers by powers of 10", icon: "🔢", category: "place-value" },
    { id: "g5-operations", name: "Multiplication & Division", description: "Multi-digit multiplication and long division", icon: "✖️", category: "multiplication" },
    { id: "g5-decimals", name: "Decimals", description: "Add, subtract, multiply, and round decimals", icon: "🔟", category: "decimals" },
    { id: "g5-fractions", name: "Fractions", description: "Add, subtract, multiply, and divide fractions", icon: "🍰", category: "fractions" },
    { id: "g5-expressions", name: "Expressions & Order of Operations", description: "Evaluate expressions using order of operations", icon: "🧮", category: "operations-algebraic" },
    { id: "g5-measurement", name: "Measurement, Volume & Data", description: "Unit conversions, volume, and reading data", icon: "📊", category: "measurement" },
  ],
}

export default function TopicSelectPage() {
  const router = useRouter()
  const [grade, setGrade] = useState<Grade | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [practiceMode, setPracticeMode] = useState<"adaptive" | "speed-drill">("adaptive")
  const [loadError, setLoadError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    async function loadStudent() {
      setLoadError("")
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
        setLoadError("We couldn't load this profile. Please check the connection and try again.")
      }
    }
    loadStudent()
  }, [router, reloadToken])

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]))
  }

  const handleContinue = () => {
    localStorage.setItem("selectedTopics", JSON.stringify(selectedTopics))
    if (grade) {
      trackTopicsSelected(selectedTopics, grade)
      trackPracticeStarted(grade, practiceMode)
    }

    // The adaptive quizzes carry their own settings screen and difficulty
    // ladder, so they run the same way in either practice mode, for any grade.
    const quizTopic = selectedTopics.find((t) => t in QUIZ_ROUTES)
    if (quizTopic) {
      router.push(QUIZ_ROUTES[quizTopic])
      return
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
        else if (selectedTopics.includes("place-value-1000")) router.push("/grade2-place-value-drill")
        else if (selectedTopics.includes("skip-counting")) router.push("/grade2-skip-counting-drill")
        // measurement / time / money are concept topics → adaptive practice
        else router.push("/practice")
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
      } else if (grade === 5) {
        if (selectedTopics.includes("g5-decimals")) router.push("/grade5-decimals-drill")
        else if (selectedTopics.includes("g5-fractions")) router.push("/grade5-fractions-drill")
        else router.push("/grade5-operations-drill")
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
        {loadError ? (
          <Card className="mx-4 max-w-md space-y-4 rounded-3xl p-8 text-center shadow-xl">
            <div className="text-5xl">🔌</div>
            <h1 className="text-2xl font-bold text-slate-800">Profile unavailable</h1>
            <p role="alert" className="text-slate-600">{loadError}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => setReloadToken((value) => value + 1)}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/")}>Choose Profile</Button>
            </div>
          </Card>
        ) : (
          <div className="text-2xl text-slate-600">Loading...</div>
        )}
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

        {grade === 5 && (
          <div className="space-y-4">
            <Link href="/grade5-social-studies" className="block">
              <Card className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-pointer hover:shadow-xl transition-all border-0">
                <div className="flex items-center gap-4">
                  <div className="text-4xl flex-shrink-0">📚</div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">New • Exam Wednesday</div>
                    <h3 className="font-bold text-lg">Social Studies Exam Prep</h3>
                    <p className="text-sm text-orange-50">Chapter 7, Chapter 8, and a mixed final review built from Aden&apos;s class materials</p>
                  </div>
                  <ArrowRight className="w-6 h-6 flex-shrink-0" />
                </div>
              </Card>
            </Link>
            <Link href="/iowa" className="block">
              <Card className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer hover:shadow-xl transition-all border-0">
                <div className="flex items-center gap-4">
                  <div className="text-4xl flex-shrink-0">🦉</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">Iowa Practice Battery</h3>
                    <p className="text-sm text-indigo-100">10 units · about 25 questions each · fresh questions every time with progress tracking</p>
                  </div>
                  <ArrowRight className="w-6 h-6 flex-shrink-0" />
                </div>
              </Card>
            </Link>
          </div>
        )}

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
