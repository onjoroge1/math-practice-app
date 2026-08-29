"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AVATARS, SKILLS } from "@/lib/mock-data"
import { getStudentsForParentAction, getMasteryAction, getOrCreateProfileStudentAction } from "@/lib/actions"
import { PROFILES } from "@/lib/profiles"

interface StudentRow {
  id: string
  name: string
  grade: number
  avatar: string
  total_coins: number
  current_streak: number
  longest_streak: number
}

interface MasteryRow {
  skill_id: string
  mastery_level: number
  attempts_count: number
  correct_count: number
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null)
  const [studentMastery, setStudentMastery] = useState<MasteryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Both boys should appear in the portal whether or not they have
        // practiced yet, so provision their rows before listing.
        await Promise.all(
          PROFILES.map((p) => getOrCreateProfileStudentAction(p.name, p.grade, p.avatar)),
        )
        const rows = await getStudentsForParentAction()
        const mapped = (rows as StudentRow[]) ?? []
        // Amir first, then Aden; any legacy rows sort after them.
        const order = PROFILES.map((p) => p.name.toLowerCase())
        const rank = (n: string) => {
          const i = order.indexOf(n.toLowerCase())
          return i === -1 ? order.length : i
        }
        const sorted = [...mapped].sort((a, b) => rank(a.name) - rank(b.name))
        setStudents(sorted)
        if (sorted.length > 0) {
          setSelectedStudent(sorted[0])
        }
      } catch {
        setStudents([])
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedStudent) return
    async function loadMastery() {
      try {
        const data = await getMasteryAction(selectedStudent!.id)
        setStudentMastery((data as MasteryRow[]) ?? [])
      } catch {
        setStudentMastery([])
      }
    }
    loadMastery()
  }, [selectedStudent])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-2xl text-slate-600">Loading dashboard...</div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">👨‍👩‍👦</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Progress Yet</h2>
          <p className="text-gray-600 mb-6">
            {PROFILES.map((p) => p.name).join(" and ")} haven&apos;t practiced yet — or the database is
            unreachable. Progress appears here after their first session.
          </p>
          <Link href="/">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Go to Practice</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const student = selectedStudent || students[0]
  const avatar = AVATARS.find((a) => a.id === student.avatar)
  const gradeSkills = SKILLS.filter((s) => s.grade === student.grade)

  const totalAttempts = studentMastery.reduce((sum, m) => sum + (m.attempts_count ?? 0), 0)
  const totalCorrect = studentMastery.reduce((sum, m) => sum + (m.correct_count ?? 0), 0)
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  const masteredSkills = studentMastery.filter((m) => m.mastery_level === 5).length
  const inProgressSkills = studentMastery.filter((m) => m.mastery_level > 0 && m.mastery_level < 5).length
  const notStartedSkills = gradeSkills.length - masteredSkills - inProgressSkills

  const totalMasteryPoints = studentMastery.reduce((sum, m) => sum + (m.mastery_level ?? 0), 0)
  const maxMasteryPoints = gradeSkills.length * 5
  const gradeProgress = maxMasteryPoints > 0 ? Math.round((totalMasteryPoints / maxMasteryPoints) * 100) : 0

  const skillsByCategory = gradeSkills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = []
      acc[skill.category].push(skill)
      return acc
    },
    {} as Record<string, typeof gradeSkills>,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {session?.user?.name ? `Welcome, ${session.user.name}` : "Track your child's learning progress"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {students.length > 1 && (
                <select
                  value={student.id}
                  onChange={(e) => setSelectedStudent(students.find((s) => s.id === e.target.value) || students[0])}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-medium"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-6 bg-white shadow-md">
          <div className="flex items-center gap-6">
            <div className="text-7xl">{avatar?.emoji ?? "🎓"}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-gray-600">Grade {student.grade}</p>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="font-bold text-orange-600">{student.current_streak ?? 0} days</div>
                    <div className="text-xs text-orange-700">Current Streak</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-pink-100 px-4 py-2 rounded-lg">
                  <span className="text-2xl">🪙</span>
                  <div>
                    <div className="font-bold text-pink-600">{student.total_coins ?? 0}</div>
                    <div className="text-xs text-pink-700">Coins Earned</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600">{gradeProgress}%</div>
              <div className="text-sm text-gray-600 mt-1">Grade {student.grade} Progress</div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6 bg-white shadow-md"><div className="text-center"><div className="text-3xl mb-2">✅</div><div className="text-3xl font-bold text-gray-900">{totalAttempts}</div><div className="text-sm text-gray-600">Problems Attempted</div></div></Card>
          <Card className="p-6 bg-white shadow-md"><div className="text-center"><div className="text-3xl mb-2">🎯</div><div className="text-3xl font-bold text-green-600">{overallAccuracy}%</div><div className="text-sm text-gray-600">Overall Accuracy</div></div></Card>
          <Card className="p-6 bg-white shadow-md"><div className="text-center"><div className="text-3xl mb-2">⭐</div><div className="text-3xl font-bold text-yellow-600">{masteredSkills}</div><div className="text-sm text-gray-600">Skills Mastered</div></div></Card>
          <Card className="p-6 bg-white shadow-md"><div className="text-center"><div className="text-3xl mb-2">📚</div><div className="text-3xl font-bold text-blue-600">{inProgressSkills}</div><div className="text-sm text-gray-600">Skills In Progress</div></div></Card>
        </div>

        <Card className="p-6 bg-white shadow-md">
          <Tabs defaultValue="skills" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="skills">Skills Breakdown</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="space-y-4">
              {gradeSkills.map((skill) => {
                const mastery = studentMastery.find((m) => m.skill_id === skill.id)
                const level = mastery?.mastery_level ?? 0
                const attempts = mastery?.attempts_count ?? 0
                const accuracy = attempts > 0 ? Math.round(((mastery?.correct_count ?? 0) / attempts) * 100) : 0
                const progress = (level / 5) * 100

                return (
                  <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-gray-900">{skill.name}</h3>
                          {level === 5 && <span className="text-2xl">⭐</span>}
                        </div>
                        <p className="text-sm text-gray-600">{skill.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">Level {level}/5</div>
                        {attempts > 0 && <div className="text-xs text-gray-500">{accuracy}% accuracy</div>}
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                    {attempts > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {mastery?.correct_count ?? 0} correct out of {attempts} attempts
                      </div>
                    )}
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              {Object.entries(skillsByCategory).map(([category, skills]) => {
                const categoryMastery = skills.map((skill) => {
                  const mastery = studentMastery.find((m) => m.skill_id === skill.id)
                  return mastery?.mastery_level ?? 0
                })
                const avgMastery = categoryMastery.reduce((a, b) => a + b, 0) / categoryMastery.length
                const categoryProgress = (avgMastery / 5) * 100

                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900 capitalize">{category.replace("-", " ")}</h3>
                      <span className="text-sm font-medium text-gray-700">{Math.round(categoryProgress)}%</span>
                    </div>
                    <Progress value={categoryProgress} className="h-3 mb-3" />
                    <div className="grid sm:grid-cols-2 gap-2">
                      {skills.map((skill) => {
                        const mastery = studentMastery.find((m) => m.skill_id === skill.id)
                        const level = mastery?.mastery_level ?? 0
                        return (
                          <div key={skill.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{skill.name}</span>
                            <span className="font-medium text-gray-900">{level}/5 {level === 5 && "⭐"}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6 bg-indigo-50 border-2 border-indigo-200 shadow-md">
          <h3 className="font-bold text-lg text-indigo-900 mb-3">💡 Recommendations</h3>
          <div className="space-y-2 text-gray-700">
            {(student.current_streak ?? 0) === 0 && <p>• Encourage daily practice to build a learning streak!</p>}
            {(student.current_streak ?? 0) > 0 && (student.current_streak ?? 0) < 7 && (
              <p>• Great start! Keep the {student.current_streak}-day streak going!</p>
            )}
            {(student.current_streak ?? 0) >= 7 && <p>• Amazing {student.current_streak}-day streak! Consistency is key to mastery.</p>}
            {notStartedSkills > 0 && <p>• {notStartedSkills} skills haven&apos;t been started yet.</p>}
            {inProgressSkills > 0 && <p>• Focus on the {inProgressSkills} skills in progress to reach mastery faster.</p>}
            {overallAccuracy < 70 && overallAccuracy > 0 && (
              <p>• Consider reviewing concepts together — accuracy is below 70%. The adaptive system will adjust.</p>
            )}
            {overallAccuracy >= 90 && <p>• Excellent accuracy! {student.name} is doing great!</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
