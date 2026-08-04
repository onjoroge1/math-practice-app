"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IOWA_UNITS, IOWA_TARGET, bandFor } from "@/lib/iowa-grade5"
import { currentStudentId, getAllProgress, type ProgressStore } from "@/lib/iowa-progress"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

const UNIT_ICON: Record<string, string> = {
  vocabulary: "📖",
  reading: "📚",
  "written-expression": "✍️",
  mathematics: "🔢",
  science: "🔬",
  "social-studies": "🌍",
  spelling: "🔤",
  capitalization: "🔠",
  punctuation: "✒️",
  computation: "🧮",
}

const TONE_CHIP: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  sky: "bg-sky-100 text-sky-700 border-sky-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
}

export default function IowaHubPage() {
  const router = useRouter()
  const [progress, setProgress] = useState<ProgressStore>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setProgress(getAllProgress(currentStudentId()))
    setReady(true)
  }, [])

  const attempted = Object.keys(progress).length
  const avgBest =
    attempted > 0
      ? Math.round(Object.values(progress).reduce((s, p) => s + p.best, 0) / attempted)
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/topic-select")}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {ready && attempted > 0 && (
            <div className="text-sm text-slate-600">
              {attempted}/{IOWA_UNITS.length} units started · avg best{" "}
              <span className="font-bold text-indigo-600">{avgBest}%</span>
            </div>
          )}
        </div>

        <div className="text-center space-y-3">
          <div className="text-6xl">🦉</div>
          <h1 className="text-4xl font-bold text-slate-800">Iowa Practice Battery</h1>
          <p className="text-lg text-slate-600">
            Grade 5 · pick a unit and answer about {IOWA_TARGET} questions. We choose fresh
            questions each time and track your progress.
          </p>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto">
            Independent practice material — not an official Iowa Assessments test. Scores are
            practice guidelines only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {IOWA_UNITS.map((unit) => {
            const p = progress[unit.id]
            const band = p ? bandFor(p.best) : null
            const target = Math.min(IOWA_TARGET, unit.poolSize)
            return (
              <Card
                key={unit.id}
                className="p-5 bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{UNIT_ICON[unit.id] ?? "📝"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-lg text-slate-800">{unit.name}</h3>
                      {band && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TONE_CHIP[band.tone]}`}
                        >
                          {p!.best}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{unit.primarySkills}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>
                        {target} of {unit.poolSize} questions
                      </span>
                      {p && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {p.seen.length}/{unit.poolSize} seen · {p.attempts}{" "}
                          {p.attempts === 1 ? "try" : "tries"}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <Link href={`/iowa/${unit.id}`}>
                        <Button
                          size="sm"
                          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        >
                          {p ? "Practice again" : "Start"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
