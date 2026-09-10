"use client"

import { useState } from "react"
import type { IowaQuestion, IowaUnit } from "@/lib/iowa-grade5"
import { IowaExplanation } from "./iowa-explanation"

export function IowaAttemptReview({ unit, questions, answers }: { unit: IowaUnit; questions: IowaQuestion[]; answers: Record<number, string> }) {
  const [all, setAll] = useState(false)
  const [index, setIndex] = useState(0)
  const missed = questions.filter((q) => answers[q.number] !== q.answer)
  const shown = all || missed.length === 0 ? questions : missed
  const position = Math.min(index, shown.length - 1)
  const q = shown[position]
  if (!q) return null
  const chosen = q.choices.find((choice) => choice.label === answers[q.number])
  return <section className="space-y-4 rounded-2xl bg-white p-4 sm:p-6" aria-label="Iowa learning review">
    <h2 className="text-xl font-black text-slate-900">Learn one question at a time</h2>
    <div className="flex flex-wrap gap-2">
      <button className="min-h-11 rounded-xl border px-3 text-slate-800 aria-pressed:bg-indigo-100" aria-pressed={!all} onClick={() => { setAll(false); setIndex(0) }}>Needs practice ({missed.length})</button>
      <button className="min-h-11 rounded-xl border px-3 text-slate-800 aria-pressed:bg-indigo-100" aria-pressed={all} onClick={() => { setAll(true); setIndex(0) }}>All examples ({questions.length})</button>
    </div>
    <p className="text-sm text-slate-700">Your answer: {chosen ? `${chosen.label}. ${chosen.text}` : "Not answered"} · {answers[q.number] === q.answer ? "Correct" : "Let’s work it out"}</p>
    <IowaExplanation unit={unit} question={q} showPrompt />
    <div className="flex items-center justify-between gap-2 text-slate-800">
      <button disabled={position === 0} onClick={() => setIndex(position - 1)} className="min-h-11 rounded-xl border px-3 disabled:opacity-40">Previous example</button>
      <span className="text-sm">{position + 1} / {shown.length}</span>
      <button disabled={position === shown.length - 1} onClick={() => setIndex(position + 1)} className="min-h-11 rounded-xl bg-indigo-600 px-3 text-white disabled:opacity-40">Next example</button>
    </div>
  </section>
}
