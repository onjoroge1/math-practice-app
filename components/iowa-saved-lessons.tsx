"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { readIowaAttempts, type IowaAttempt } from "@/lib/iowa-attempts"
import { getIowaUnit } from "@/lib/iowa-grade5"
import { syncIowaProgress } from "@/lib/iowa-sync"
import { IowaExplanation } from "./iowa-explanation"

export function IowaSavedLessons() {
  const [attempts, setAttempts] = useState<IowaAttempt[]>([])
  const [selected, setSelected] = useState("")
  const [index, setIndex] = useState(0)
  const [grade, setGrade] = useState(0)
  useEffect(() => {
    let cancelled = false
    try {
      const id = localStorage.getItem("currentStudentId")
      const currentGrade = Number(localStorage.getItem("currentStudentGrade"))
      setGrade(currentGrade)
      if (id && currentGrade === 5) {
        setAttempts(readIowaAttempts(id))
        void syncIowaProgress(id).then((result) => { if (!cancelled) setAttempts(result.attempts) })
      }
    } catch { /* The rest of the notebook remains readable. */ }
    return () => { cancelled = true }
  }, [])
  if (grade !== 5) return null
  const ordered = [...attempts].sort((a, b) => b.completedAt - a.completedAt)
  const attempt = ordered.find((a) => a.id === selected) ?? ordered[0]
  const unit = attempt ? getIowaUnit(attempt.unitId) : null
  const questions = unit && attempt ? attempt.questionNumbers.map((n) => unit.questions.find((q) => q.number === n)!).sort((a, b) => Number(attempt.answers[a.number] === a.answer) - Number(attempt.answers[b.number] === b.answer)) : []
  const question = questions[Math.min(index, questions.length - 1)]
  return <section className="space-y-4 rounded-2xl border border-indigo-200 bg-white p-4">
    <h2 className="text-2xl font-bold text-slate-900">📚 Iowa learning notebook</h2>
    <p className="text-sm text-slate-600">Revisit a completed exam. Missed questions come first.</p>
    {!attempt || !unit || !question ? <p className="text-slate-700">Complete an Iowa unit to save its worked lessons. <Link href="/iowa" className="text-indigo-700 underline">Choose a unit</Link></p> : <>
      <label className="block font-semibold text-slate-800">Choose a completed exam<select className="mt-2 block w-full rounded-xl border p-3 font-normal" value={attempt.id} onChange={(e) => { setSelected(e.target.value); setIndex(0) }}>{ordered.map((a) => <option key={a.id} value={a.id}>{getIowaUnit(a.unitId)?.name} · {new Date(a.completedAt).toLocaleString()}</option>)}</select></label>
      <p className="text-sm text-slate-700">Your answer: {attempt.answers[question.number]} · {attempt.answers[question.number] === question.answer ? "Correct" : "Let’s learn this one"}</p>
      <IowaExplanation unit={unit} question={question} showPrompt />
      <div className="flex items-center justify-between gap-2 text-slate-800"><button className="min-h-11 rounded-xl border px-3 disabled:opacity-40" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button><span>{Math.min(index + 1, questions.length)} / {questions.length}</span><button className="min-h-11 rounded-xl border px-3 disabled:opacity-40" disabled={index >= questions.length - 1} onClick={() => setIndex(index + 1)}>Next</button></div>
    </>}
  </section>
}
