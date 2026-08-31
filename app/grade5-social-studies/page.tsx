"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SOCIAL_STUDIES_TESTS } from "@/lib/grade5-social-studies"
import { currentStudentContext } from "@/lib/iowa-progress"
import { getAllSocialStudiesProgress, type SocialStudiesProgressStore } from "@/lib/social-studies-progress"

export default function Grade5SocialStudiesPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState<SocialStudiesProgressStore>({})

  useEffect(() => {
    const student = currentStudentContext()
    if (!student || student.grade !== 5) {
      router.replace("/topic-select")
      return
    }
    setProgress(getAllSocialStudiesProgress(student.id))
    setReady(true)
  }, [router])

  if (!ready) {
    return <main className="flex min-h-screen items-center justify-center bg-amber-50 text-xl font-semibold text-slate-600">Loading Aden&apos;s exam prep…</main>
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <Button variant="ghost" onClick={() => router.push("/topic-select")} className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to topics
        </Button>

        <header className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="text-7xl" aria-hidden="true">📚</div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">Aden • Grade 5</p>
              <h1 className="mt-2 text-4xl font-black sm:text-5xl">Wednesday Social Studies Exam Prep</h1>
              <p className="mt-3 max-w-3xl text-base font-medium text-orange-50 sm:text-lg">
                Practice built directly from the Chapter 7 and Chapter 8 class materials. Every completed test saves Aden&apos;s best score and explains missed answers.
              </p>
            </div>
          </div>
        </header>

        <section aria-labelledby="study-plan-heading">
          <Card className="rounded-3xl border-indigo-200 bg-indigo-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <CalendarDays className="mt-1 h-8 w-8 flex-none text-indigo-600" aria-hidden="true" />
              <div>
                <h2 id="study-plan-heading" className="text-xl font-black text-indigo-950">Simple study plan</h2>
                <ol className="mt-3 grid gap-3 text-sm text-indigo-900 sm:grid-cols-3">
                  <li className="rounded-2xl bg-white/80 p-4"><strong>1. Chapter 7:</strong> complete the test and read every missed explanation.</li>
                  <li className="rounded-2xl bg-white/80 p-4"><strong>2. Chapter 8:</strong> aim for at least 80%, then retry the missed areas.</li>
                  <li className="rounded-2xl bg-white/80 p-4"><strong>3. Final review:</strong> take the mixed test without notes before Wednesday.</li>
                </ol>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-3" aria-label="Social studies practice tests">
          {SOCIAL_STUDIES_TESTS.map((test) => {
            const testProgress = progress[test.id]
            return (
              <Card key={test.id} className="flex flex-col rounded-3xl border-amber-200 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl">
                <div className="text-5xl" aria-hidden="true">{test.icon}</div>
                <h2 className="mt-4 text-xl font-black text-slate-900">{test.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{test.description}</p>

                {testProgress ? (
                  <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center">
                    <div><p className="text-[10px] font-black uppercase text-slate-500">Best</p><p className="text-lg font-black text-emerald-700">{testProgress.best}%</p></div>
                    <div><p className="text-[10px] font-black uppercase text-slate-500">Latest</p><p className="text-lg font-black text-slate-800">{testProgress.last}%</p></div>
                    <div><p className="text-[10px] font-black uppercase text-slate-500">Attempts</p><p className="text-lg font-black text-slate-800">{testProgress.attempts}</p></div>
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
                    <BookOpen className="h-4 w-4" /> Not started yet
                  </div>
                )}

                <Link href={`/grade5-social-studies/${test.id}`} className="mt-5">
                  <Button className="w-full rounded-xl bg-orange-500 font-black text-white hover:bg-orange-600">
                    {testProgress ? "Practice again" : "Start test"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            )
          })}
        </section>

        <Card className="rounded-3xl border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-4">
            <Trophy className="mt-1 h-8 w-8 flex-none text-emerald-600" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-black text-emerald-950">Aden&apos;s target</h2>
              <p className="mt-1 text-sm leading-relaxed text-emerald-900">
                Aim for 80% or better on both chapter tests, then 85% or better on the mixed review. The goal is understanding—not memorizing the A/B/C/D position.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
