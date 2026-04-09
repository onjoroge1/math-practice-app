"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AVATARS, SKILLS } from "@/lib/mock-data"
import { getStudentAction, getMasteryAction } from "@/lib/actions"

interface StudentData {
  id: string
  name: string
  grade: number
  avatar: string
  total_coins: number
  current_streak: number
}

interface MasteryRow {
  skill_id: string
  mastery_level: number
  attempts_count: number
  correct_count: number
}

export default function SummaryPage() {
  const router = useRouter()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [studentMastery, setStudentMastery] = useState<MasteryRow[]>([])

  useEffect(() => {
    async function load() {
      const id = localStorage.getItem("currentStudentId")
      if (!id) {
        router.push("/onboarding")
        return
      }

      const data = await getStudentAction(id)
      if (!data) {
        router.push("/onboarding")
        return
      }

      setStudent(data as StudentData)

      try {
        const mastery = await getMasteryAction(id)
        setStudentMastery((mastery as MasteryRow[]) ?? [])
      } catch {
        setStudentMastery([])
      }
    }
    load()
  }, [router])

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-6xl animate-bounce">📊</div>
      </div>
    )
  }

  const avatar = AVATARS.find((a) => a.id === student.avatar)
  const gradeSkills = SKILLS.filter((s) => s.grade === student.grade)

  const totalMasteryPoints = studentMastery.reduce((sum, m) => sum + (m.mastery_level ?? 0), 0)
  const maxMasteryPoints = gradeSkills.length * 5
  const overallProgress = maxMasteryPoints > 0 ? (totalMasteryPoints / maxMasteryPoints) * 100 : 0

  const getPracticeModes = () => {
    switch (student.grade) {
      case 1:
        return [
          { title: "Adaptive Practice", emoji: "🎯", description: "10 problems that adjust to your level with hints and explanations", link: "/practice", bgGradient: "from-indigo-50 to-indigo-100", borderColor: "border-indigo-300" },
          { title: "5-Minute Speed Drill", emoji: "⚡", description: "50 rapid-fire addition and subtraction problems", link: "/timed-drill", bgGradient: "from-orange-50 to-amber-100", borderColor: "border-orange-300" },
        ]
      case 2:
        return [
          { title: "Adaptive Practice", emoji: "🎯", description: "10 problems that adjust to your level with hints and explanations", link: "/practice", bgGradient: "from-indigo-50 to-indigo-100", borderColor: "border-indigo-300" },
          { title: "Addition Speed Drill", emoji: "➕", description: "50 rapid-fire addition problems in 5 minutes", link: "/grade2-addition-drill", bgGradient: "from-green-50 to-emerald-100", borderColor: "border-green-300" },
          { title: "Subtraction Speed Drill", emoji: "➖", description: "50 rapid-fire subtraction problems in 5 minutes", link: "/grade2-subtraction-drill", bgGradient: "from-blue-50 to-cyan-100", borderColor: "border-blue-300" },
        ]
      case 3:
        return [
          { title: "Adaptive Practice", emoji: "🎯", description: "10 problems that adjust to your level with hints and explanations", link: "/practice", bgGradient: "from-indigo-50 to-indigo-100", borderColor: "border-indigo-300" },
          { title: "Multiplication Speed Drill", emoji: "✖️", description: "50 rapid-fire multiplication problems in 5 minutes", link: "/grade3-multiplication-drill", bgGradient: "from-purple-50 to-violet-100", borderColor: "border-purple-300" },
          { title: "Division Speed Drill", emoji: "➗", description: "50 rapid-fire division problems in 5 minutes", link: "/grade3-division-drill", bgGradient: "from-pink-50 to-rose-100", borderColor: "border-pink-300" },
        ]
      case 4:
        return [
          { title: "Adaptive Practice", emoji: "🎯", description: "10 problems that adjust to your level with hints and explanations", link: "/practice", bgGradient: "from-indigo-50 to-indigo-100", borderColor: "border-indigo-300" },
          { title: "Multiplication Mastery", emoji: "✖️", description: "50 multiplication problems (2-12 times tables) in 5 minutes", link: "/multiplication-drill", bgGradient: "from-purple-50 to-violet-100", borderColor: "border-purple-300" },
          { title: "Division Mastery", emoji: "➗", description: "50 division problems (2-12 divisors) in 5 minutes", link: "/division-drill", bgGradient: "from-pink-50 to-rose-100", borderColor: "border-pink-300" },
        ]
      default:
        return [
          { title: "Adaptive Practice", emoji: "🎯", description: "10 problems that adjust to your level", link: "/practice", bgGradient: "from-indigo-50 to-indigo-100", borderColor: "border-indigo-300" },
        ]
    }
  }

  const practiceModes = getPracticeModes()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto pt-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">{avatar?.emoji ?? "🎓"}</div>
          <h1 className="text-3xl font-bold text-slate-800">Great work, {student.name}!</h1>
          <p className="text-lg text-slate-600">Keep up the amazing progress</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-6 bg-white/90 backdrop-blur shadow-lg rounded-2xl text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-bold text-orange-600">{student.current_streak ?? 0}</div>
            <div className="text-sm text-slate-600">Day Streak</div>
          </Card>
          <Card className="p-6 bg-white/90 backdrop-blur shadow-lg rounded-2xl text-center">
            <div className="text-4xl mb-2">🪙</div>
            <div className="text-3xl font-bold text-pink-600">{student.total_coins ?? 0}</div>
            <div className="text-sm text-slate-600">Total Coins</div>
          </Card>
          <Card className="p-6 bg-white/90 backdrop-blur shadow-lg rounded-2xl text-center">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-3xl font-bold text-indigo-600">{Math.round(overallProgress)}%</div>
            <div className="text-sm text-slate-600">Grade Progress</div>
          </Card>
        </div>

        <Card className="p-6 bg-white/90 backdrop-blur shadow-lg rounded-2xl">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Your Skills</h2>
          <div className="space-y-4">
            {gradeSkills.map((skill) => {
              const mastery = studentMastery.find((m) => m.skill_id === skill.id)
              const level = mastery?.mastery_level ?? 0
              const progress = (level / 5) * 100

              return (
                <div key={skill.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">{skill.name}</span>
                    <span className="text-sm text-slate-600">
                      Level {level}/5
                      {level === 5 && <span className="ml-2">⭐</span>}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6 bg-white/90 backdrop-blur shadow-lg rounded-2xl">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Choose Your Practice Mode</h2>
          <div className={`grid gap-4 ${practiceModes.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {practiceModes.map((mode, idx) => (
              <button
                key={idx}
                onClick={() => router.push(mode.link)}
                className={`p-6 bg-gradient-to-br ${mode.bgGradient} border-2 ${mode.borderColor} rounded-2xl hover:shadow-lg hover:scale-105 transition-all text-left`}
              >
                <div className="text-4xl mb-3">{mode.emoji}</div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">{mode.title}</h3>
                <p className="text-sm text-slate-600">{mode.description}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Link href="/topic-select">
            <Button className="py-6 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl" size="lg">
              Pick New Topics
            </Button>
          </Link>
          <Link href="/parent">
            <Button
              variant="outline"
              className="py-6 px-8 text-lg border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl bg-transparent"
              size="lg"
            >
              Parent Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
